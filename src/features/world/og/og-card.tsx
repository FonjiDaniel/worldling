/* eslint-disable @next/next/no-img-element -- satori draws plain <img>; next/image doesn't apply */
import { countGraphemes } from "@convex/shared/graphemes";
import { hashString, seededRandom } from "@convex/shared/random";

import { ogColors, ogWeights } from "@/lib/og/theme";

// The 1200x630 share card (SPEC §12), laid out like 06 `Worldling-OG-1200x630`
// (06-source/build_applications.py). Satori takes unitless numbers as pixels.

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** A thumbnail data URI, or the world's colors for a disc when there is no thumbnail. */
export type OgPlanet =
  | { kind: "image"; src: string }
  | { kind: "disc"; ocean: string; stops: readonly string[]; atmosphere: string };

export interface OgWorld {
  name: string;
  username: string;
  planet: OgPlanet;
}

const TITLE_WIDTH = 538;
/** The fallback disc's atmosphere glow, in image pixels like every size here. */
const DISC_GLOW = { blur: 48, spread: 8 };
const STAR_DENSITY = 32;

/** Template sizes 60, 56, 52, 48: the largest that keeps the name on two lines. */
export function titleSize(name: string): number {
  const length = countGraphemes(name);
  if (length <= 22) return 60;
  if (length <= 26) return 56;
  if (length <= 30) return 52;
  return 48;
}

function Stars({ seed }: { seed: number }) {
  const random = seededRandom(seed);
  const count = Math.round(((OG_SIZE.width * OG_SIZE.height) / 1_000_000) * STAR_DENSITY);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const size = 1.3 + random() * 1.4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 16 + random() * (OG_SIZE.width - 32),
              top: 16 + random() * (OG_SIZE.height - 32),
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: ogColors.text,
              opacity: 0.24 + random() * 0.26,
            }}
          />
        );
      })}
    </>
  );
}

/** Nebula at 8% and Aurora at 6% over Void, fading out before the box edge. */
function Backdrop({ seed }: { seed: number }) {
  const glow = (box: [number, number, number, number], color: string, opacity: number) => (
    <div
      style={{
        position: "absolute",
        left: box[0],
        top: box[1],
        width: box[2],
        height: box[3],
        opacity,
        backgroundImage: `radial-gradient(${color} 0%, ${ogColors.void} 70%)`,
      }}
    />
  );
  return (
    <>
      {glow([288, -107, 1248, 781], ogColors.primary, 0.08)}
      {glow([600, 334, 960, 504], ogColors.accent, 0.06)}
      <Stars seed={seed} />
    </>
  );
}

function Planet({ planet }: { planet: OgPlanet }) {
  const box = { position: "absolute", left: 642, top: 55, width: 530, height: 530 } as const;
  if (planet.kind === "image") {
    return <img src={planet.src} alt="" width={530} height={530} style={box} />;
  }
  const [shore, low, mid] = planet.stops;
  return (
    <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          width: 440,
          height: 440,
          borderRadius: 440,
          boxShadow: `0 0 ${DISC_GLOW.blur}px ${DISC_GLOW.spread}px ${planet.atmosphere}`,
          backgroundImage: `radial-gradient(circle at 34% 30%, ${shore ?? planet.ocean} 0%, ${low ?? planet.ocean} 22%, ${mid ?? planet.ocean} 40%, ${planet.ocean} 68%, ${planet.ocean} 100%)`,
        }}
      >
        <div
          style={{
            width: 440,
            height: 440,
            borderRadius: 440,
            opacity: 0.6,
            backgroundImage: `radial-gradient(circle at 34% 30%, transparent 50%, ${ogColors.void} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function Headline({ label, title, sub }: { label?: string; title: string; sub: string }) {
  const size = titleSize(title);
  return (
    <div style={{ position: "absolute", left: 64, top: 191, width: TITLE_WIDTH, display: "flex" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {label === undefined ? null : (
          <div
            style={{
              fontSize: 15,
              lineHeight: 1,
              fontWeight: ogWeights.semibold,
              letterSpacing: 0.9,
              color: ogColors.accent,
              marginBottom: 31,
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontFamily: "Bricolage Grotesque",
            fontWeight: ogWeights.display,
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: size * -0.03,
            color: ogColors.text,
            lineClamp: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 25, color: ogColors["text-muted"], marginTop: 22 }}>{sub}</div>
      </div>
    </div>
  );
}

function Footer({ lines }: { lines: [string, string] | null }) {
  if (lines === null) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 475,
          width: 471,
          height: 1,
          backgroundColor: ogColors.line,
        }}
      />
      <div style={{ position: "absolute", left: 64, top: 505, fontSize: 25, color: ogColors.text }}>
        {lines[0]}
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 550,
          fontSize: 20,
          color: ogColors["text-muted"],
        }}
      >
        {lines[1]}
      </div>
    </>
  );
}

const TAGLINE: [string, string] = ["Grow a world of your own.", "Visit everyone else's."];

export interface OgCardProps {
  /** Null for the generic brand card (unknown or hidden worlds). */
  world: OgWorld | null;
  logo: string;
  mark: string;
}

export function OgCard({ world, logo, mark }: OgCardProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        backgroundColor: ogColors.void,
        fontFamily: "Geist",
        fontWeight: ogWeights.regular,
      }}
    >
      <Backdrop seed={hashString(world?.username ?? "worldling")} />
      <img
        src={logo}
        alt=""
        width={272}
        height={74}
        style={{ position: "absolute", left: 45, top: 32 }}
      />
      {world === null ? (
        <>
          <img
            src={mark}
            alt=""
            width={400}
            height={400}
            style={{ position: "absolute", left: 707, top: 115 }}
          />
          <Headline title={TAGLINE[0]} sub={TAGLINE[1]} />
        </>
      ) : (
        <>
          <Planet planet={world.planet} />
          <Headline label="A WORLD TO VISIT" title={world.name} sub={`@${world.username}`} />
          <Footer lines={TAGLINE} />
        </>
      )}
    </div>
  );
}
