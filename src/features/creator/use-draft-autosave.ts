"use client";

import { useEffect } from "react";

import { DRAFT_SAVE_DELAY_MS, saveDraft } from "./draft";
import { useCreatorStore } from "./store";

/** Saves the guest draft shortly (DRAFT_SAVE_DELAY_MS) after every change, and right away when the page is hidden. */
export function useDraftAutosave(enabled: boolean): void {
  const store = useCreatorStore();
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      clearTimeout(timer);
      timer = undefined;
      saveDraft(store.getState().history.present);
    };
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.history.present === previous.history.present) return;
      clearTimeout(timer);
      timer = setTimeout(flush, DRAFT_SAVE_DELAY_MS);
    });
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      if (timer !== undefined) flush();
    };
  }, [enabled, store]);
}
