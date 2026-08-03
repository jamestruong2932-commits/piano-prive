"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lessons";
import { noteLabelToMidi, midiToLabel } from "@/lib/noteUtils";
import { usePitchDetector } from "@/lib/pitchDetection";
import PianoKeyboard from "./PianoKeyboard";
import NoteFeedback from "./NoteFeedback";
import NoteTrail from "./NoteTrail";

const STABLE_FRAMES_REQUIRED = 8; // consecutive matching frames before advancing
const CENTS_TOLERANCE = 45;

interface PracticeSessionProps {
  lesson: Lesson;
}

export default function PracticeSession({ lesson }: PracticeSessionProps) {
  const { reading, permission, errorMessage, start, stop } = usePitchDetector();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const stableCountRef = useRef(0);

  const noteMidis = useMemo(
    () => lesson.notes.map((n) => noteLabelToMidi(n.note)),
    [lesson]
  );

  const isComplete = currentIndex >= noteMidis.length;
  const targetMidi = isComplete ? null : noteMidis[currentIndex];

  const { rangeStart, rangeEnd } = useMemo(() => {
    const min = Math.min(...noteMidis);
    const max = Math.max(...noteMidis);
    const start = min - (min % 12); // round down to C
    const endRemainder = max % 12;
    const end = endRemainder === 0 ? max : max + (12 - endRemainder);
    return { rangeStart: start, rangeEnd: end };
  }, [noteMidis]);

  const isCorrectNow =
    !isComplete &&
    reading.note !== null &&
    reading.note.midi === targetMidi &&
    Math.abs(reading.note.cents) <= CENTS_TOLERANCE;

  useEffect(() => {
    if (isComplete) return;

    if (isCorrectNow) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading.note?.midi, reading.note?.cents, isComplete]);

  const handleRestart = () => {
    stableCountRef.current = 0;
    setCurrentIndex(0);
  };

  const noteLabels = useMemo(() => lesson.notes.map((n) => n.note), [lesson]);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
        >
          ← Danh sách bài học
        </Link>
        <h1 className="font-display text-xl font-medium text-foreground">
          {lesson.title}
        </h1>
        <div className="w-24" />
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
          <NoteTrail labels={noteLabels} currentIndex={currentIndex} />
          <NoteFeedback
            targetLabel={midiToLabel(targetMidi as number)}
            detectedLabel={reading.note?.label ?? null}
            isCorrect={justAdvanced || isCorrectNow}
            progress={{ current: currentIndex + 1, total: noteMidis.length }}
          />
        </div>
      )}

      {permission === "granted" && isComplete && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full border border-gold text-2xl text-gold">
            ✦
          </div>
          <p className="animate-fade-in-up font-display text-2xl font-semibold text-foreground">
            Hoàn thành bài học
          </p>
          <button
            onClick={handleRestart}
            className="rounded-full border border-gold px-6 py-3 text-xs font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep"
          >
            Luyện lại từ đầu
          </button>
        </div>
      )}

      <PianoKeyboard
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        targetMidi={targetMidi}
        detectedMidi={reading.note?.midi ?? null}
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
