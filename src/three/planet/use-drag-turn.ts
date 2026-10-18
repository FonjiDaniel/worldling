"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { useRef } from "react";

import { type PlanetHandle, turnPlanet } from "./handle";

// Drag to turn your world (06 creator). Horizontal drags turn it; vertical drags still scroll
// the page (touch-action: pan-y). Arrow keys do the same for keyboard users.

const RADIANS_PER_PIXEL = 0.01;
/** One arrow key press: 15 degrees. */
export const KEY_STEP = Math.PI / 12;

export function useDragTurn(handle: PlanetHandle) {
  const last = useRef<number | null>(null);

  const end = (event: PointerEvent<HTMLElement>) => {
    last.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      last.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (last.current === null) return;
      turnPlanet(handle, (event.clientX - last.current) * RADIANS_PER_PIXEL);
      last.current = event.clientX;
    },
    onPointerUp: end,
    onPointerCancel: end,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") turnPlanet(handle, -KEY_STEP);
      else if (event.key === "ArrowRight") turnPlanet(handle, KEY_STEP);
      else return;
      event.preventDefault();
    },
  };
}
