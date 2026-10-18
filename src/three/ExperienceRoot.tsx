"use client";

import { PerformanceMonitor, StatsGl, View } from "@react-three/drei";
import { Canvas, type RootState, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { NoToneMapping, type WebGLRenderer } from "three";

import { reportError } from "@/lib/logger";
import { motionRate, useExperience } from "@/stores/experience";

import { REDUCED_MOTION_RATE, setMotionRate, subscribeFrame } from "./clock";
import { dprFor, MAX_TIER_CHANGES, type RenderTier, TIERS } from "./quality";
import { SpaceBackdrop } from "./SpaceBackdrop";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import { watchContextLoss } from "./utils/contextLoss";

// The single persistent canvas (SPEC §8.1, ADR-002, ADR-019). Fixed behind the DOM, events from
// the document so DOM and 3D share pointers. Scenes arrive through drei <View>.
// Color: `flat` (no tone mapping) keeps curated palettes true; output stays sRGB.

const CANVAS_STYLE = { position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" } as const;

/** Drives R3F from the single ticker and keeps ambient speed in sync with the motion setting. */
function ClockDriver() {
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    const apply = () => {
      setMotionRate(motionRate(useExperience.getState(), REDUCED_MOTION_RATE));
    };
    apply();
    return useExperience.subscribe(apply);
  }, []);
  useEffect(
    () =>
      subscribeFrame((timeMs) => {
        advance(timeMs);
      }),
    [advance],
  );
  return null;
}

function onShaderError(gl: WebGLRenderingContext, program: WebGLProgram): void {
  const { gpu, setShaderFailed } = useExperience.getState();
  const log = gl.getProgramInfoLog(program) ?? "";
  reportError(new Error("Shader program failed"), {
    fn: "three:shader",
    tags: { gpu, log: log.slice(0, 500) },
  });
  setShaderFailed();
}

function configure(state: RootState): void {
  const gl: WebGLRenderer = state.gl;
  gl.debug.onShaderError = onShaderError;
  gl.toneMapping = NoToneMapping;
}

export default function ExperienceRoot({ tier }: { tier: RenderTier }) {
  const setWebgl = useExperience((state) => state.setWebgl);
  const declineTier = useExperience((state) => state.declineTier);
  const perfOverlay = useExperience((state) => state.perfOverlay);
  const settings = TIERS[tier];

  return (
    <ThreeErrorBoundary
      scope="root"
      onError={() => {
        setWebgl("failed");
      }}
    >
      <Canvas
        key={settings.antialias ? "aa" : "no-aa"}
        style={CANVAS_STYLE}
        eventSource={document.body}
        eventPrefix="client"
        frameloop="never"
        flat
        dpr={dprFor(tier, window.devicePixelRatio)}
        gl={{ antialias: settings.antialias, powerPreference: "high-performance", alpha: false }}
        onCreated={(state) => {
          configure(state);
          watchContextLoss(state.gl.domElement);
        }}
        aria-hidden
      >
        <ClockDriver />
        <PerformanceMonitor flipflops={MAX_TIER_CHANGES} onDecline={declineTier} />
        <SpaceBackdrop />
        <View.Port />
        {perfOverlay ? <StatsGl /> : null}
      </Canvas>
    </ThreeErrorBoundary>
  );
}
