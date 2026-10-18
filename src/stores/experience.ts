import { create } from "zustand";

import { isTier, nextTierOnDecline, QUALITY_STORAGE_KEY, type Tier } from "@/three/quality";

// Global 3D state (SPEC §8.1): tier, motion preference, WebGL health and registered views.

export type WebGlStatus = "ok" | "lost" | "failed";

interface ExperienceState {
  /** null until detect-gpu answers. */
  detectedTier: Tier | null;
  gpu: string;
  /** Set by PerformanceMonitor after sustained low FPS. */
  runtimeTier: Tier | null;
  tierChanges: number;
  /** The user's pick in the quality popover, remembered in localStorage. */
  override: Tier | null;
  reducedMotion: boolean;
  motionPaused: boolean;
  webgl: WebGlStatus;
  shaderFailed: boolean;
  views: number;
  perfOverlay: boolean;
  setDetected: (tier: Tier, gpu: string) => void;
  declineTier: () => void;
  setOverride: (tier: Tier | null) => void;
  setReducedMotion: (reduced: boolean) => void;
  setMotionPaused: (paused: boolean) => void;
  setWebgl: (status: WebGlStatus) => void;
  setShaderFailed: () => void;
  registerView: () => () => void;
  setPerfOverlay: (on: boolean) => void;
}

function readOverride(): Tier | null {
  try {
    const stored = globalThis.localStorage.getItem(QUALITY_STORAGE_KEY);
    const value: unknown = stored === null ? null : Number(stored);
    return isTier(value) ? value : null;
  } catch {
    return null;
  }
}

function writeOverride(tier: Tier | null): void {
  try {
    if (tier === null) globalThis.localStorage.removeItem(QUALITY_STORAGE_KEY);
    else globalThis.localStorage.setItem(QUALITY_STORAGE_KEY, String(tier));
  } catch {
    // Storage can be blocked (private mode); the choice just isn't remembered.
  }
}

export const useExperience = create<ExperienceState>()((set, get) => ({
  detectedTier: null,
  gpu: "unknown",
  runtimeTier: null,
  tierChanges: 0,
  override: readOverride(),
  reducedMotion: false,
  motionPaused: false,
  webgl: "ok",
  shaderFailed: false,
  views: 0,
  perfOverlay: false,
  setDetected: (detectedTier, gpu) => {
    set({ detectedTier, gpu });
  },
  declineTier: () => {
    const { override, tierChanges } = get();
    const current = effectiveTier(get());
    if (override !== null || current === null) return;
    const next = nextTierOnDecline(current, tierChanges);
    if (next !== null) set({ runtimeTier: next, tierChanges: tierChanges + 1 });
  },
  setOverride: (override) => {
    writeOverride(override);
    set({ override });
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
  },
  setMotionPaused: (motionPaused) => {
    set({ motionPaused });
  },
  setWebgl: (webgl) => {
    set({ webgl });
  },
  setShaderFailed: () => {
    set({ shaderFailed: true });
  },
  registerView: () => {
    set((state) => ({ views: state.views + 1 }));
    return () => {
      set((state) => ({ views: state.views - 1 }));
    };
  },
  setPerfOverlay: (perfOverlay) => {
    set({ perfOverlay });
  },
}));

type TierInputs = Pick<ExperienceState, "detectedTier" | "runtimeTier" | "override" | "webgl">;

/** The tier to render at. null while detection is still running. */
export function effectiveTier(state: TierInputs): Tier | null {
  if (state.webgl === "failed") return 0;
  if (state.detectedTier === 0) return 0;
  if (state.override !== null) return state.override;
  if (state.detectedTier === null) return null;
  return state.runtimeTier === null
    ? state.detectedTier
    : (Math.min(state.detectedTier, state.runtimeTier) as Tier);
}

export function useEffectiveTier(): Tier | null {
  return useExperience(effectiveTier);
}

/** Ambient motion rate: 0 paused, slow with reduced motion, 1 otherwise. */
export function motionRate(
  state: Pick<ExperienceState, "motionPaused" | "reducedMotion">,
  reducedRate: number,
): number {
  if (state.motionPaused) return 0;
  return state.reducedMotion ? reducedRate : 1;
}
