"use client";

import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Scene } from "three";

import { reportError } from "@/lib/logger";
import { useEffectiveTier } from "@/stores/experience";

import { frameRadius, thumbnailCamera } from "./camera/PlanetCamera";
import { createPlanetHandle } from "./planet/handle";
import { Planet } from "./planet/Planet";
import { isRenderTier, type RenderTier } from "./quality";
import {
  currentThumbnailJob,
  finishThumbnail,
  subscribeThumbnails,
  type ThumbnailJob,
} from "./thumbnails";
import { createThumbnailTarget, renderThumbnail } from "./utils/captureThumbnail";
import { encodeWebp } from "./utils/encodeWebp";

// Renders thumbnail requests inside the one canvas (SPEC §8.7): a private scene that no view
// shows, drawn after the views, one job at a time.

/** Frames to wait so the planet's effects have written its uniforms. */
const SETTLE_FRAMES = 2;
/** After the views (drei <View> renders at priority 1). */
const STUDIO_PRIORITY = 10;

export function ThumbnailStudio() {
  const job = useSyncExternalStore(subscribeThumbnails, currentThumbnailJob, () => null);
  const tier = useEffectiveTier();
  if (job === null || !isRenderTier(tier)) return null;
  return <StudioJob key={job.id} job={job} tier={tier} />;
}

function StudioJob({ job, tier }: { job: ThumbnailJob; tier: RenderTier }) {
  const gl = useThree((state) => state.gl);
  const [scene] = useState(() => new Scene());
  const camera = useMemo(() => thumbnailCamera(frameRadius(job.level)), [job.level]);
  const target = useMemo(() => createThumbnailTarget(), []);
  const handle = useMemo(() => createPlanetHandle(0), []);
  const frames = useRef(0);

  useEffect(
    () => () => {
      target.dispose();
      finishThumbnail(job, null);
    },
    [target, job],
  );

  useFrame(() => {
    frames.current += 1;
    if (frames.current !== SETTLE_FRAMES + 1) return;
    let image: ImageData | null = null;
    try {
      image = renderThumbnail(gl, scene, camera, target);
    } catch (error) {
      reportError(error, { fn: "three:thumbnail" });
    }
    if (image === null) {
      finishThumbnail(job, null);
      return;
    }
    void encodeWebp(image).then((blob) => {
      finishThumbnail(job, blob);
    });
  }, STUDIO_PRIORITY);

  return createPortal(
    <Planet params={job.params} level={job.level} tier={tier} handle={handle} />,
    scene,
  );
}
