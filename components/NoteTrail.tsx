"use client";

import { useEffect, useRef } from "react";

interface NoteTrailProps {
  labels: string[];
  currentIndex: number;
}

export default function NoteTrail({ labels, currentIndex }: NoteTrailProps) {
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentIndex]);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-hairline bg-background-elevated py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max items-center gap-2 px-[45%]">
        {labels.map((label, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={i}
              ref={isCurrent ? currentRef : undefined}
              className={
                isCurrent
                  ? "animate-pulse-gold flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/15 font-display text-xl font-semibold text-gold transition-all duration-300"
                  : isPast
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/10 text-xs text-success transition-all duration-300"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline text-xs text-muted transition-all duration-300"
              }
            >
              {isPast ? "✦" : label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
