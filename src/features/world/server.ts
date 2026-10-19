import { fetchQuery } from "convex/nextjs";
import { connection } from "next/server";
import { cache } from "react";

import { api } from "@convex/_generated/api";

// Server reads for /w/[username]. Metadata and the OG image see the public view (no token),
// and React's cache shares one read per request. Worlds change, so this always runs per
// request: connection() says so to Cache Components (the Convex client uses Math.random).

export const loadPublicWorld = cache(async (username: string) => {
  await connection();
  return await fetchQuery(api.worlds.getByUsername, { username });
});

export type PublicWorld = NonNullable<Awaited<ReturnType<typeof loadPublicWorld>>>;
