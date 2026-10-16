import Image from "next/image";

import { cn } from "@/lib/utils";

// Intrinsic sizes of the brand SVGs (docs/brand/Worldling-Logo-Kit). Display size comes from className.
const logos = {
  horizontal: {
    src: "/brand/worldling-horizontal-white-transparent.svg",
    width: 1331,
    height: 360,
  },
  mark: { src: "/brand/worldling-mark-hero-gradient.svg", width: 1024, height: 1024 },
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
      className={cn(variant === "horizontal" ? "h-8 w-auto" : "size-12", className)}
    />
  );
}
