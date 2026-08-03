const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const A4_FREQUENCY = 440;
const A4_MIDI = 69;

export interface NoteInfo {
  /** MIDI note number, e.g. 60 = C4 */
  midi: number;
  /** Note name without octave, e.g. "C#" */
  name: (typeof NOTE_NAMES)[number];
  /** Note name with octave, e.g. "C#4" */
  label: string;
  octave: number;
  /** Ideal frequency for this note in Hz */
  frequency: number;
  /** How far the input frequency was from this note, in cents (+/- 50) */
  cents: number;
}

/** Converts a frequency in Hz to the nearest musical note, with cents deviation. */
export function frequencyToNote(frequency: number): NoteInfo {
  const midiFloat = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const idealFrequency = midiToFrequency(midi);

  return {
    midi,
    name,
    label: `${name}${octave}`,
    octave,
    frequency: idealFrequency,
    cents,
  };
}

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Parses a note label like "C#4" into its MIDI note number. */
export function noteLabelToMidi(label: string): number {
  const match = label.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid note label: ${label}`);
  }
  const [, name, octaveStr] = match;
  const index = NOTE_NAMES.indexOf(name as (typeof NOTE_NAMES)[number]);
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + index;
}

export function midiToLabel(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function isBlackKey(midi: number): boolean {
  return NOTE_NAMES[((midi % 12) + 12) % 12].includes("#");
}
