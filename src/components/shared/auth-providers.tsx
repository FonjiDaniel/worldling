import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";

import { ConvexClientProvider } from "./convex-client-provider";

// The server provider reads the auth cookies and stamps the state with Date.now(), so it must
// render per request: connection() says so to Cache Components before either happens.
async function RequestAuth({ children }: { children: ReactNode }) {
  await connection();
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}

/**
 * Convex + Convex Auth for every route (ADR-015). Under Suspense, Cache Components prerenders
 * the shell around it and the route streams in the same response.
 */
export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <RequestAuth>{children}</RequestAuth>
    </Suspense>
  );
}
