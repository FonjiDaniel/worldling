"use client";

import { View } from "@react-three/drei";
import { type ReactNode, useEffect } from "react";

import { cn } from "@/lib/utils";
import { useEffectiveTier, useExperience } from "@/stores/experience";

import { isRenderTier } from "./quality";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";

export interface ThreeViewProps {
  /** Text alternative for the scene, like describeWorld(). */
  label: string;
  /** Shown with no WebGL, while detecting, or after a crash. Every 3D feature has one. */
  fallback: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A DOM box the persistent canvas draws into (drei <View>). Never add another <Canvas>. */
export function ThreeView({ label, fallback, className, children }: ThreeViewProps) {
  const registerView = useExperience((state) => state.registerView);
  const tier = useEffectiveTier();
  useEffect(registerView, [registerView]);

  const live = isRenderTier(tier);
  return (
    <div role="img" aria-label={label} className={cn("relative", className)}>
      {live ? null : <div className="absolute inset-0">{fallback}</div>}
      {live ? (
        <View className="absolute inset-0">
          <ThreeErrorBoundary scope="view">{children}</ThreeErrorBoundary>
        </View>
      ) : null}
    </div>
  );
}
