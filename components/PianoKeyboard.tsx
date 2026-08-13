"use client";

import { useEffect, useMemo, useRef } from "react";
import { isBlackKey, midiToLabel } from "@/lib/noteUtils";
import type { Hand } from "@/lib/lessons";

interface TargetNote {
  midi: number;
  hand: Hand;
}

interface PianoKeyboardProps {
  /** First MIDI note to render (inclusive), should be a white key (e.g. C). */
  rangeStart: number;
  /** Last MIDI note to render (inclusive), should be a white key (e.g. C). */
  rangeEnd: number;
  /** MIDI notes the lesson currently expects the user to play (may be several, for a chord/two-hand step). */
  targetNotes?: TargetNote[];
  /** MIDI notes currently detected from the microphone. */
  detectedMidis?: number[];
}

// Fixed pixel width (rather than the old `100% / totalWhiteKeys`) keeps keys
// legible on narrow phone screens regardless of how wide the lesson's overall
// note range is. A full imported song can span 4-5 octaves; stretching that
// to fill a 390px viewport shrank white keys to a few px and made black keys
// nearly invisible. Fixed width + horizontal scroll trades "see the whole
// keyboard at once" for "keys stay readable", auto-scrolling to keep the
// current target in view (same approach StaffNotation uses for its stave).
const WHITE_KEY_WIDTH = 36;

export default function PianoKeyboard({
  rangeStart,
  rangeEnd,
  targetNotes = [],
  detectedMidis = [],
}: PianoKeyboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const whiteKeys = useMemo(() => {
    const keys: number[] = [];
    for (let midi = rangeStart; midi <= rangeEnd; midi++) {
      if (!isBlackKey(midi)) keys.push(midi);
    }
    return keys;
  }, [rangeStart, rangeEnd]);

  const blackKeys = useMemo(() => {
    const keys: { midi: number; leftPx: number }[] = [];
    for (let midi = rangeStart; midi <= rangeEnd; midi++) {
      if (!isBlackKey(midi)) continue;
      // Find how many white keys precede this black key to position it.
      const precedingWhiteKeys = whiteKeys.filter((w) => w < midi).length;
      const leftPx = precedingWhiteKeys * WHITE_KEY_WIDTH - WHITE_KEY_WIDTH * 0.3;
      keys.push({ midi, leftPx });
    }
    return keys;
  }, [rangeStart, rangeEnd, whiteKeys]);

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  const targetHandByMidi = new Map(targetNotes.map((t) => [t.midi, t.hand]));

  const keyState = (midi: number): "target" | "detected" | "both" | "idle" => {
    const isTarget = targetHandByMidi.has(midi);
    const isDetected = detectedMidis.includes(midi);
    if (isTarget && isDetected) return "both";
    if (isTarget) return "target";
    if (isDetected) return "detected";
    return "idle";
  };

  // Hand badges (Trái/Phải) give a second, color-independent signal for
  // which hand a highlighted key belongs to — color alone was hard to
  // read, especially the left-hand tint against the dark key/background.
  const HAND_LABEL: Record<"left" | "right", string> = { left: "T", right: "P" };

  const whiteKeyClass = (midi: number): string => {
    switch (keyState(midi)) {
      case "idle":
        return "bg-background-elevated hover:bg-gold-soft/15";
      case "detected":
        return "bg-error/10 ring-2 ring-inset ring-error/60";
      case "both":
        return "animate-key-correct translate-y-[3px] bg-success/25 shadow-inner ring-2 ring-inset ring-success";
      case "target":
        return targetHandByMidi.get(midi) === "left"
          ? "bg-hand-left/25 ring-[3px] ring-inset ring-hand-left"
          : "bg-hand-right/25 ring-[3px] ring-inset ring-hand-right";
    }
  };

  const blackKeyClass = (midi: number): string => {
    switch (keyState(midi)) {
      case "idle":
        return "bg-forest-deep";
      case "detected":
        return "bg-forest-deep ring-2 ring-inset ring-error/70";
      case "both":
        return "animate-key-correct translate-y-[2px] bg-success shadow-md ring-2 ring-inset ring-success";
      case "target":
        return targetHandByMidi.get(midi) === "left"
          ? "bg-hand-left shadow-md ring-2 ring-inset ring-hand-left"
          : "bg-hand-right shadow-md ring-2 ring-inset ring-hand-right";
    }
  };

  const handBadge = (midi: number, variant: "white" | "black") => {
    const state = keyState(midi);
    if (state !== "target" && state !== "both") return null;
    const hand = targetHandByMidi.get(midi);
    if (!hand) return null;
    const bg = state === "both" ? "bg-success" : hand === "left" ? "bg-hand-left" : "bg-hand-right";
    return (
      <span
        className={`pointer-events-none absolute left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full text-[9px] font-bold text-white shadow ${bg} ${
          variant === "white" ? "top-1" : "-top-5"
        }`}
      >
        {HAND_LABEL[hand]}
      </span>
    );
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || targetNotes.length === 0) return;
    const firstTargetMidi = Math.min(...targetNotes.map((t) => t.midi));
    // Approximate the target's x position from the nearest white key at or
    // below it — precise enough for centering purposes even for a black key.
    const whiteIndex = Math.max(
      0,
      whiteKeys.filter((w) => w <= firstTargetMidi).length - 1
    );
    const x = whiteIndex * WHITE_KEY_WIDTH;
    container.scrollTo({
      left: Math.max(0, x - container.clientWidth / 2 + WHITE_KEY_WIDTH / 2),
      behavior: "smooth",
    });
    // Re-run whenever the target set changes (new step); `whiteKeys` is
    // memoized so it won't cause extra scrolls on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNotes, whiteKeys]);

  return (
    <div
      ref={scrollRef}
      className="scroll-elegant w-full select-none overflow-x-auto rounded-lg border border-hairline [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
      style={{ height: 160 }}
    >
      <div className="relative h-full" style={{ width: totalWidth }}>
        <div className="flex h-full gap-px">
          {whiteKeys.map((midi) => (
            <div
              key={midi}
              className={`relative flex-none border-r border-hairline transition-all duration-150 last:border-r-0 ${whiteKeyClass(midi)}`}
              style={{ width: WHITE_KEY_WIDTH }}
              title={midiToLabel(midi)}
            >
              {handBadge(midi, "white")}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted">
                {midiToLabel(midi)}
              </span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%]">
          {blackKeys.map(({ midi, leftPx }) => (
            <div
              key={midi}
              className={`absolute top-0 h-full rounded-b-md shadow-md transition-all duration-150 ${blackKeyClass(midi)}`}
              style={{
                left: leftPx,
                width: WHITE_KEY_WIDTH * 0.6,
              }}
              title={midiToLabel(midi)}
            >
              {handBadge(midi, "black")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
