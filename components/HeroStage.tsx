"use client";

import { useRef } from "react";

/** Wraps the home hero with a cursor-following gold glow (desktop) layered
 * over the drifting piano-key backdrop. Client-only because it needs
 * pointer coordinates; the actual heading/copy stay server-rendered and are
 * simply passed through as children. */
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
    <section ref={stageRef} onMouseMove={handleMouseMove} className="relative w-full overflow-hidden">
      <div className="piano-hero-bg pointer-events-none" aria-hidden />
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] rounded-full bg-gold/30 blur-[110px]"
      />
      {children}
    </section>
  );
}
