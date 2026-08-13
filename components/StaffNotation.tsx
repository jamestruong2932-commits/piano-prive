"use client";

import { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  GhostNote,
  BarNote,
  Annotation,
  Voice,
  Formatter,
  StaveConnector,
} from "vexflow";
import type { Hand, LessonStep } from "@/lib/lessons";

interface StaffNotationProps {
  steps: LessonStep[];
  currentIndex: number;
  /** Called with an absolute step index when the user taps/clicks a note to jump there. */
  onSeek?: (index: number) => void;
}

const STEP_WIDTH = 64;
const STAVE_LEFT_MARGIN = 70;
const STAVE_RIGHT_MARGIN = 20;
// How many steps to render before/after the current one. Rendering the
// entire piece on one continuous stave works fine for short demo lessons,
// but a real imported song can have hundreds of steps — drawing all of
// them as VexFlow glyphs on one giant SVG freezes the browser. Windowing
// keeps the SVG bounded regardless of piece length.
const WINDOW_RADIUS = 16;
// Quarter notes per bar line. The lesson model has no time signature, so
// this is a fixed 4/4 approximation purely for visual grouping.
const BEATS_PER_MEASURE = 4;

type Tickable = StaveNote | GhostNote | BarNote;

/** "C#4" -> "c#/4" (VexFlow key format), matching the app's sharp-only note labels. */
function toVexKey(note: string): string {
  const match = note.match(/^([A-G])(#?)(-?\d+)$/);
  if (!match) return "c/4";
  const [, letter, sharp, octave] = match;
  return `${letter.toLowerCase()}${sharp}/${octave}`;
}

/** "C#4" -> "C#" — drop the octave so the on-staff label stays compact. */
function noteNameOnly(note: string): string {
  return note.replace(/-?\d+$/, "");
}

function colorForIndex(index: number, currentIndex: number, hand: Hand): string {
  if (index < currentIndex) return "var(--success)";
  if (index === currentIndex) return hand === "left" ? "var(--hand-left)" : "var(--hand-right)";
  return "var(--muted)";
}

function buildNote(
  step: LessonStep,
  hand: Hand,
  clef: "treble" | "bass",
  index: number,
  currentIndex: number
): StaveNote | GhostNote {
  const handNotes = step.notes.filter((n) => n.hand === hand);
  if (handNotes.length === 0) return new GhostNote({ duration: "q" });

  const note = new StaveNote({
    keys: handNotes.map((n) => toVexKey(n.note)),
    duration: "q",
    clef,
  });

  const color = colorForIndex(index, currentIndex, hand);
  if (index <= currentIndex) {
    note.setStyle({ fillStyle: color, strokeStyle: color });
  }

  const labelText = Array.from(new Set(handNotes.map((n) => noteNameOnly(n.note)))).join("/");
  const label = new Annotation(labelText)
    .setFontSize(9)
    .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
  label.setStyle({ fillStyle: color, strokeStyle: color });
  note.addModifier(label, 0);

  return note;
}

/** Builds one hand's voice tickables, inserting bar lines every measure and
 * tracking which tickable corresponds to which step (for scroll-to-current). */
function buildVoice(
  steps: LessonStep[],
  windowStart: number,
  hand: Hand,
  clef: "treble" | "bass",
  currentIndex: number
) {
  const tickables: Tickable[] = [];
  const byStepIndex: (StaveNote | GhostNote)[] = [];

  steps.forEach((step, i) => {
    const absoluteIndex = windowStart + i;
    if (absoluteIndex > 0 && absoluteIndex % BEATS_PER_MEASURE === 0) {
      tickables.push(new BarNote());
    }
    const note = buildNote(step, hand, clef, i, currentIndex);
    tickables.push(note);
    byStepIndex.push(note);
  });

  return { tickables, byStepIndex };
}

/** Draws a soft highlight band behind the current beat so it reads at a glance. */
function highlightCurrentBeat(container: HTMLDivElement, note: StaveNote | GhostNote, height: number) {
  if (!(note instanceof StaveNote)) return;
  const svg = container.querySelector("svg");
  if (!svg) return;
  const x = note.getAbsoluteX();
  const width = note.getWidth();
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", String(x - 10));
  rect.setAttribute("y", "4");
  rect.setAttribute("width", String(width + 20));
  rect.setAttribute("height", String(height - 8));
  rect.setAttribute("rx", "6");
  rect.setAttribute("fill", "var(--gold)");
  rect.setAttribute("opacity", "0.14");
  svg.insertBefore(rect, svg.firstChild);
}

/** Lays an invisible, full-height click target over each beat so tapping any
 * note (on either staff) jumps practice straight to that step — this is the
 * "drag/tap the sheet music to seek" behavior, VexFlow only gives us static
 * SVG so we hand-roll hit targets rather than per-note DOM event handlers. */
function addSeekTargets(
  container: HTMLDivElement,
  notesByStep: (StaveNote | GhostNote)[],
  windowStart: number,
  height: number,
  onSeek: (index: number) => void
) {
  const svg = container.querySelector("svg");
  if (!svg) return;
  notesByStep.forEach((note, i) => {
    if (!(note instanceof StaveNote)) return;
    const x = note.getAbsoluteX();
    const width = note.getWidth();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x - STEP_WIDTH / 2));
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(Math.max(width, STEP_WIDTH)));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", "transparent");
    rect.style.cursor = "pointer";
    rect.addEventListener("click", () => onSeek(windowStart + i));
    svg.appendChild(rect);
  });
}

export default function StaffNotation({ steps, currentIndex, onSeek }: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length === 0) return;
    container.innerHTML = "";

    const windowStart = Math.max(0, currentIndex - WINDOW_RADIUS);
    const windowEnd = Math.min(steps.length, currentIndex + WINDOW_RADIUS + 1);
    const steps_ = steps.slice(windowStart, windowEnd);
    const currentIndex_ = currentIndex - windowStart;
    const showTimeSignature = windowStart === 0;

    const hands = new Set(steps_.flatMap((s) => s.notes.map((n) => n.hand)));
    const isTwoHanded = hands.has("left") && hands.has("right");
    const singleHand: Hand = hands.has("left") ? "left" : "right";

    // Extra margin reserves room for the time signature glyph when shown.
    const width =
      STAVE_LEFT_MARGIN +
      steps_.length * STEP_WIDTH +
      Math.ceil(steps_.length / BEATS_PER_MEASURE) * 18 +
      STAVE_RIGHT_MARGIN;
    const height = isTwoHanded ? 240 : 150;
    const staveWidth = width - STAVE_LEFT_MARGIN - STAVE_RIGHT_MARGIN;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    let scrollTargetNote: StaveNote | GhostNote | undefined;

    if (isTwoHanded) {
      const trebleStave = new Stave(STAVE_LEFT_MARGIN, 20, staveWidth).addClef("treble");
      const bassStave = new Stave(STAVE_LEFT_MARGIN, 130, staveWidth).addClef("bass");
      if (showTimeSignature) {
        trebleStave.addTimeSignature("4/4");
        bassStave.addTimeSignature("4/4");
      }
      trebleStave.setContext(context).draw();
      bassStave.setContext(context).draw();

      new StaveConnector(trebleStave, bassStave).setType("brace").setContext(context).draw();
      new StaveConnector(trebleStave, bassStave).setType("singleLeft").setContext(context).draw();
      new StaveConnector(trebleStave, bassStave).setType("singleRight").setContext(context).draw();

      const treble = buildVoice(steps_, windowStart, "right", "treble", currentIndex_);
      const bass = buildVoice(steps_, windowStart, "left", "bass", currentIndex_);

      const trebleVoice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      trebleVoice.addTickables(treble.tickables);
      const bassVoice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      bassVoice.addTickables(bass.tickables);

      new Formatter()
        .joinVoices([trebleVoice])
        .joinVoices([bassVoice])
        .format([trebleVoice, bassVoice], staveWidth - 20);

      trebleVoice.draw(context, trebleStave);
      bassVoice.draw(context, bassStave);

      // Absolute note X positions are only finalized once the voice has
      // actually drawn onto the stave — computing this before draw() puts
      // the highlight band at a stale (usually leftmost) position.
      const targetIdx = Math.min(currentIndex_, treble.byStepIndex.length - 1);
      highlightCurrentBeat(container, treble.byStepIndex[targetIdx], height);

      if (onSeek) {
        // A step's real note can live on either staff (e.g. a left-hand-only
        // beat is a GhostNote in the treble voice) — prefer treble, fall
        // back to bass so every step gets a clickable target.
        const combined = treble.byStepIndex.map((note, i) =>
          note instanceof StaveNote ? note : bass.byStepIndex[i]
        );
        addSeekTargets(container, combined, windowStart, height, onSeek);
      }

      scrollTargetNote = treble.byStepIndex[targetIdx];
    } else {
      const clef = singleHand === "left" ? "bass" : "treble";
      const stave = new Stave(STAVE_LEFT_MARGIN, 20, staveWidth).addClef(clef);
      if (showTimeSignature) stave.addTimeSignature("4/4");
      stave.setContext(context).draw();

      const built = buildVoice(steps_, windowStart, singleHand, clef, currentIndex_);

      const voice = new Voice({ numBeats: steps_.length, beatValue: 4 }).setStrict(false);
      voice.addTickables(built.tickables);
      new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
      voice.draw(context, stave);

      const targetIdx = Math.min(currentIndex_, built.byStepIndex.length - 1);
      highlightCurrentBeat(container, built.byStepIndex[targetIdx], height);

      if (onSeek) addSeekTargets(container, built.byStepIndex, windowStart, height, onSeek);

      scrollTargetNote = built.byStepIndex[targetIdx];
    }

    if (scrollTargetNote) {
      const x = scrollTargetNote.getAbsoluteX();
      container.scrollTo({ left: Math.max(0, x - container.clientWidth / 2), behavior: "smooth" });
    }
    // `onSeek` intentionally excluded: PracticeSession doesn't memoize it, so
    // tracking it here would rebuild this whole SVG on every mic-driven
    // re-render (~60/s) instead of only when the step actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, currentIndex]);

  return (
    <div
      ref={containerRef}
      className="scroll-elegant w-full overflow-x-auto rounded-2xl border border-hairline bg-background-elevated py-4 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
    />
  );
}
