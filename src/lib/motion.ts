// GSAP mirror of the motion tokens in src/styles/tokens.css (SPEC §3.2, §3.5).
export const motion = {
  ease: { out: "expo.out", inOut: "power3.inOut", soft: "sine.inOut" },
  duration: { fast: 0.16, base: 0.26, slow: 0.48, flight: 1.6 },
} as const;
