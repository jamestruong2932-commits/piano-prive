"use client";

import { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, GhostNote, Voice, Formatter, StaveConnector } from "vexflow";
import type { Hand, LessonStep } from "@/lib/lessons";

interface StaffNotationProps {
  steps: LessonStep[];
  currentIndex: number;
}

const STEP_WIDTH = 60;
const STAVE_LEFT_MARGIN = 60;
const STAVE_RIGHT_MARGIN = 20;
// How many steps to render before/after the current one. Rendering the
// entire piece on one continuous stave works fine for short demo lessons,
// but a real imported song can have hundreds of steps — drawing all of
// them as VexFlow glyphs on one giant SVG freezes the browser. Windowing
// keeps the SVG bounded regardless of piece length.
const WINDOW_RADIUS = 16;

/** "C#4" -> "c#/4" (VexFlow key format), matching the app's sharp-only note labels. */
function toVexKey(note: string): string {
  const match = note.match(/^([A-G])(#?)(-?\d+)$/);
  if (!match) return "c/4";
  const [, letter, sharp, octave] = match;
  return `${letter.toLowerCase()}${sharp}/${octave}`;
}

function buildNote(step: LessonStep, hand: Hand, clef: "treble" | "bass") {
  const handNotes = step.notes.filter((n) => n.hand === hand);
  if (handNotes.length === 0) return new GhostNote({ duration: "q" });
  return new StaveNote({
    keys: handNotes.map((n) => toVexKey(n.note)),
    duration: "q",
    clef,
  });
}

function styleStep(
  note: StaveNote | GhostNote,
  hasNoteForHand: boolean,
  hand: Hand,
  index: number,
  currentIndex: number
) {
  if (!hasNoteForHand || !(note instanceof StaveNote)) return;
  if (index < currentIndex) {
    note.setStyle({ fillStyle: "var(--success)", strokeStyle: "var(--success)" });
  } else if (index === currentIndex) {
    const color = hand === "left" ? "var(--forest)" : "var(--gold)";
    note.setStyle({ fillStyle: color, strokeStyle: color });
  }
}

export default function StaffNotation({ steps, currentIndex }: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length === 0) return;
    container.innerHTML = "";

    const windowStart = Math.max(0, currentIndex - WINDOW_RADIUS);
    const windowEnd = Math.min(steps.length, currentIndex + WINDOW_RADIUS + 1);
    const steps_ = steps.slice(windowStart, windowEnd);
    const currentIndex_ = currentIndex - windowStart;

    const hands = new Set(steps_.flatMap((s) => s.notes.map((n) => n.hand)));
    const isTwoHanded = hands.has("left") && hands.has("right");
    const singleHand: Hand = hands.has("left") ? "left" : "right";

    const width = STAVE_LEFT_MARGIN + steps_.length * STEP_WIDTH + STAVE_RIGHT_MARGIN;
    const height = isTwoHanded ? 220 : 130;
    const staveWidth = width - STAVE_LEFT_MARGIN - STAVE_RIGHT_MARGIN;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    let scrollTargetNote: StaveNote | GhostNote | undefined;

    if (isTwoHanded) {
      const trebleStave = new Stave(STAVE_LEFT_MARGIN, 10, staveWidth).addClef("treble");
      trebleStave.setContext(context).draw();
      const bassStave = new Stave(STAVE_LEFT_MARGIN, 120, staveWidth).addClef("bass");
      bassStave.setContext(context).draw();

      new StaveConnector(trebleStave, bassStave).setType("brace").setContext(context).draw();
      new StaveConnector(trebleStave, bassStave).setType("singleLeft").setContext(context).draw();

      const trebleNotes = steps_.map((s) => buildNote(s, "right", "treble"));
      const bassNotes = steps_.map((s) => buildNote(s, "left", "bass"));

      steps_.forEach((step, i) => {
        styleStep(trebleNotes[i], step.notes.some((n) => n.hand === "right"), "right", i, currentIndex_);
        styleStep(bassNotes[i], step.notes.some((n) => n.hand === "left"), "left", i, currentIndex_);
      });

      const trebleVoice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      trebleVoice.addTickables(trebleNotes);
      const bassVoice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      bassVoice.addTickables(bassNotes);

      new Formatter()
        .joinVoices([trebleVoice])
        .joinVoices([bassVoice])
        .format([trebleVoice, bassVoice], staveWidth - 20);

      trebleVoice.draw(context, trebleStave);
      bassVoice.draw(context, bassStave);

      scrollTargetNote = trebleNotes[Math.min(currentIndex_, trebleNotes.length - 1)];
    } else {
      const clef = singleHand === "left" ? "bass" : "treble";
      const stave = new Stave(STAVE_LEFT_MARGIN, 10, staveWidth).addClef(clef);
      stave.setContext(context).draw();

      const notes = steps_.map((s) => buildNote(s, singleHand, clef));
      steps_.forEach((step, i) =>
        styleStep(notes[i], step.notes.some((n) => n.hand === singleHand), singleHand, i, currentIndex_)
      );

      const voice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
      voice.draw(context, stave);

      scrollTargetNote = notes[Math.min(currentIndex_, notes.length - 1)];
    }

    if (scrollTargetNote) {
      const x = scrollTargetNote.getAbsoluteX();
      container.scrollTo({ left: Math.max(0, x - container.clientWidth / 2), behavior: "smooth" });
    }
  }, [steps, currentIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto rounded-2xl border border-hairline bg-background-elevated py-4 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
    />
  );
}
