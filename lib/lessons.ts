export interface LessonNote {
  /** Note label like "C4" */
  note: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  notes: LessonNote[];
}

function seq(...notes: string[]): LessonNote[] {
  return notes.map((note) => ({ note }));
}

export const LESSONS: Lesson[] = [
  {
    id: "c-major-scale",
    title: "Thang âm Đô trưởng (C Major Scale)",
    description: "Đánh lần lượt 8 nốt Đô trưởng từ C4 đến C5.",
    notes: seq("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"),
  },
  {
    id: "twinkle-twinkle",
    title: "Twinkle Twinkle Little Star",
    description: "Giai điệu quen thuộc, phù hợp cho người mới bắt đầu.",
    notes: seq(
      "C4", "C4", "G4", "G4", "A4", "A4", "G4",
      "F4", "F4", "E4", "E4", "D4", "D4", "C4",
      "G4", "G4", "F4", "F4", "E4", "E4", "D4",
      "G4", "G4", "F4", "F4", "E4", "E4", "D4",
      "C4", "C4", "G4", "G4", "A4", "A4", "G4",
      "F4", "F4", "E4", "E4", "D4", "D4", "C4"
    ),
  },
  {
    id: "happy-birthday",
    title: "Happy Birthday (rút gọn)",
    description: "Câu mở đầu của bài Happy Birthday.",
    notes: seq(
      "C4", "C4", "D4", "C4", "F4", "E4",
      "C4", "C4", "D4", "C4", "G4", "F4"
    ),
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}
