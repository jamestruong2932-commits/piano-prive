import { LESSONS } from "@/lib/lessons";
import PracticeSession from "@/components/PracticeSession";

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

interface PracticePageProps {
  params: Promise<{ lessonId: string }>;
}

// Imported lessons only exist in the browser's localStorage, so unknown ids
// aren't 404'd here on the server — PracticeSession resolves them client-side.
export default async function PracticePage({ params }: PracticePageProps) {
  const { lessonId } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <PracticeSession lessonId={lessonId} />
      </div>
    </div>
  );
}
