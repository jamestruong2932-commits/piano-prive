import { LESSONS } from "@/lib/lessons";
import LessonLibrary from "@/components/LessonLibrary";
import HeroStage from "@/components/HeroStage";
import ImportMidiButton from "@/components/ImportMidiButton";
import ImportMp3Button from "@/components/ImportMp3Button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center">
      <HeroStage>
        <header className="relative mx-auto flex max-w-2xl flex-col items-center px-4 pb-32 pt-2 text-center sm:pb-36">
          <p className="hero-copy-shadow mb-40 text-xs font-medium uppercase tracking-[0.35em] text-gold-soft sm:mb-16">
            Piano Privé
          </p>
          <h1 className="shimmer-text font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Biến bản nhạc bạn thích, thành bài luyện piano của riêng bạn
          </h1>
          <div className="mx-auto my-5 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="hero-copy-shadow mx-auto max-w-md text-sm leading-relaxed text-foreground/80">
            Nhập một bản ghi âm hoặc file MIDI có sẵn, Piano Privé tự dựng bài luyện theo từng
            nốt — bật microphone và đánh theo, tiến độ và các bài đã nhập được lưu lại riêng trên
            máy của bạn.
          </p>

          <div className="mt-24 flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-8">
            <ImportMidiButton />
            <span className="hero-copy-shadow text-[10px] uppercase tracking-widest text-foreground/70 md:mt-3">
              hoặc
            </span>
            <ImportMp3Button />
          </div>
        </header>
      </HeroStage>

      <div className="w-full max-w-4xl px-4 pb-16 pt-16 sm:pb-24 sm:pt-20">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.35em] text-muted">
          Hoặc bắt đầu ngay với thư viện bài học có sẵn
        </p>
        <LessonLibrary builtInLessons={LESSONS} />
      </div>
    </div>
  );
}
