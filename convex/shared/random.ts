// Small deterministic helpers: the same seed gives the same world on every device.

/** mulberry32: a fast seeded PRNG returning floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable float in [0, 1) for an integer (used for per-slot jitter). */
export function hash01(n: number): number {
  return seededRandom(Math.imul(n >>> 0, 0x9e3779b1) ^ 0x85ebca6b)();
}

export function pick<T>(random: () => number, items: readonly [T, ...T[]]): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

export function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A random uint32 seed from Web Crypto. */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

/** FNV-1a: a stable uint32 for a string (a username or a document id). */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
