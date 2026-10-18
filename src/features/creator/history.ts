// Undo/redo for the creator (SPEC §2.2). Pure, so it is easy to test. Each entry holds the
// state before a change and a short label for the change, announced on undo and redo.

export const HISTORY_LIMIT = 100;

export interface Entry<T> {
  state: T;
  label: string;
}

export interface History<T> {
  past: readonly Entry<T>[];
  present: T;
  future: readonly Entry<T>[];
}

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/**
 * Moves to `next` as one undoable step. `from` is where a gesture (a slider drag, typing a
 * name) started; the live preview already moved `present`, but undo returns to `from`.
 */
export function record<T>(
  history: History<T>,
  next: T,
  label: string,
  from: T = history.present,
): History<T> {
  if (Object.is(next, from)) return { ...history, present: next };
  const past = [...history.past, { state: from, label }].slice(-HISTORY_LIMIT);
  return { past, present: next, future: [] };
}

/** Replaces `present` without a history step (live preview during a gesture). */
export function preview<T>(history: History<T>, next: T): History<T> {
  return { ...history, present: next };
}

export interface Step<T> {
  history: History<T>;
  label: string;
}

export function undo<T>(history: History<T>): Step<T> | null {
  const last = history.past.at(-1);
  if (last === undefined) return null;
  return {
    label: last.label,
    history: {
      past: history.past.slice(0, -1),
      present: last.state,
      future: [{ state: history.present, label: last.label }, ...history.future],
    },
  };
}

export function redo<T>(history: History<T>): Step<T> | null {
  const [next, ...rest] = history.future;
  if (next === undefined) return null;
  return {
    label: next.label,
    history: {
      past: [...history.past, { state: history.present, label: next.label }].slice(-HISTORY_LIMIT),
      present: next.state,
      future: rest,
    },
  };
}
