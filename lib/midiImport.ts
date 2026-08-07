import type { Hand, Lesson } from "./lessons";
import { MIDDLE_C, groupNotesIntoSteps, type RawNote } from "./noteSteps";

export interface MidiTrackInfo {
  index: number;
  name: string;
  noteCount: number;
  avgMidi: number;
}

export type HandAssignment =
  | { kind: "byTrack"; trackHands: Map<number, Hand> }
  | { kind: "byPitch"; trackIndex: number; splitMidi: number };

/** Lists the note-bearing tracks of a MIDI file, for hand-assignment decisions. */
export async function inspectMidiTracks(buffer: ArrayBuffer): Promise<MidiTrackInfo[]> {
  const { Midi } = await import("@tonejs/midi");
  const midi = new Midi(buffer);
  return midi.tracks
    .map((track, index) => ({
      index,
      name: track.name || `Track ${index + 1}`,
      noteCount: track.notes.length,
      avgMidi:
        track.notes.length > 0
          ? track.notes.reduce((sum, n) => sum + n.midi, 0) / track.notes.length
          : 0,
    }))
    .filter((t) => t.noteCount > 0);
}

/**
 * Picks a reasonable default hand assignment automatically when it's
 * unambiguous. Returns null when there are more than 2 note-bearing tracks —
 * the caller should ask the user to pick tracks/hands manually in that case.
 */
export function decideDefaultAssignment(tracks: MidiTrackInfo[]): HandAssignment | null {
  if (tracks.length === 2) {
    const [higher, lower] = [...tracks].sort((a, b) => b.avgMidi - a.avgMidi);
    return {
      kind: "byTrack",
      trackHands: new Map([
        [higher.index, "right"],
        [lower.index, "left"],
      ]),
    };
  }
  if (tracks.length === 1) {
    return { kind: "byPitch", trackIndex: tracks[0].index, splitMidi: MIDDLE_C };
  }
  return null;
}

export async function buildLessonFromMidi(
  buffer: ArrayBuffer,
  title: string,
  assignment: HandAssignment
): Promise<Lesson> {
  const { Midi } = await import("@tonejs/midi");
  const midi = new Midi(buffer);

  const notes: RawNote[] = [];

  if (assignment.kind === "byTrack") {
    assignment.trackHands.forEach((hand, trackIndex) => {
      const track = midi.tracks[trackIndex];
      if (!track) return;
      for (const note of track.notes) {
        notes.push({ midi: note.midi, time: note.time, hand });
      }
    });
  } else {
    const track = midi.tracks[assignment.trackIndex];
    if (track) {
      for (const note of track.notes) {
        notes.push({
          midi: note.midi,
          time: note.time,
          hand: note.midi >= assignment.splitMidi ? "right" : "left",
        });
      }
    }
  }

  return {
    id: `imported-${crypto.randomUUID()}`,
    title,
    description: "Bài nhập từ file MIDI.",
    steps: groupNotesIntoSteps(notes),
  };
}
