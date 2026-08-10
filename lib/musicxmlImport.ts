import type { Hand, Lesson } from "./lessons";
import { groupNotesIntoSteps, type RawNote } from "./noteSteps";

// --- Minimal ZIP reader (no dependency) -----------------------------------
// A .mxl file is a ZIP container. We only need to pull out the single
// "rootfile" MusicXML entry it points to via META-INF/container.xml, per the
// MusicXML compressed-file spec. Handles the common cases produced by
// notation software: STORED or DEFLATE compression, no data descriptors.

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;

function readZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Không phải file .mxl hợp lệ (thiếu ZIP EOCD).");

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let centralDirOffset = view.getUint32(eocdOffset + 16, true);

  const entries: ZipEntry[] = [];
  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(centralDirOffset, true) !== CENTRAL_DIR_SIGNATURE) {
      throw new Error("ZIP central directory bị hỏng hoặc không được hỗ trợ.");
    }
    const compressionMethod = view.getUint16(centralDirOffset + 10, true);
    const compressedSize = view.getUint32(centralDirOffset + 20, true);
    const nameLength = view.getUint16(centralDirOffset + 28, true);
    const extraLength = view.getUint16(centralDirOffset + 30, true);
    const commentLength = view.getUint16(centralDirOffset + 32, true);
    const localHeaderOffset = view.getUint32(centralDirOffset + 42, true);
    const nameBytes = bytes.subarray(centralDirOffset + 46, centralDirOffset + 46 + nameLength);
    const name = new TextDecoder().decode(nameBytes);

    entries.push({ name, compressionMethod, compressedSize, localHeaderOffset });
    centralDirOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function readZipEntryData(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  if (view.getUint32(entry.localHeaderOffset, true) !== LOCAL_HEADER_SIGNATURE) {
    throw new Error("ZIP local file header bị hỏng.");
  }
  const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) return inflateRaw(compressed);
  throw new Error(`Phương thức nén ZIP không được hỗ trợ: ${entry.compressionMethod}`);
}

/** Extracts the root MusicXML document's text content from a .mxl container. */
async function extractMusicXmlFromMxl(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const entries = readZipEntries(bytes);
  const decoder = new TextDecoder();

  const container = entries.find((e) => e.name === "META-INF/container.xml");
  let rootPath: string | undefined;
  if (container) {
    const containerXml = decoder.decode(await readZipEntryData(bytes, container));
    rootPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
  }

  const rootEntry = rootPath
    ? entries.find((e) => e.name === rootPath)
    : entries.find((e) => /\.xml$/i.test(e.name) && !e.name.startsWith("META-INF/"));
  if (!rootEntry) throw new Error("Không tìm thấy bản nhạc MusicXML bên trong file .mxl.");

  return decoder.decode(await readZipEntryData(bytes, rootEntry));
}

// --- MusicXML -> notes ------------------------------------------------------

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchToMidi(step: string, alter: number, octave: number): number {
  return (octave + 1) * 12 + STEP_SEMITONES[step] + alter;
}

function intTag(block: string, tag: string): number | null {
  const match = block.match(new RegExp(`<${tag}>(-?\\d+)</${tag}>`));
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parses a single-part, two-staff (grand staff) piano MusicXML score into a
 * Lesson. Notes are grouped into simultaneous steps using exact tick
 * equality — MusicXML gives exact integer timing, unlike audio/MIDI sources,
 * so no fudge tolerance is needed (see groupNotesIntoSteps).
 *
 * Staff-to-hand mapping is read from each staff's clef (F clef = left hand,
 * everything else = right hand), falling back to staff 1 = right / staff 2 =
 * left if no clef is present before the first note.
 *
 * Tied notes (tie type="stop") are continuations of the previous strike, not
 * new ones, and are skipped — otherwise every tie would show up as a
 * spurious extra note to press.
 */
export function parseMusicXmlToLesson(xml: string, title: string, description: string): Lesson {
  const partMatch = xml.match(/<part\b[^>]*>([\s\S]*?)<\/part>/);
  if (!partMatch) throw new Error("Không tìm thấy <part> nào trong file MusicXML.");
  const part = partMatch[1];

  const staffHand = new Map<number, Hand>([
    [1, "right"],
    [2, "left"],
  ]);

  const notes: RawNote[] = [];
  let cursor = 0;
  let lastOnset = 0;

  const elementPattern =
    /<attributes\b[\s\S]*?<\/attributes>|<note\b[\s\S]*?<\/note>|<backup>[\s\S]*?<\/backup>/g;

  for (const [block] of part.matchAll(elementPattern)) {
    if (block.startsWith("<attributes")) {
      const clefBlocks = block.matchAll(/<clef number="(\d+)">([\s\S]*?)<\/clef>/g);
      for (const [, staffNumStr, clefBody] of clefBlocks) {
        const sign = clefBody.match(/<sign>([A-Z]+)<\/sign>/)?.[1];
        if (sign) staffHand.set(parseInt(staffNumStr, 10), sign === "F" ? "left" : "right");
      }
      continue;
    }

    if (block.startsWith("<backup")) {
      const duration = intTag(block, "duration") ?? 0;
      cursor -= duration;
      continue;
    }

    // <note>
    const isChord = /<chord\s*\/>/.test(block);
    const isRest = /<rest\b/.test(block);
    const duration = intTag(block, "duration") ?? 0;
    const staff = intTag(block, "staff") ?? 1;
    const isTieStop = /<tie type="stop"\s*\/>/.test(block);

    const onset = isChord ? lastOnset : cursor;

    if (!isRest && !isTieStop) {
      const step = block.match(/<step>([A-G])<\/step>/)?.[1];
      const octave = intTag(block, "octave");
      if (step !== undefined && octave !== null) {
        const alter = intTag(block, "alter") ?? 0;
        const midi = pitchToMidi(step, alter, octave);
        const hand = staffHand.get(staff) ?? (staff === 2 ? "left" : "right");
        notes.push({ midi, time: onset, hand });
      }
    }

    if (!isChord) {
      lastOnset = cursor;
      cursor += duration;
    }
  }

  if (notes.length === 0) throw new Error("Không tìm thấy nốt nhạc nào trong file MusicXML.");

  return {
    id: `imported-${crypto.randomUUID()}`,
    title,
    description,
    steps: groupNotesIntoSteps(notes, 0),
  };
}

/** Builds a Lesson from a .mxl (compressed MusicXML) file's raw bytes. */
export async function buildLessonFromMxl(
  buffer: ArrayBuffer,
  title: string,
  description = "Bài nhập từ file MusicXML."
): Promise<Lesson> {
  const xml = await extractMusicXmlFromMxl(buffer);
  return parseMusicXmlToLesson(xml, title, description);
}
