import type { Hand, LessonStep } from "./lessons";
import { midiToLabel } from "./noteUtils";

// Notes within this window (seconds) of each other are treated as one
// simultaneous step (chord), not two separate steps to play in sequence.
const CHORD_TOLERANCE_SECONDS = 0.06;
// Default pitch split point: notes at or above middle C are guessed as the
// right hand, below as the left hand. Used when a source has no explicit
// per-note hand information (a single MIDI track, or transcribed audio).
export const MIDDLE_C = 60;

export interface RawNote {
  midi: number;
  time: number;
  hand: Hand;
}

export function splitHandByPitch(midi: number, splitMidi: number = MIDDLE_C): Hand {
  return midi >= splitMidi ? "right" : "left";
}

/**
 * Groups notes that sound at (nearly) the same time into chord/unison steps.
 *
 * `tolerance` defaults to a real-time fudge factor for sources with imprecise
 * timing (MIDI, audio transcription). Symbolic sources with exact integer
 * tick times (e.g. MusicXML) should pass 0 — simultaneity there is either
 * exact or not, and a nonzero tolerance risks merging genuinely offset notes.
 */
export function groupNotesIntoSteps(
  notes: RawNote[],
  tolerance: number = CHORD_TOLERANCE_SECONDS
): LessonStep[] {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const steps: LessonStep[] = [];
  let current: RawNote[] = [];
  let groupStartTime = -Infinity;

  for (const note of sorted) {
    if (current.length > 0 && note.time - groupStartTime > tolerance) {
      steps.push(toStep(current));
      current = [];
    }
    if (current.length === 0) groupStartTime = note.time;
    current.push(note);
  }
  if (current.length > 0) steps.push(toStep(current));
  return steps;
}

function toStep(notes: RawNote[]): LessonStep {
  const seenMidis = new Set<number>();
  const stepNotes: LessonStep["notes"] = [];
  for (const n of notes) {
    if (seenMidis.has(n.midi)) continue;
    seenMidis.add(n.midi);
    stepNotes.push({ note: midiToLabel(n.midi), hand: n.hand });
  }
  return { notes: stepNotes };
}
