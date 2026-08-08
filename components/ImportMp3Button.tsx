"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveImportedLesson } from "@/lib/importedLessons";
import { transcribeAudioFile } from "@/lib/mp3Import";

type Status =
  | { kind: "idle" }
  | { kind: "processing"; percent: number }
  | { kind: "error"; message: string };

export default function ImportMp3Button() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleFile = async (file: File) => {
    setStatus({ kind: "processing", percent: 0 });
    try {
      const lesson = await transcribeAudioFile(file, (percent) => {
        setStatus({ kind: "processing", percent });
      });
      saveImportedLesson(lesson);
      router.push(`/practice/${lesson.id}`);
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Không xử lý được file này — hãy chắc chắn đây là file âm thanh hợp lệ.",
      });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status.kind !== "processing" && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-hairline px-5 py-2 text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Nhập từ MP3 (piano solo)
          </button>
          <p className="max-w-[220px] text-center text-[11px] leading-snug text-muted">
            Nhận diện nốt từ MP3 chưa chính xác cao — chỉ nên dùng khi không có sẵn file MIDI.
          </p>
        </>
      )}

      {status.kind === "processing" && (
        <div className="flex w-full max-w-xs flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-muted">
            Đang phân tích âm thanh… {Math.round(status.percent * 100)}%
          </p>
          <div className="h-px w-full overflow-hidden bg-hairline">
            <div
              className="h-full bg-gradient-to-r from-gold-soft to-gold transition-all duration-200"
              style={{ width: `${Math.round(status.percent * 100)}%` }}
            />
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <p className="max-w-xs text-center text-xs text-error">{status.message}</p>
      )}
    </div>
  );
}
