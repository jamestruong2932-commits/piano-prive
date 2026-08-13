import { LESSONS } from "@/lib/lessons";
import LessonLibrary from "@/components/LessonLibrary";
import HeroStage from "@/components/HeroStage";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center">
      <HeroStage>
        <header className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gold">
            Thư viện bài học
          </p>
          <h1 className="shimmer-text font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Chọn một bản nhạc
          </h1>
          <div className="mx-auto my-5 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
            Bật microphone và đánh đúng thứ tự nốt để hoàn thành từng bài.
          </p>
        </header>
      </HeroStage>

      <div className="w-full max-w-4xl px-4 pb-16 sm:pb-24">
        <LessonLibrary builtInLessons={LESSONS} />
      </div>
    </div>
  );
}
