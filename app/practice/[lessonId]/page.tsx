import { notFound } from "next/navigation";
import { LESSONS, getLessonById } from "@/lib/lessons";
import PracticeSession from "@/components/PracticeSession";

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

interface PracticePageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <PracticeSession lesson={lesson} />
      </div>
    </div>
  );
}
