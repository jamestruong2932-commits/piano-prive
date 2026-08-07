import type { Lesson } from "./lessons";
import { groupNotesIntoSteps, splitHandByPitch, type RawNote } from "./noteSteps";

const MODEL_URL = "/basic-pitch-model/model.json";
// Basic Pitch requires exactly this sample rate, mono — it does not
// resample internally, so we must do it ourselves before calling it.
const TARGET_SAMPLE_RATE = 22050;
// Thresholds/min length passed straight to Basic Pitch's note-decoding step.
// Untuned heuristic starting points (can't be validated against a real
// piano recording in this environment) — expect to retune after real use.
const ONSET_THRESHOLD = 0.5;
const FRAME_THRESHOLD = 0.3;
const MIN_NOTE_LENGTH_FRAMES = 5;

async function decodeAndResample(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const decodeContext = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeContext.decodeAudioData(arrayBuffer);
  } finally {
    decodeContext.close();
  }

  const offlineContext = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
    TARGET_SAMPLE_RATE
  );
  const source = offlineContext.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineContext.destination);
  source.start();
  return offlineContext.startRendering();
}

/**
 * Transcribes a solo-piano audio recording into a Lesson using Basic Pitch
 * (an open-source audio-to-MIDI model that runs client-side via
 * TensorFlow.js). Accuracy depends entirely on the model — this is not
 * validated against real piano recordings in this environment.
 */
export async function transcribeAudioFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Lesson> {
  const resampled = await decodeAndResample(file);

  const { BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime } =
    await import("@spotify/basic-pitch");

  const basicPitch = new BasicPitch(MODEL_URL);
  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  await basicPitch.evaluateModel(
    resampled,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (percent) => onProgress?.(percent)
  );

  const noteEvents = noteFramesToTime(
    addPitchBendsToNoteEvents(
      contours,
      outputToNotesPoly(frames, onsets, ONSET_THRESHOLD, FRAME_THRESHOLD, MIN_NOTE_LENGTH_FRAMES)
    )
  );

  if (noteEvents.length === 0) {
    throw new Error("Không nhận diện được nốt nhạc nào trong file này.");
  }

  const notes: RawNote[] = noteEvents.map((event) => {
    const midi = Math.round(event.pitchMidi);
    return { midi, time: event.startTimeSeconds, hand: splitHandByPitch(midi) };
  });

  const title = file.name.replace(/\.(mp3|wav|ogg|flac|m4a)$/i, "");

  return {
    id: `imported-${crypto.randomUUID()}`,
    title,
    description:
      "Bài nhập từ MP3 (nhận diện tự động bằng AI — có thể không hoàn toàn chính xác).",
    steps: groupNotesIntoSteps(notes),
  };
}
