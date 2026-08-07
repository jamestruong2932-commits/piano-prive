import type { Lesson } from "./lessons";

const STORAGE_KEY = "piano-prive:imported-lessons";

export function getImportedLessons(): Lesson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Lesson[];
  } catch {
    return [];
  }
}

export function saveImportedLesson(lesson: Lesson): void {
  if (typeof window === "undefined") return;
  const lessons = getImportedLessons();
  lessons.push(lesson);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

export function deleteImportedLesson(id: string): void {
  if (typeof window === "undefined") return;
  const lessons = getImportedLessons().filter((lesson) => lesson.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}
