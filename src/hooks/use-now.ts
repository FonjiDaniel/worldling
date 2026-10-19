"use client";

import { useSyncExternalStore } from "react";

// The current time, rounded to the minute, for relative timestamps ("5 minutes ago").

const MINUTE = 60 * 1000;

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, MINUTE);
  return () => {
    clearInterval(timer);
  };
}

const nowToTheMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Re-renders once a minute. Null during server rendering and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, nowToTheMinute, () => null);
}
