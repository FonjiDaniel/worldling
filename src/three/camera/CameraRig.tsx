"use client";

import { CameraControls, type CameraControlsImpl, PerspectiveCamera } from "@react-three/drei";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { type PerspectiveCamera as PerspectiveCameraImpl, Vector3 } from "three";

import { galaxyRadius } from "@convex/shared/galaxy";

import { easeName, motion, registerEases } from "@/lib/motion";
import { useExperience } from "@/stores/experience";

import {
  arrivalPosition,
  flightDuration,
  type FlightEnds,
  sampleFlight,
  SKIP_AFTER_S,
} from "../universe/flight";
import {
  ARRIVAL_DISTANCE,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  MIN_DISTANCE,
  overviewDistance,
} from "../universe/scale";
import { type FlyOptions, type RigApi, useUniverse } from "../universe/store";

// The universe camera (SPEC §8.5). CameraControls owns the camera; flyTo drives it along an arc
// with one GSAP tween on the shared ticker. Any input from the person stops the flight and hands
// control back. Reduced motion cuts behind a short fade instead of flying.

type Controls = CameraControlsImpl;

let easesReady = false;

function ensureEases(): void {
  if (easesReady) return;
  registerEases(gsap);
  easesReady = true;
}

const OVERVIEW_POLAR = 0.9;
const MAX_POLAR = 1.35;
const MIN_POLAR = 0.08;
const PAN_STEP = 0.2;
const ZOOM_STEP = 0.3;
const MAX_DISTANCE_FACTOR = 1.6;
const PORTRAIT_FIT = 0.9;

function createRig(
  controls: Controls,
  camera: PerspectiveCameraImpl,
): RigApi & { dispose: () => void } {
  const fromPosition = new Vector3();
  const fromTarget = new Vector3();
  const ends: FlightEnds = {
    fromPosition,
    fromTarget,
    toPosition: new Vector3(),
    toTarget: new Vector3(),
  };
  const position = new Vector3();
  const target = new Vector3();
  const progress = { t: 0 };
  let tween: gsap.core.Tween | null = null;
  let cut = 0;

  const land = () => {
    void controls.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      false,
    );
  };
  const stop = () => {
    tween?.kill();
    tween = null;
    window.clearTimeout(cut);
    useUniverse.getState().setFlight(false);
  };

  const flyTo: RigApi["flyTo"] = (pin, options: FlyOptions = {}) => {
    stop();
    controls.getPosition(fromPosition);
    controls.getTarget(fromTarget);
    ends.toTarget.x = pin.x;
    ends.toTarget.y = pin.y;
    ends.toTarget.z = pin.z;
    // Portrait screens are narrow, so the camera stays further back to keep the world whole.
    const distance = ARRIVAL_DISTANCE * Math.max(1, PORTRAIT_FIT / camera.aspect);
    arrivalPosition(ends.fromPosition, pin, distance, ends.toPosition);
    const { setFlight, setScrim } = useUniverse.getState();
    if (useExperience.getState().reducedMotion) {
      // §3.5: no flight, a quick fade between two still views.
      setScrim(true);
      cut = window.setTimeout(() => {
        sampleFlight(ends, 1, position, target);
        land();
        setScrim(false);
        options.onArrive?.();
      }, motion.duration.reduced * 1000);
      return;
    }
    ensureEases();
    const duration = flightDuration(ends);
    setFlight(true, duration > SKIP_AFTER_S);
    progress.t = 0;
    tween = gsap.to(progress, {
      t: 1,
      duration,
      ease: easeName("soft"),
      onUpdate: () => {
        sampleFlight(ends, progress.t, position, target);
        land();
      },
      onComplete: () => {
        tween = null;
        setFlight(false);
        options.onArrive?.();
      },
    });
  };

  const skip = () => {
    tween?.progress(1);
  };

  const pan = (right: number, forward: number) => {
    stop();
    const step = controls.distance * PAN_STEP;
    void controls.truck(right * step, 0, true);
    void controls.forward(forward * step, true);
  };

  const zoom = (direction: 1 | -1) => {
    stop();
    void controls.dolly(direction * controls.distance * ZOOM_STEP, true);
  };

  const overview = () => {
    stop();
    const distance = overviewDistance(galaxyRadius(useUniverse.getState().slotCount));
    // The prop catches up on the next render; the limit must allow this move now.
    controls.maxDistance = Math.max(controls.maxDistance, distance * MAX_DISTANCE_FACTOR);
    void controls.setLookAt(
      0,
      distance * Math.cos(OVERVIEW_POLAR),
      distance * Math.sin(OVERVIEW_POLAR),
      0,
      0,
      0,
      !useExperience.getState().reducedMotion,
    );
  };

  const groundPoint = (out: { x: number; z: number }) => {
    controls.getTarget(target);
    out.x = target.x;
    out.z = target.z;
  };

  controls.addEventListener("controlstart", stop);
  const dispose = () => {
    stop();
    controls.removeEventListener("controlstart", stop);
  };
  return { flyTo, skip, stop, pan, zoom, overview, groundPoint, dispose };
}

/** Where the camera starts, before the slot count is known and overview() takes over. */
const START: [number, number, number] = [
  0,
  160 * Math.cos(OVERVIEW_POLAR),
  160 * Math.sin(OVERVIEW_POLAR),
];

export function CameraRig() {
  const controls = useRef<Controls>(null);
  // CameraControls must drive this view's camera, not the canvas default, so it waits for it.
  const [camera, setCamera] = useState<PerspectiveCameraImpl | null>(null);
  const surface = useUniverse((state) => state.surface);
  const slotCount = useUniverse((state) => state.slotCount);
  const maxDistance = overviewDistance(galaxyRadius(slotCount)) * MAX_DISTANCE_FACTOR;

  useEffect(() => {
    const current = controls.current;
    if (current === null || camera === null) return;
    const rig = createRig(current, camera);
    useUniverse.getState().setRig(rig);
    return () => {
      rig.dispose();
      useUniverse.getState().setRig(null);
    };
  }, [surface, camera]);

  return (
    <>
      <PerspectiveCamera
        ref={setCamera}
        makeDefault
        fov={CAMERA_FOV}
        near={CAMERA_NEAR}
        far={CAMERA_FAR}
        position={START}
      />
      {surface === null || camera === null ? null : (
        <CameraControls
          ref={controls}
          camera={camera}
          domElement={surface}
          minDistance={MIN_DISTANCE}
          maxDistance={maxDistance}
          minPolarAngle={MIN_POLAR}
          maxPolarAngle={MAX_POLAR}
          dollyToCursor
        />
      )}
    </>
  );
}
