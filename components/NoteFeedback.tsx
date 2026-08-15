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
  /** Called with a 0-based step index when the user drags the progress bar to seek. */
  onSeek?: (index: number) => void;
}

// Plain sans, not the display serif: Playfair's stylistic C/G are easy to
// mix up at a glance, which matters here since these letters are read
// mid-performance, not admired as typography.
const chipClass: Record<"left" | "right" | "matched", string> = {
  right:
    "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-hand-right bg-hand-right/20 px-3 font-sans text-2xl font-bold text-hand-right transition-colors duration-300",
  left: "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-hand-left bg-hand-left/20 px-3 font-sans text-2xl font-bold text-hand-left transition-colors duration-300",
  matched:
    "flex h-14 min-w-14 items-center justify-center rounded-full border-2 border-success bg-success/15 px-3 font-sans text-2xl font-bold text-success transition-colors duration-300",
};

const handTag: Record<"left" | "right", string> = { left: "Tay trái", right: "Tay phải" };

export default function NoteFeedback({
  targetNotes,
  detectedMidis,
  isCorrect,
  progress,
  onSeek,
}: NoteFeedbackProps) {
  const percent = Math.round((progress.current / progress.total) * 100);
  const isChord = targetNotes.length > 1;
  const currentIndex = progress.current - 1;
  const canGoPrev = !!onSeek && currentIndex > 0;
  const canGoNext = !!onSeek && currentIndex < progress.total - 1;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {onSeek && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onSeek(currentIndex - 1)}
            disabled={!canGoPrev}
            aria-label="Bước trước"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-sm text-foreground transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-xs uppercase tracking-widest text-muted">
            Bước {progress.current} / {progress.total}
          </span>
          <button
            type="button"
            onClick={() => onSeek(currentIndex + 1)}
            disabled={!canGoNext}
            aria-label="Bước sau"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-sm text-foreground transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
      <div className="w-full max-w-xs">
        <div
          className={`mb-1.5 flex items-center text-xs uppercase tracking-widest text-muted ${
            onSeek ? "justify-end" : "justify-between"
          }`}
        >
          {!onSeek && (
            <span>
              Bước {progress.current} / {progress.total}
            </span>
          )}
          <span>{percent}%</span>
        </div>
        {onSeek ? (
          <div className="relative flex h-4 w-full items-center">
            <div className="pointer-events-none absolute inset-x-0 h-px w-full overflow-hidden bg-hairline">
              <div
                className="h-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, progress.total - 1)}
              value={progress.current - 1}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Tua đến bước bất kỳ trong bài học"
              className="relative h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow"
            />
          </div>
        ) : (
          <div className="h-px w-full overflow-hidden bg-hairline">
            <div
              className="h-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-xs uppercase tracking-widest text-muted">
          {isChord ? "Cần đánh cùng lúc" : "Cần đánh"}
        </div>
        <div className="flex items-start gap-3">
          {targetNotes.map((t) => (
            <div key={t.midi} className="flex flex-col items-center gap-1">
              <div
                className={
                  detectedMidis.includes(t.midi)
                    ? `${chipClass.matched} animate-pop-in`
                    : chipClass[t.hand]
                }
              >
                {t.label}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  t.hand === "left" ? "text-hand-left" : "text-hand-right"
                }`}
              >
                {handTag[t.hand]}
              </span>
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
