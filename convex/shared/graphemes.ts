// Counts user-perceived characters, so an emoji or accented letter counts as one.
// Shared by the client counters and server validation.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function countGraphemes(text: string): number {
  return Array.from(segmenter.segment(text)).length;
}
