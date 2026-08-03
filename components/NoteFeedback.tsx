interface NoteFeedbackProps {
  targetLabel: string;
  detectedLabel: string | null;
  isCorrect: boolean;
  progress: { current: number; total: number };
}

export default function NoteFeedback({
  targetLabel,
  detectedLabel,
  isCorrect,
  progress,
}: NoteFeedbackProps) {
  const percent = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
          <span>
            Nốt {progress.current} / {progress.total}
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

      <div className="flex items-center gap-10">
        <div className="text-center">
          <div className="mb-1 text-xs uppercase tracking-widest text-muted">
            Cần đánh
          </div>
          <div className="font-display text-5xl font-semibold text-gold">
            {targetLabel}
          </div>
        </div>
        <div className="h-12 w-px bg-hairline" />
        <div className="text-center">
          <div className="mb-1 text-xs uppercase tracking-widest text-muted">
            Đang nghe được
          </div>
          <div
            className={`font-display text-5xl font-semibold transition-colors ${
              isCorrect ? "text-success" : "text-muted"
            }`}
          >
            {detectedLabel ?? "—"}
          </div>
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
