import Image from "next/image";

import { cn } from "@/lib/utils";

// Brand SVGs copied byte for byte from docs/brand/02-logo (README "Ships"). Intrinsic sizes are the
// viewBoxes; display size comes from className and must respect the 02-logo minimums:
// horizontal lockup 160 CSS pixels wide (h-11), hero gradient mark 128 (size-32).
const logos = {
  horizontal: {
    src: "/brand/worldling-horizontal-white-transparent.svg",
    width: 1331,
    height: 360,
    className: "h-11 w-auto",
  },
  hero: {
    src: "/brand/worldling-mark-hero-gradient.svg",
    width: 1024,
    height: 1024,
    className: "size-32",
  },
} as const;

interface LogoProps {
  variant?: keyof typeof logos;
  className?: string;
  priority?: boolean;
}

export function Logo({ variant = "horizontal", className, priority = false }: LogoProps) {
  const logo = logos[variant];
  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt="Worldling"
      priority={priority}
      unoptimized
      className={cn(logo.className, className)}
    />
  );
}
