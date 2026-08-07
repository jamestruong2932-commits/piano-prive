"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Hand } from "@/lib/lessons";
import { saveImportedLesson } from "@/lib/importedLessons";
import {
  buildLessonFromMidi,
  decideDefaultAssignment,
  inspectMidiTracks,
  type MidiTrackInfo,
} from "@/lib/midiImport";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "picking"; buffer: ArrayBuffer; title: string; tracks: MidiTrackInfo[] };

export default function ImportMidiButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [selection, setSelection] = useState<Map<number, Hand>>(new Map());

  const reset = () => {
    setStatus({ kind: "idle" });
    setSelection(new Map());
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setStatus({ kind: "loading" });
    try {
      const buffer = await file.arrayBuffer();
      const tracks = await inspectMidiTracks(buffer);
      if (tracks.length === 0) {
        setStatus({ kind: "error", message: "File MIDI này không có nốt nào." });
        return;
      }
      const title = file.name.replace(/\.(mid|midi)$/i, "");
      const assignment = decideDefaultAssignment(tracks);
      if (assignment) {
        const lesson = await buildLessonFromMidi(buffer, title, assignment);
        saveImportedLesson(lesson);
        router.push(`/practice/${lesson.id}`);
        return;
      }
      setSelection(new Map());
      setStatus({ kind: "picking", buffer, title, tracks });
    } catch {
      setStatus({
        kind: "error",
        message: "Không đọc được file này — hãy chắc chắn đây là file MIDI (.mid) hợp lệ.",
      });
    }
  };

  const toggleTrack = (index: number) => {
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (next.size >= 2) return prev;
        next.set(index, next.size === 0 ? "right" : "left");
      }
      return next;
    });
  };

  const setTrackHand = (index: number, hand: Hand) => {
    setSelection((prev) => new Map(prev).set(index, hand));
  };

  const confirmSelection = async () => {
    if (status.kind !== "picking" || selection.size === 0) return;
    setStatus({ kind: "loading" });
    try {
      const lesson = await buildLessonFromMidi(status.buffer, status.title, {
        kind: "byTrack",
        trackHands: selection,
      });
      saveImportedLesson(lesson);
      router.push(`/practice/${lesson.id}`);
    } catch {
      setStatus({ kind: "error", message: "Không tạo được bài học từ lựa chọn này." });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status.kind !== "picking" && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status.kind === "loading"}
          className="rounded-full border border-gold px-5 py-2 text-xs font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep disabled:opacity-50"
        >
          {status.kind === "loading" ? "Đang xử lý…" : "Nhập từ file MIDI"}
        </button>
      )}

      {status.kind === "error" && (
        <p className="max-w-xs text-center text-xs text-error">{status.message}</p>
      )}

      {status.kind === "picking" && (
        <div className="w-full max-w-sm rounded-2xl border border-hairline bg-background-elevated p-5 text-left">
          <p className="mb-1 text-sm font-medium text-foreground">
            File có nhiều nhạc cụ — chọn tối đa 2 track để nhập
          </p>
          <p className="mb-4 text-xs text-muted">
            Chọn track tay phải và/hoặc tay trái (thường là track piano).
          </p>
          <div className="flex flex-col gap-2">
            {status.tracks.map((track) => {
              const hand = selection.get(track.index);
              const isSelected = hand !== undefined;
              return (
                <div
                  key={track.index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline px-3 py-2"
                >
                  <label className="flex flex-1 items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrack(track.index)}
                    />
                    <span className="truncate">
                      {track.name} <span className="text-muted">({track.noteCount} nốt)</span>
                    </span>
                  </label>
                  {isSelected && (
                    <select
                      value={hand}
                      onChange={(e) => setTrackHand(track.index, e.target.value as Hand)}
                      className="rounded-md border border-hairline bg-background px-2 py-1 text-xs text-foreground"
                    >
                      <option value="right">Tay phải</option>
                      <option value="left">Tay trái</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={reset}
              className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
            >
              Huỷ
            </button>
            <button
              onClick={confirmSelection}
              disabled={selection.size === 0}
              className="rounded-full border border-gold px-5 py-2 text-xs font-medium uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-forest-deep disabled:opacity-40"
            >
              Nhập bài
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
