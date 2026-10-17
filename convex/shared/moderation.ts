import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";

// Text moderation for comets, names and usernames (SPEC §11.6). Pure, so the client can warn
// early with the same rules the server enforces. Admin-managed extra words are passed in.

export type ModerationKind = "profanity" | "link" | "email" | "phone";

export type ModerationResult = { ok: true } | { ok: false; kind: ModerationKind };

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const LINK =
  /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|io|app|dev|co|me|xyz|info|biz|gg|ly|link|site|online|ru|cn|uk|de)\b/i;
// Seven or more digits, allowing spaces, dots, dashes and brackets between them.
const PHONE = /(?:\+?\d[\s.\-()]*){7,}/;

/** Lowercase letters only, so "b a d" and "b-a-d" still match an extra word "bad". */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

// Three or more single letters split by separators ("f u c k", "f.u.c.k") become one word.
// Whole words are never glued together, so ordinary sentences keep their boundaries.
const SPACED_LETTERS = /(?<![\p{L}\p{N}])\p{L}(?:[\s.\-_*]+\p{L}(?![\p{L}\p{N}])){2,}/gu;

function joinSpacedLetters(text: string): string {
  return text.replace(SPACED_LETTERS, (run) => run.replace(/[\s.\-_*]+/g, ""));
}

export function checkText(text: string, extraWords: readonly string[] = []): ModerationResult {
  if (EMAIL.test(text)) return { ok: false, kind: "email" };
  if (LINK.test(text)) return { ok: false, kind: "link" };
  if (PHONE.test(text)) return { ok: false, kind: "phone" };
  if (matcher.hasMatch(text) || matcher.hasMatch(joinSpacedLetters(text))) {
    return { ok: false, kind: "profanity" };
  }
  const squashed = squash(text);
  for (const word of extraWords) {
    const needle = squash(word);
    if (needle !== "" && squashed.includes(needle)) return { ok: false, kind: "profanity" };
  }
  return { ok: true };
}

export const MODERATION_COPY: Record<ModerationKind, string> = {
  profanity: "Let's keep the universe kind.",
  link: "Links can't go here.",
  email: "Email addresses can't go here.",
  phone: "Phone numbers can't go here.",
};
