"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getLessonById, type Lesson } from "@/lib/lessons";
import { getImportedLessons } from "@/lib/importedLessons";
import { noteLabelToMidi } from "@/lib/noteUtils";
import { usePitchDetector } from "@/lib/pitchDetection";
import PianoKeyboard from "./PianoKeyboard";
import NoteFeedback from "./NoteFeedback";
import Confetti from "./Confetti";

// VexFlow needs a DOM to render into and is a sizable dependency (music
// glyph fonts) — only load it client-side, on the practice screen.
const StaffNotation = dynamic(() => import("./StaffNotation"), {
  ssr: false,
  loading: () => <div className="h-[140px] w-full" />,
});

// Consecutive matching frames before advancing. Lowered from 8: for a dense
// multi-note chord it's easy for one note's detected energy to flicker below
// threshold for a single frame (~16ms) even while genuinely being held, and
// requiring a longer unbroken run than that mostly punishes correct playing.
const STABLE_FRAMES_REQUIRED = 5;

interface PracticeSessionProps {
  lessonId: string;
}

type LessonState =
  | { status: "loading" }
  | { status: "found"; lesson: Lesson }
  | { status: "not-found" };

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function initialLessonState(lessonId: string): LessonState {
  const builtIn = getLessonById(lessonId);
  // Built-in lessons resolve synchronously from static data (works during
  // SSR too). Anything else might be an imported lesson living in
  // localStorage, which is only readable after mount on the client.
  return builtIn ? { status: "found", lesson: builtIn } : { status: "loading" };
}

export default function PracticeSession({ lessonId }: PracticeSessionProps) {
  const [state, setState] = useState<LessonState>(() => initialLessonState(lessonId));

  useEffect(() => {
    if (state.status !== "loading") return;
    const imported = getImportedLessons().find((l) => l.id === lessonId);
    setState(imported ? { status: "found", lesson: imported } : { status: "not-found" });
  }, [lessonId, state.status]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted">Đang tải bài học…</p>;
  }

  if (state.status === "not-found") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-sm text-muted">Không tìm thấy bài học này.</p>
        <Link
          href="/"
          className="rounded-full border border-gold px-6 py-3 text-xs font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return <ActivePractice lesson={state.lesson} />;
}

function ActivePractice({ lesson }: { lesson: Lesson }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const stableCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const isComplete = currentIndex >= lesson.steps.length;
  const currentStep = isComplete ? null : lesson.steps[currentIndex];

  const targetNotes = useMemo(
    () =>
      currentStep?.notes.map((n) => ({
        midi: noteLabelToMidi(n.note),
        label: n.note,
        hand: n.hand,
      })) ?? [],
    [currentStep]
  );

  const candidateMidis = useMemo(() => targetNotes.map((t) => t.midi), [targetNotes]);
  const { detectedMidis, permission, errorMessage, start, stop } =
    usePitchDetector(candidateMidis);
  const detectedMidiList = useMemo(() => Array.from(detectedMidis), [detectedMidis]);

  const allMidis = useMemo(
    () => lesson.steps.flatMap((step) => step.notes.map((n) => noteLabelToMidi(n.note))),
    [lesson]
  );

  const { rangeStart, rangeEnd } = useMemo(() => {
    const min = Math.min(...allMidis);
    const max = Math.max(...allMidis);
    const start = min - (min % 12); // round down to C
    const endRemainder = max % 12;
    const end = endRemainder === 0 ? max : max + (12 - endRemainder);
    return { rangeStart: start, rangeEnd: end };
  }, [allMidis]);

  const isStepCorrectNow =
    !isComplete && targetNotes.every((t) => detectedMidis.has(t.midi));

  useEffect(() => {
    if (permission === "granted" && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, [permission]);

  useEffect(() => {
    if (isComplete && startTimeRef.current !== null) {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) return;

    if (isStepCorrectNow) {
      stableCountRef.current += 1;
      if (stableCountRef.current >= STABLE_FRAMES_REQUIRED) {
        stableCountRef.current = 0;
        setJustAdvanced(true);
        setCurrentIndex((i) => i + 1);
        window.setTimeout(() => setJustAdvanced(false), 400);
      }
    } else {
      stableCountRef.current = 0;
    }
    // Keyed on `detectedMidis` (a new Set reference every detector tick),
    // not on `isStepCorrectNow` — that's a derived boolean that can stay
    // `true` across many consecutive ticks without its value ever
    // "changing", which would stop this effect from re-running at all and
    // freeze the stable-frame count at 1 forever for a very steady signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedMidis, isComplete]);

  const handleRestart = () => {
    stableCountRef.current = 0;
    startTimeRef.current = Date.now();
    setElapsedSeconds(null);
    setCurrentIndex(0);
  };

  const handleSeek = (index: number) => {
    stableCountRef.current = 0;
    setJustAdvanced(false);
    setCurrentIndex(Math.max(0, Math.min(index, lesson.steps.length - 1)));
  };

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          href="/"
          className="justify-self-start whitespace-nowrap text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
        >
          <span aria-hidden>←</span> <span className="hidden sm:inline">Danh sách bài học</span>
        </Link>
        <h1 className="max-w-[60vw] truncate font-display text-lg font-medium text-foreground sm:max-w-none sm:text-xl">
          {lesson.title}
        </h1>
        <div />
      </div>

      {permission === "idle" && (
        <button
          onClick={start}
          className="rounded-full border border-gold px-8 py-3 text-xs font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep"
        >
          Bật microphone để bắt đầu
        </button>
      )}

      {permission === "requesting" && (
        <p className="text-sm text-muted">Đang xin quyền truy cập microphone…</p>
      )}

      {(permission === "denied" || permission === "error") && (
        <div className="max-w-sm rounded-2xl border border-error/30 bg-error/10 p-5 text-center text-sm text-error">
          <p className="font-medium">Không thể truy cập microphone.</p>
          <p className="mt-1">{errorMessage}</p>
          <p className="mt-2 text-error/80">
            Hãy cấp quyền micro cho trang này trong trình duyệt rồi thử lại.
          </p>
          <button
            onClick={start}
            className="mt-4 rounded-full border border-error px-5 py-2 text-xs font-medium uppercase tracking-widest text-error transition-colors hover:bg-error hover:text-background-elevated"
          >
            Thử lại
          </button>
        </div>
      )}

      {permission === "granted" && !isComplete && (
        <div className="flex w-full flex-col items-center gap-6">
          <StaffNotation steps={lesson.steps} currentIndex={currentIndex} onSeek={handleSeek} />
          <NoteFeedback
            targetNotes={targetNotes}
            detectedMidis={detectedMidiList}
            isCorrect={justAdvanced || isStepCorrectNow}
            progress={{ current: currentIndex + 1, total: lesson.steps.length }}
            onSeek={handleSeek}
          />
        </div>
      )}

      {permission === "granted" && isComplete && (
        <div className="relative flex flex-col items-center gap-4 py-4">
          <Confetti />
          <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-gold/25 blur-[90px]" />
          <div className="animate-pop-in relative flex h-16 w-16 items-center justify-center rounded-full border border-gold text-2xl text-gold shadow-[0_0_30px_-6px_var(--gold)]">
            ✦
          </div>
          <p className="shimmer-text animate-fade-in-up font-display text-3xl font-semibold">
            Hoàn thành bài học
          </p>
          <p className="animate-fade-in-up text-xs uppercase tracking-widest text-muted">
            {allMidis.length} nốt
            {elapsedSeconds !== null && ` · ${formatElapsed(elapsedSeconds)}`}
          </p>
          <button
            onClick={handleRestart}
            className="relative rounded-full border border-gold px-6 py-3 text-xs font-medium uppercase tracking-widest text-gold shadow-[0_0_20px_-8px_var(--gold)] transition-colors hover:bg-gold hover:text-forest-deep"
          >
            Luyện lại từ đầu
          </button>
        </div>
      )}

      <PianoKeyboard
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        targetNotes={targetNotes}
        detectedMidis={detectedMidiList}
      />

      {permission === "granted" && (
        <button
          onClick={stop}
          className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
        >
          Tắt microphone
        </button>
      )}
    </div>
  );
}
