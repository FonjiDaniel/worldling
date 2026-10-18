"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@/lib/utils";

import { settleSnap, type Snap, snapHeights, stepSnap } from "./sheet-snaps";
import { useCreator } from "./store";

// The mobile creator panel (SPEC §3.6): a non-modal bottom sheet with three snap points, so
// the world stays visible and touchable above it. Drag the handle, or use it as a button:
// Enter or Space cycles, arrow keys step.

/** Movement before a press on the handle counts as a drag. */
const DRAG_SLOP = 6;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
  };
}

function useViewportHeight(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerHeight,
    () => 0,
  );
}

function useHeight(ref: RefObject<HTMLElement | null>): number {
  return useSyncExternalStore(
    (onChange) => {
      const element = ref.current;
      if (element === null) return () => undefined;
      const observer = new ResizeObserver(onChange);
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    },
    () => ref.current?.offsetHeight ?? 0,
    () => 0,
  );
}

interface DragState {
  startY: number;
  startHeight: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
}

const NEXT_ON_TAP: Record<Snap, Snap> = { peek: "half", half: "full", full: "peek" };

const HANDLE_LABEL: Record<Snap, string> = {
  peek: "Show the controls",
  half: "Show more controls",
  full: "Show less",
};

export function CreatorSheet({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const snap = useCreator((state) => state.snap);
  const setSnap = useCreator((state) => state.setSnap);
  const handleRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const viewport = useViewportHeight();
  const peek = useHeight(handleRef) + useHeight(footerRef);
  const heights = snapHeights(viewport, peek);
  const drag = useRef<DragState | null>(null);
  /** The click that ends a drag must not also cycle the snap. */
  const draggedRef = useRef(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const now = event.timeStamp;
    draggedRef.current = false;
    drag.current = {
      startY: event.clientY,
      startHeight: heights[snap],
      lastY: event.clientY,
      lastTime: now,
      velocity: 0,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state === null) return;
    if (!state.moved && Math.abs(event.clientY - state.startY) < DRAG_SLOP) return;
    state.moved = true;
    const elapsed = Math.max(event.timeStamp - state.lastTime, 1) / 1000;
    state.velocity = (state.lastY - event.clientY) / elapsed;
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
    const next = state.startHeight + (state.startY - event.clientY);
    setDragHeight(Math.min(Math.max(next, heights.peek), heights.full));
  };

  const onPointerEnd = () => {
    const state = drag.current;
    drag.current = null;
    if (state?.moved !== true || dragHeight === null) return;
    draggedRef.current = true;
    setSnap(settleSnap(dragHeight, state.velocity, heights, snap, viewport));
    setDragHeight(null);
  };

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") setSnap(stepSnap(snap, 1));
    else if (event.key === "ArrowDown") setSnap(stepSnap(snap, -1));
    else return;
    event.preventDefault();
  };

  const height = dragHeight ?? heights[snap];

  // Keep the Pause motion control above the sheet.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--motion-control-lift", `${String(height)}px`);
    return () => {
      root.removeProperty("--motion-control-lift");
    };
  }, [height]);

  const collapsed = snap === "peek" && dragHeight === null;

  return (
    <section
      aria-label="World controls"
      data-snap={snap}
      data-dragging={dragHeight === null ? undefined : true}
      style={viewport === 0 ? undefined : { height: `${String(height)}px` }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex h-2/5 flex-col rounded-t-lg border-t border-line glass shadow-dialog",
        "transition-[height] duration-base ease-out data-dragging:transition-none",
      )}
    >
      <div
        ref={handleRef}
        className="shrink-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          type="button"
          aria-expanded={snap !== "peek"}
          aria-label={HANDLE_LABEL[snap]}
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            setSnap(NEXT_ON_TAP[snap]);
          }}
          onKeyDown={onHandleKey}
          className="flex h-touch w-full items-center justify-center rounded-t-lg"
        >
          <span aria-hidden className="h-1 w-10 rounded-full bg-glass-control-line" />
        </button>
      </div>
      <div
        inert={collapsed}
        className={cn("flex min-h-0 flex-1 flex-col px-panel-pad", collapsed && "invisible")}
      >
        {children}
      </div>
      <div
        ref={footerRef}
        className="shrink-0 px-panel-pad pt-3 pb-[max(env(safe-area-inset-bottom),var(--spacing-panel-pad))]"
      >
        {footer}
      </div>
    </section>
  );
}
