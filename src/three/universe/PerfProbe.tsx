"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { WebGLRenderer } from "three";

// Dev-only universe probe (`/universe?perf=1`, Phase 8 acceptance): draw calls per frame, frame
// rate and renderer memory, published on window.__universePerf once a second.

const WINDOW = 600;
/** After every view has rendered this frame (drei View draws at priority 1). */
const AFTER_RENDER = 100;
/** Before the backdrop clears the canvas (priority 0). */
const BEFORE_RENDER = -100;

interface Probe {
  frameMs: Float32Array;
  calls: Float32Array;
  index: number;
  filled: number;
  last: number;
}

export interface PerfReport {
  frames: number;
  fpsP75: number;
  worstMs: number;
  callsMax: number;
  callsP50: number;
  geometries: number;
  textures: number;
  programs: number;
  heapMb: number | null;
}

declare global {
  interface Window {
    __universePerf?: PerfReport;
  }
}

function percentile(values: Float32Array, count: number, p: number): number {
  const sorted = Array.from(values.subarray(0, count)).sort((a, b) => a - b);
  return sorted[Math.min(count - 1, Math.floor(count * p))] ?? 0;
}

function report(probe: Probe, gl: WebGLRenderer): PerfReport {
  const count = probe.filled;
  // "p75 >= 55fps" (§8.8): 75% of frames are at least this fast, so the 75th percentile frame time.
  const frameP75 = percentile(probe.frameMs, count, 0.75);
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return {
    frames: count,
    fpsP75: frameP75 > 0 ? Math.round(1000 / frameP75) : 0,
    worstMs: count === 0 ? 0 : Math.round(Math.max(...probe.frameMs.subarray(0, count))),
    callsMax: count === 0 ? 0 : Math.max(...probe.calls.subarray(0, count)),
    callsP50: percentile(probe.calls, count, 0.5),
    geometries: gl.info.memory.geometries,
    textures: gl.info.memory.textures,
    programs: gl.info.programs?.length ?? 0,
    heapMb: memory ? Math.round(memory.usedJSHeapSize / 1e6) : null,
  };
}

function resetInfo(gl: WebGLRenderer): void {
  gl.info.autoReset = false;
  gl.info.reset();
}

function record(probe: Probe, gl: WebGLRenderer, now: number): void {
  if (probe.last > 0) {
    probe.frameMs[probe.index] = now - probe.last;
    probe.calls[probe.index] = gl.info.render.calls;
    probe.index = (probe.index + 1) % WINDOW;
    probe.filled = Math.min(WINDOW, probe.filled + 1);
  }
  probe.last = now;
}

export function PerfProbe() {
  const gl = useThree((state) => state.gl);
  const probe = useMemo<Probe>(
    () => ({
      frameMs: new Float32Array(WINDOW),
      calls: new Float32Array(WINDOW),
      index: 0,
      filled: 0,
      last: 0,
    }),
    [],
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      window.__universePerf = report(probe, gl);
    }, 1000);
    return () => {
      window.clearInterval(timer);
      gl.info.autoReset = true;
    };
  }, [probe, gl]);
  useFrame(() => {
    resetInfo(gl);
  }, BEFORE_RENDER);
  useFrame(() => {
    record(probe, gl, performance.now());
  }, AFTER_RENDER);
  return null;
}
