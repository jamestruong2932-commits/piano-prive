import { LESSONS } from "@/lib/lessons";
import LessonLibrary from "@/components/LessonLibrary";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-4xl">
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

        <LessonLibrary builtInLessons={LESSONS} />
      </div>
    </div>
  );
}
