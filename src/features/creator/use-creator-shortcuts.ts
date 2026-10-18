"use client";

import { useEffect, useEffectEvent } from "react";

// Ctrl/Cmd+Z undoes, Shift+Ctrl/Cmd+Z and Ctrl+Y redo (SPEC §2.2). Text fields keep their own
// native undo, so typing a name never jumps the world back.

export type Shortcut = "undo" | "redo";

interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function shortcutFor(event: KeyLike): Shortcut | null {
  if (event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y" && event.ctrlKey && !event.shiftKey) return "redo";
  return null;
}

export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return !["checkbox", "radio", "range", "button", "submit", "color"].includes(target.type);
}

export function useCreatorShortcuts(run: (shortcut: Shortcut) => void): void {
  const onShortcut = useEffectEvent(run);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcutFor(event);
      if (shortcut === null || isTextEntry(event.target)) return;
      event.preventDefault();
      onShortcut(shortcut);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
