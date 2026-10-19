// Galaxy keyboard map (SPEC §2.5): arrows pan, + and - zoom, Tab cycles nearby worlds, Enter
// visits, Escape clears. Pure, so the mapping is tested without a canvas.

export type GalaxyAction =
  | { kind: "pan"; right: number; forward: number }
  | { kind: "zoom"; direction: 1 | -1 }
  | { kind: "cycle"; step: 1 | -1 }
  | { kind: "visit" }
  | { kind: "clear" };

export function galaxyAction(key: string, shiftKey: boolean): GalaxyAction | null {
  switch (key) {
    case "ArrowUp":
      return { kind: "pan", right: 0, forward: 1 };
    case "ArrowDown":
      return { kind: "pan", right: 0, forward: -1 };
    case "ArrowLeft":
      return { kind: "pan", right: -1, forward: 0 };
    case "ArrowRight":
      return { kind: "pan", right: 1, forward: 0 };
    case "+":
    case "=":
      return { kind: "zoom", direction: 1 };
    case "-":
    case "_":
      return { kind: "zoom", direction: -1 };
    case "Tab":
      return { kind: "cycle", step: shiftKey ? -1 : 1 };
    case "Enter":
      return { kind: "visit" };
    case "Escape":
      return { kind: "clear" };
    default:
      return null;
  }
}

/**
 * The next index when cycling through `count` nearby worlds, or null when focus should leave
 * the galaxy (past either end), so Tab never traps the keyboard (WCAG 2.1.2).
 */
export function cycleIndex(current: number | null, step: 1 | -1, count: number): number | null {
  if (count === 0) return null;
  if (current === null) return step === 1 ? 0 : count - 1;
  const next = current + step;
  return next < 0 || next >= count ? null : next;
}
