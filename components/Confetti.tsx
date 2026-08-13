"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--gold)",
  "var(--gold-soft)",
  "var(--success)",
  "var(--hand-left)",
  "var(--hand-right)",
];

const PIECE_COUNT = 60;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
}

function randomPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.4,
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }));
}

/** A one-shot confetti burst for the lesson-completion moment. Pieces are
 * plain divs with randomized left offset / rotation / fall duration —
 * randomized in an effect (not during render) so this stays a pure
 * component, and generated once on mount so re-renders (e.g. from the
 * parent's timer tick) don't reshuffle or restart the animation. */
export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(randomPieces());
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg) translateX(${p.drift}px)`,
            borderRadius: p.id % 3 === 0 ? "999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
