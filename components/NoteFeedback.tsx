import type { Hand } from "@/lib/lessons";

interface TargetNote {
  midi: number;
  label: string;
  hand: Hand;
}

interface NoteFeedbackProps {
  targetNotes: TargetNote[];
  detectedMidis: number[];
  isCorrect: boolean;
  progress: { current: number; total: number };
}

const chipClass: Record<"left" | "right" | "matched", string> = {
  right:
    "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-gold bg-gold-soft/20 px-3 font-display text-2xl font-semibold text-gold transition-colors duration-300",
  left: "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-forest bg-forest/10 px-3 font-display text-2xl font-semibold text-forest transition-colors duration-300",
  matched:
    "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-success bg-success/15 px-3 font-display text-2xl font-semibold text-success transition-colors duration-300",
};

export default function NoteFeedback({
  targetNotes,
  detectedMidis,
  isCorrect,
  progress,
}: NoteFeedbackProps) {
  const percent = Math.round((progress.current / progress.total) * 100);
  const isChord = targetNotes.length > 1;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
          <span>
            Bước {progress.current} / {progress.total}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-px w-full overflow-hidden bg-hairline">
          <div
            className="h-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-xs uppercase tracking-widest text-muted">
          {isChord ? "Cần đánh cùng lúc" : "Cần đánh"}
        </div>
        <div className="flex items-center gap-2">
          {targetNotes.map((t) => (
            <div
              key={t.midi}
              className={
                detectedMidis.includes(t.midi) ? chipClass.matched : chipClass[t.hand]
              }
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {isCorrect && (
        <div className="animate-pop-in text-xs font-medium uppercase tracking-widest text-success">
          ✦ Đúng rồi
        </div>
      )}
    </div>
  );
}
