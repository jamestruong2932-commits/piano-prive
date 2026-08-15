"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lessons";
import { deleteImportedLesson, getImportedLessons } from "@/lib/importedLessons";

interface LessonLibraryProps {
  builtInLessons: Lesson[];
}

export default function LessonLibrary({ builtInLessons }: LessonLibraryProps) {
  const [importedLessons, setImportedLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    setImportedLessons(getImportedLessons());
  }, []);

  const handleDelete = (id: string) => {
    deleteImportedLesson(id);
    setImportedLessons((prev) => prev.filter((lesson) => lesson.id !== id));
  };

  const lessons = [...builtInLessons, ...importedLessons];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {lessons.map((lesson, index) => {
          const allNotes = lesson.steps.flatMap((step) => step.notes);
          const handsUsed = new Set(allNotes.map((n) => n.hand)).size;
          const isImported = lesson.id.startsWith("imported-");
          return (
            <div key={lesson.id} className="relative">
              <Link
                href={`/practice/${lesson.id}`}
                className="group animate-fade-in-up flex flex-col overflow-hidden rounded-2xl border border-hairline bg-background-elevated/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_8px_30px_-12px_var(--gold)]"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-forest-deep via-forest to-gold/40">
                  <div
                    aria-hidden
                    className="absolute inset-0 flex opacity-25 transition-opacity duration-300 group-hover:opacity-40"
                  >
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full flex-1 border-r border-background/40 last:border-r-0"
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />
                  <span className="relative font-display text-4xl font-semibold text-gold-soft/90 transition-transform duration-300 group-hover:scale-110">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <div className="font-display text-lg font-medium text-foreground transition-colors group-hover:text-gold">
                      {lesson.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-muted">
                      {lesson.description}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted">
                      {allNotes.length} nốt
                    </span>
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted">
                      {handsUsed === 2 ? "2 tay" : "1 tay"}
                    </span>
                    {isImported && (
                      <span className="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold">
                        Đã nhập
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {isImported && (
                <button
                  onClick={() => handleDelete(lesson.id)}
                  aria-label="Xoá bài học"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-background-elevated/90 text-xs text-muted transition-colors hover:border-error hover:text-error"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
