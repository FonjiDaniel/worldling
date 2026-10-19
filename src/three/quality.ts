// Quality tiers (SPEC §8.2). Detected before the first frame, refined by PerformanceMonitor.

export type Tier = 0 | 1 | 2 | 3;
export type RenderTier = Exclude<Tier, 0>;

export interface TierSettings {
  /** Upper bound for the canvas device pixel ratio. */
  maxDpr: number;
  /** IcosahedronGeometry detail for planet spheres. */
  detail: number;
  /** FBM octaves in the terrain shaders. */
  octaves: number;
  antialias: boolean;
  bloom: boolean;
  /** Universe worlds drawn as full planets (§8.4). */
  nearLod: number;
  /** Universe worlds drawn as instanced low-detail spheres (§8.4, ADR-024). */
  midLod: number;
}

export const TIERS: Record<RenderTier, TierSettings> = {
  1: { maxDpr: 1, detail: 24, octaves: 3, antialias: false, bloom: false, nearLod: 4, midLod: 120 },
  2: {
    maxDpr: 1.5,
    detail: 48,
    octaves: 4,
    antialias: true,
    bloom: false,
    nearLod: 8,
    midLod: 300,
  },
  3: { maxDpr: 2, detail: 80, octaves: 6, antialias: true, bloom: true, nearLod: 12, midLod: 600 },
};

export const QUALITY_STORAGE_KEY = "worldling:quality:v1";

/** Never bounce between tiers more than this many times per session (SPEC §8.2). */
export const MAX_TIER_CHANGES = 2;

export function isTier(value: unknown): value is Tier {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export function isRenderTier(tier: Tier | null): tier is RenderTier {
  return tier !== null && tier > 0;
}

export function dprFor(tier: RenderTier, devicePixelRatio: number): number {
  return Math.max(1, Math.min(devicePixelRatio, TIERS[tier].maxDpr));
}

/** The tier after sustained low FPS, or null when we may not drop any further. */
export function nextTierOnDecline(tier: Tier, changes: number): Tier | null {
  if (changes >= MAX_TIER_CHANGES || tier <= 1) return null;
  return (tier - 1) as Tier;
}

/** detect-gpu result to our tier. No WebGL or a blocklisted GPU is tier 0. */
export function tierFromGpu(result: { tier: number; type: string }): Tier {
  if (result.type === "WEBGL_UNSUPPORTED" || result.type === "BLOCKLISTED") return 0;
  if (result.tier >= 3) return 3;
  if (result.tier === 2) return 2;
  return 1;
}

/** Benchmarks are self-hosted (scripts/copy-gpu-benchmarks.mjs), never fetched from a CDN. */
const BENCHMARKS_URL = "/gpu-benchmarks";
const DETECT_TIMEOUT_S = 3;

export interface Detection {
  tier: Tier;
  /** Renderer name from detect-gpu, for error reports. */
  gpu: string;
}

export async function detectTier(): Promise<Detection> {
  if (!hasWebGl()) return { tier: 0, gpu: "none" };
  const { getGPUTier } = await import("detect-gpu");
  const timeout = new Promise<Detection>((resolve) => {
    setTimeout(() => {
      resolve({ tier: 2, gpu: "unknown (timeout)" });
    }, DETECT_TIMEOUT_S * 1000);
  });
  const detected = getGPUTier({ benchmarksURL: BENCHMARKS_URL })
    .then((result): Detection => ({ tier: tierFromGpu(result), gpu: result.gpu ?? "unknown" }))
    .catch((): Detection => ({ tier: 2, gpu: "unknown (error)" }));
  return Promise.race([detected, timeout]);
}

function hasWebGl(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    // Release the probe context right away; browsers cap live contexts.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}
