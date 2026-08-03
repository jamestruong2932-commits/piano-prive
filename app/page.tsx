import Link from "next/link";
import { LESSONS } from "@/lib/lessons";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-2xl">
        <header className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">
            Thư viện bài học
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Chọn một bản nhạc
          </h1>
          <div className="mx-auto my-5 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
            Bật microphone và đánh đúng thứ tự nốt để hoàn thành từng bài.
          </p>
        </header>

        <ul className="flex flex-col gap-4">
          {LESSONS.map((lesson, index) => (
            <li
              key={lesson.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <Link
                href={`/practice/${lesson.id}`}
                className="group flex items-center gap-5 rounded-2xl border border-hairline bg-background-elevated p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_8px_30px_-12px_var(--gold)]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-forest-deep font-display text-lg text-gold-soft">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-medium text-foreground transition-colors group-hover:text-gold">
                    {lesson.title}
                  </div>
                  <div className="truncate text-sm text-muted">
                    {lesson.description}
                  </div>
                </div>
                <div className="shrink-0 text-xs uppercase tracking-widest text-muted">
                  {lesson.notes.length} nốt
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
