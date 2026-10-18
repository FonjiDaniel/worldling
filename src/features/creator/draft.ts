import { z } from "zod";

import { WORLD_NAME_MAX, worldParamsSchema } from "@convex/shared/worldParams";

import type { CreatorWorld } from "./edits";

// The guest draft (SPEC §2.2): kept in localStorage so it survives sign up, the email code and
// the Google redirect, then claimed at onboarding. Storage can be missing or full (private
// mode), so every access is guarded and a bad draft is simply dropped.

export const DRAFT_KEY = "worldling:draft:v1";
export const DRAFT_SAVE_DELAY_MS = 300;

const draftSchema = z.object({
  v: z.literal(1),
  // The name is kept as typed, even when it's not valid yet; the claim checks it.
  name: z.string().max(WORLD_NAME_MAX * 8),
  nameEdited: z.boolean(),
  params: worldParamsSchema,
  savedAt: z.number(),
});

export function serializeDraft(world: CreatorWorld, savedAt: number): string {
  return JSON.stringify({ v: 1, ...world, savedAt });
}

export function parseDraft(raw: string | null): CreatorWorld | null {
  if (raw === null) return null;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const { name, nameEdited, params } = parsed.data;
    return { name, nameEdited, params };
  } catch {
    return null;
  }
}

export function loadDraft(): CreatorWorld | null {
  try {
    return parseDraft(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

export function saveDraft(world: CreatorWorld): void {
  try {
    localStorage.setItem(DRAFT_KEY, serializeDraft(world, Date.now()));
  } catch {
    // Without storage the draft lives only as long as the page.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}
