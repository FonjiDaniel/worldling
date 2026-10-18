// Copies detect-gpu's benchmark data into public/ so tier detection never calls a CDN
// (src/three/quality.ts). Runs before dev and build; the output is gitignored.
import { cp, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const from = new URL("node_modules/detect-gpu/dist/benchmarks/", root);
const to = new URL("public/gpu-benchmarks/", root);

await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
