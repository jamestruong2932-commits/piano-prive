export type Hand = "left" | "right";

export interface LessonNote {
  /** Note label like "C4" */
  note: string;
  /** Which hand plays this note */
  hand: Hand;
}

/** One or more notes that must sound at the same time. */
export interface LessonStep {
  notes: LessonNote[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  steps: LessonStep[];
}

function left(note: string): LessonNote {
  return { note, hand: "left" };
}

function right(note: string): LessonNote {
  return { note, hand: "right" };
}

/** A step where multiple notes must sound simultaneously. */
function chord(...notes: LessonNote[]): LessonStep {
  return { notes };
}

/** A run of single-note steps, all played by the same hand. */
function seq(hand: Hand, ...notes: string[]): LessonStep[] {
  return notes.map((note) => ({ notes: [{ note, hand }] }));
}

export const LESSONS: Lesson[] = [
  {
    id: "c-major-scale",
    title: "Thang âm Đô trưởng (C Major Scale)",
    description: "Đánh lần lượt 8 nốt Đô trưởng từ C4 đến C5.",
    steps: seq("right", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"),
  },
  {
    id: "twinkle-twinkle",
    title: "Twinkle Twinkle Little Star",
    description: "Giai điệu quen thuộc, phù hợp cho người mới bắt đầu.",
    steps: seq(
      "right",
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
    steps: seq(
      "right",
      "C4", "C4", "D4", "C4", "F4", "E4",
      "C4", "C4", "D4", "C4", "G4", "F4"
    ),
  },
  {
    id: "ode-to-joy-two-hands",
    title: "Ode to Joy (2 tay - rút gọn)",
    description:
      "Tay trái đệm nốt bass, tay phải đánh giai điệu — nốt bass vang lên đồng thời với nốt đầu mỗi cụm.",
    steps: [
      chord(right("E4"), left("C3")),
      ...seq("right", "E4", "F4", "G4"),
      chord(right("G4"), left("G3")),
      ...seq("right", "F4", "E4", "D4"),
      chord(right("C4"), left("C3")),
      ...seq("right", "C4", "D4", "E4"),
      chord(right("E4"), left("G3")),
      ...seq("right", "D4", "D4"),
    ],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}
