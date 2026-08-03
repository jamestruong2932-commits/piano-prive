"use client";

import { isBlackKey, midiToLabel } from "@/lib/noteUtils";

interface PianoKeyboardProps {
  /** First MIDI note to render (inclusive), should be a white key (e.g. C). */
  rangeStart: number;
  /** Last MIDI note to render (inclusive), should be a white key (e.g. C). */
  rangeEnd: number;
  /** MIDI note the lesson currently expects the user to play. */
  targetMidi?: number | null;
  /** MIDI note most recently detected from the microphone. */
  detectedMidi?: number | null;
}

export default function PianoKeyboard({
  rangeStart,
  rangeEnd,
  targetMidi = null,
  detectedMidi = null,
}: PianoKeyboardProps) {
  const whiteKeys: number[] = [];
  for (let midi = rangeStart; midi <= rangeEnd; midi++) {
    if (!isBlackKey(midi)) whiteKeys.push(midi);
  }
  const whiteKeyWidth = 100 / whiteKeys.length;

  const blackKeys: { midi: number; leftPercent: number }[] = [];
  for (let midi = rangeStart; midi <= rangeEnd; midi++) {
    if (!isBlackKey(midi)) continue;
    // Find how many white keys precede this black key to position it.
    const precedingWhiteKeys = whiteKeys.filter((w) => w < midi).length;
    const leftPercent = precedingWhiteKeys * whiteKeyWidth - whiteKeyWidth * 0.3;
    blackKeys.push({ midi, leftPercent });
  }

  const keyState = (midi: number): "target" | "detected" | "both" | "idle" => {
    const isTarget = midi === targetMidi;
    const isDetected = midi === detectedMidi;
    if (isTarget && isDetected) return "both";
    if (isTarget) return "target";
    if (isDetected) return "detected";
    return "idle";
  };

  const whiteKeyClass: Record<ReturnType<typeof keyState>, string> = {
    idle: "bg-background-elevated hover:bg-gold-soft/15",
    target: "bg-gold-soft/35 ring-2 ring-inset ring-gold",
    detected: "bg-forest/20 ring-2 ring-inset ring-forest",
    both: "translate-y-[3px] bg-gold/60 shadow-inner ring-2 ring-inset ring-gold",
  };

  const blackKeyClass: Record<ReturnType<typeof keyState>, string> = {
    idle: "bg-forest-deep",
    target: "bg-forest-deep ring-2 ring-inset ring-gold",
    detected: "bg-forest ring-2 ring-inset ring-forest",
    both: "translate-y-[2px] bg-gold shadow-inner ring-2 ring-inset ring-gold",
  };

  return (
    <div className="relative w-full select-none" style={{ height: 160 }}>
      <div className="flex h-full w-full gap-px overflow-hidden rounded-lg border border-hairline">
        {whiteKeys.map((midi) => (
          <div
            key={midi}
            className={`relative flex-1 border-r border-hairline transition-all duration-150 last:border-r-0 ${whiteKeyClass[keyState(midi)]}`}
            title={midiToLabel(midi)}
          >
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted">
              {midiToLabel(midi)}
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%]">
        {blackKeys.map(({ midi, leftPercent }) => (
          <div
            key={midi}
            className={`absolute top-0 h-full rounded-b-md shadow-md transition-all duration-150 ${blackKeyClass[keyState(midi)]}`}
            style={{
              left: `${leftPercent}%`,
              width: `${whiteKeyWidth * 0.6}%`,
            }}
            title={midiToLabel(midi)}
          />
        ))}
      </div>
    </div>
  );
}
