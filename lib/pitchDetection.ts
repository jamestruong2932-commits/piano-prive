"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";
import { frequencyToNote, midiToFrequency, type NoteInfo } from "./noteUtils";

// Small window for monophonic pitch tracking (McLeod Pitch Method): a piano
// note's onset transient (hammer strike, inharmonic) pollutes whatever window
// it falls in, so a short window clears the transient and reaches a clean,
// periodic-enough signal fast. A large window here made single-note detection
// noticeably less responsive, often requiring several strikes to register.
const MONO_FFT_SIZE = 2048;
// Large enough to resolve semitones down near C3 (piano bass notes used in
// two-hand lessons) when scanning the frequency spectrum for chord detection.
// Only used on the multi-note path, so it doesn't affect single-note latency.
const CHORD_FFT_SIZE = 8192;
const MIN_CLARITY = 0.9;
const MIN_FREQUENCY = 27.5; // A0, lowest piano key
const MAX_FREQUENCY = 4186; // C8, highest piano key
const CENTS_TOLERANCE = 45;
// How many dB a candidate note's peak must clear the frame's noise floor
// to be considered "sounding". Heuristic, not validated against a real
// piano/mic — expect to retune after real-world testing. Lowered from an
// initial 12dB: real-world use with dense multi-note chords (a full-song
// transcription can ask for 3-5 simultaneous notes across both hands) found
// the stricter margin made quieter notes in a chord — especially bass notes
// struck softer than the melody — fail to register, stalling progress.
const PRESENCE_MARGIN_DB = 8;
// Absolute safety net: reject candidates outright below this, even if they
// technically clear the relative margin (guards against near-silence where
// the whole spectrum sits at a flat, low floor and tiny fluctuations could
// otherwise "clear" a relative-only threshold).
const PRESENCE_ABSOLUTE_FLOOR_DB = -75;
const PRESENCE_BIN_WINDOW = 3;
// The monophonic path (unlike the chord path above) had no loudness check at
// all — only clarity/frequency. A piano note's decay tail stays periodic
// enough to keep reading as a "clear pitch" well after the strike, and its
// octave harmonic in particular can ring on louder, relatively, than the
// fading fundamental. If the next lesson step asks for that octave, the
// still-ringing previous note's harmonic can register as the new note being
// played before it's actually struck — a false advance ("nhảy nốt"). Gating
// on RMS loudness rejects that quiet tail while a genuine new strike, which
// is much louder, still passes easily. Heuristic, not validated against a
// real piano/mic — expect to retune after real-world testing.
const MIN_MONO_RMS_DB = -50;

export interface PitchReading {
  note: NoteInfo | null;
  frequency: number;
  clarity: number;
}

export type MicPermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

interface UsePitchDetectorResult {
  reading: PitchReading;
  /** MIDI notes from `candidateMidis` currently judged to be sounding. */
  detectedMidis: Set<number>;
  permission: MicPermissionState;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const IDLE_READING: PitchReading = { note: null, frequency: 0, clarity: 0 };

function estimateNoiseFloorDb(freqData: Float32Array): number {
  // A low percentile is far more robust than the mean here: a handful of
  // genuine harmonic peaks (or a couple of noisy bins) skew the mean upward
  // and make real notes harder to detect, whereas most of a piano/room
  // spectrum's mass sits at the true background level.
  const sorted = Float32Array.from(freqData).sort();
  return sorted[Math.floor(sorted.length * 0.25)];
}

function computeRmsDb(timeInput: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < timeInput.length; i++) sumSquares += timeInput[i] * timeInput[i];
  const rms = Math.sqrt(sumSquares / timeInput.length);
  return 20 * Math.log10(rms || 1e-10);
}

function isFrequencyPresent(
  freqData: Float32Array,
  binWidth: number,
  targetFrequency: number,
  noiseFloorDb: number
): boolean {
  const centerBin = Math.round(targetFrequency / binWidth);
  let peakDb = -Infinity;
  for (
    let bin = Math.max(0, centerBin - PRESENCE_BIN_WINDOW);
    bin <= Math.min(freqData.length - 1, centerBin + PRESENCE_BIN_WINDOW);
    bin++
  ) {
    if (freqData[bin] > peakDb) peakDb = freqData[bin];
  }
  return peakDb > PRESENCE_ABSOLUTE_FLOOR_DB && peakDb > noiseFloorDb + PRESENCE_MARGIN_DB;
}

/**
 * Listens to the microphone and reports which of the given candidate MIDI
 * notes are currently sounding.
 *
 * - When `candidateMidis` has at most one note, matching uses the precise
 *   monophonic pitch reading (McLeod Pitch Method via `pitchy`).
 * - When it has two or more (a chord/two-hand step), matching instead scans
 *   the frequency spectrum for energy near each candidate's frequency, since
 *   a single autocorrelation-based pitch reading can't represent multiple
 *   simultaneous notes.
 */
export function usePitchDetector(candidateMidis: number[]): UsePitchDetectorResult {
  const [reading, setReading] = useState<PitchReading>(IDLE_READING);
  const [detectedMidis, setDetectedMidis] = useState<Set<number>>(new Set());
  const [permission, setPermission] = useState<MicPermissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const candidateMidisRef = useRef<number[]>(candidateMidis);

  useEffect(() => {
    candidateMidisRef.current = candidateMidis;
  }, [candidateMidis]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    setReading(IDLE_READING);
    setDetectedMidis(new Set());
    setPermission("idle");
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const monoAnalyser = audioContext.createAnalyser();
      monoAnalyser.fftSize = MONO_FFT_SIZE;
      source.connect(monoAnalyser);

      const chordAnalyser = audioContext.createAnalyser();
      chordAnalyser.fftSize = CHORD_FFT_SIZE;
      source.connect(chordAnalyser);

      const detector = PitchDetector.forFloat32Array(monoAnalyser.fftSize);
      detector.clarityThreshold = MIN_CLARITY;
      const timeInput = new Float32Array(detector.inputLength);
      const freqInput = new Float32Array(chordAnalyser.frequencyBinCount);
      const binWidth = audioContext.sampleRate / CHORD_FFT_SIZE;

      setPermission("granted");

      const tick = () => {
        monoAnalyser.getFloatTimeDomainData(timeInput);
        const [frequency, clarity] = detector.findPitch(timeInput, audioContext.sampleRate);

        const hasClearPitch =
          clarity >= MIN_CLARITY &&
          frequency >= MIN_FREQUENCY &&
          frequency <= MAX_FREQUENCY &&
          computeRmsDb(timeInput) >= MIN_MONO_RMS_DB;
        const note = hasClearPitch ? frequencyToNote(frequency) : null;
        setReading(
          hasClearPitch ? { note, frequency, clarity } : { note: null, frequency: 0, clarity: 0 }
        );

        const candidates = candidateMidisRef.current;
        let matched: Set<number>;
        if (candidates.length <= 1) {
          matched =
            note && candidates.includes(note.midi) && Math.abs(note.cents) <= CENTS_TOLERANCE
              ? new Set([note.midi])
              : new Set();
        } else {
          chordAnalyser.getFloatFrequencyData(freqInput);
          const noiseFloorDb = estimateNoiseFloorDb(freqInput);
          matched = new Set(
            candidates.filter((midi) =>
              isFrequencyPresent(freqInput, binWidth, midiToFrequency(midi), noiseFloorDb)
            )
          );
        }
        setDetectedMidis(matched);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setPermission(err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "error");
      setErrorMessage(err instanceof Error ? err.message : "Không thể truy cập microphone.");
    }
  }, []);

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reading, detectedMidis, permission, errorMessage, start, stop };
}
