import { isBlackKey } from "@/lib/noteUtils";

// Purely decorative — 4 octaves of white/black piano keys at a fixed
// physical width (not stretched to fill the viewport, which made keys look
// squashed/wide instead of like real piano keys). Sized to fit within the
// hero on typical desktop widths without overflowing — a full 88-key range
// ran wider than the viewport and relied on cropping at the edges, which
// read as "overflowing" rather than a deliberate, centered strip.
const RANGE_START = 36; // C2
const RANGE_END = 84; // C6
const KEY_WIDTH = 42;
// How many of the most-centered keys glow gold in a staggered loop, as if
// the beam itself is playing them.
const LIT_WHITE_COUNT = 5;
const LIT_BLACK_COUNT = 3;

export default function HeroPianoLamp() {
  const whiteKeys: number[] = [];
  for (let midi = RANGE_START; midi <= RANGE_END; midi++) {
    if (!isBlackKey(midi)) whiteKeys.push(midi);
  }

  const blackKeys = [];
  for (let midi = RANGE_START; midi <= RANGE_END; midi++) {
    if (!isBlackKey(midi)) continue;
    const precedingWhiteKeys = whiteKeys.filter((w) => w < midi).length;
    blackKeys.push({
      midi,
      leftPx: precedingWhiteKeys * KEY_WIDTH - KEY_WIDTH * 0.3,
    });
  }

  const whiteCenter = (whiteKeys.length - 1) / 2;
  const litWhiteMidis = new Set(
    [...whiteKeys]
      .sort((a, b) => {
        const ai = whiteKeys.indexOf(a);
        const bi = whiteKeys.indexOf(b);
        return Math.abs(ai - whiteCenter) - Math.abs(bi - whiteCenter);
      })
      .slice(0, LIT_WHITE_COUNT)
  );
  const totalWidth = whiteKeys.length * KEY_WIDTH;
  const centerPx = totalWidth / 2;
  const litBlackMidis = new Set(
    [...blackKeys]
      .sort((a, b) => Math.abs(a.leftPx - centerPx) - Math.abs(b.leftPx - centerPx))
      .slice(0, LIT_BLACK_COUNT)
      .map((k) => k.midi)
  );

  return (
    <div className="hero-lamp pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-lamp-halo-wide" />
      <div className="hero-lamp-halo-tight" />
      <div className="hero-lamp-neckline" />
      <div className="hero-lamp-beam" />
      <div className="hero-lamp-pool" />

      <div className="hero-keys">
        <div className="hero-keys-inner" style={{ width: totalWidth }}>
          {whiteKeys.map((midi, i) => {
            const lit = litWhiteMidis.has(midi);
            return (
              <div
                key={midi}
                className={`hero-key-white${lit ? " hero-key-lit" : ""}`}
                style={{
                  width: KEY_WIDTH,
                  animationDelay: lit ? `${i * 0.18}s` : undefined,
                }}
              />
            );
          })}
          {blackKeys.map(({ midi, leftPx }, i) => {
            const lit = litBlackMidis.has(midi);
            return (
              <div
                key={midi}
                className={`hero-key-black${lit ? " hero-key-lit-black" : ""}`}
                style={{
                  left: leftPx,
                  width: KEY_WIDTH * 0.58,
                  animationDelay: lit ? `${i * 0.18 + 0.3}s` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
