"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// One polite live region for the creator (SPEC §3.7): randomize, presets, undo/redo, saves.

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState({ text: "", key: 0 });
  const announce: Announce = (text) => {
    setMessage((current) => ({ text, key: current.key + 1 }));
  };
  return (
    <AnnouncerContext value={announce}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {/* A new key re-announces the same words, like two undos in a row. */}
        <span key={message.key}>{message.text}</span>
      </p>
    </AnnouncerContext>
  );
}

export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext);
  if (announce === null) throw new Error("useAnnounce needs an AnnouncerProvider");
  return announce;
}
