// Universe scale (SPEC §8.4). Worlds sit SPACING (6) units apart on the spiral.

/** Radius of a world in galaxy units, as a full planet or a mid sphere. */
export const WORLD_RADIUS = 0.9;
/** Glow diameter of a loaded far world, in world radii, before level growth. */
export const DUST_WORLD_SIZE = 2.2;
export const DUST_LEVEL_GROWTH = 0.15;
/** Within this distance loaded worlds hand over from glowing dots to mid spheres. */
export const MID_FADE_DISTANCE = 45;
/** Beyond this distance loaded worlds look like dust, so streamed sector edges never show. */
export const FAR_FADE_DISTANCE = 520;
/** Worlds farther than this stay dots; closer ones become mid spheres. */
export const MID_RANGE = 180;
/** Only worlds this close become full planets. */
export const NEAR_RANGE = 40;
/** How far from a world the camera rests after flying to it. */
export const ARRIVAL_DISTANCE = 8;
export const CAMERA_FOV = 45;
export const CAMERA_NEAR = 0.3;
export const CAMERA_FAR = 9000;
export const MIN_DISTANCE = 2.4;
/** How often the LOD sets and sector streaming re-read the camera, in ms. */
export const LOD_INTERVAL_MS = 200;
/** §8.4: sector subscriptions follow the camera after it settles this long. */
export const STREAM_DEBOUNCE_MS = 250;
/** Distant overview: room for the whole spiral. */
export const overviewDistance = (radius: number): number => Math.max(160, radius * 2.1);
