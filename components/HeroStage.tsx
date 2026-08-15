"use client";

import { useRef } from "react";
import HeroPianoLamp from "./HeroPianoLamp";

/** Wraps the home hero with a cursor-following gold glow (desktop) layered
 * over a gold lamp beam shining down onto a real piano-key strip. Client-only
 * because it needs pointer coordinates; the actual heading/copy stay
 * server-rendered and are simply passed through as children. */
export default function HeroStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <section
      ref={stageRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[78vh] w-full flex-col justify-start overflow-hidden pt-[3vh] sm:pt-[6vh]"
    >
      <HeroPianoLamp />
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[110px]"
      />
      {children}
    </section>
  );
}
