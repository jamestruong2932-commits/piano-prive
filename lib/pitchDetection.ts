"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";
import { frequencyToNote, type NoteInfo } from "./noteUtils";

const FFT_SIZE = 2048;
const MIN_CLARITY = 0.9;
const MIN_FREQUENCY = 27.5; // A0, lowest piano key
const MAX_FREQUENCY = 4186; // C8, highest piano key

export interface PitchReading {
  note: NoteInfo | null;
  frequency: number;
  clarity: number;
}

export type MicPermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

interface UsePitchDetectorResult {
  reading: PitchReading;
  permission: MicPermissionState;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

const IDLE_READING: PitchReading = { note: null, frequency: 0, clarity: 0 };

/**
 * Listens to the microphone and continuously reports the detected musical
 * note using the McLeod Pitch Method (via the `pitchy` library).
 */
export function usePitchDetector(): UsePitchDetectorResult {
  const [reading, setReading] = useState<PitchReading>(IDLE_READING);
  const [permission, setPermission] = useState<MicPermissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

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
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      detector.clarityThreshold = MIN_CLARITY;
      const input = new Float32Array(detector.inputLength);

      setPermission("granted");

      const tick = () => {
        analyser.getFloatTimeDomainData(input);
        const [frequency, clarity] = detector.findPitch(input, audioContext.sampleRate);

        if (
          clarity >= MIN_CLARITY &&
          frequency >= MIN_FREQUENCY &&
          frequency <= MAX_FREQUENCY
        ) {
          setReading({ note: frequencyToNote(frequency), frequency, clarity });
        } else {
          setReading({ note: null, frequency: 0, clarity: 0 });
        }

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

  return { reading, permission, errorMessage, start, stop };
}
