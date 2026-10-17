import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { type ReactNode, Suspense } from "react";

import { ConvexClientProvider } from "./convex-client-provider";

/**
 * Convex + Convex Auth for every route (ADR-015). The server provider reads the auth cookies,
 * so it sits under Suspense: Cache Components prerenders the shell around it and the route
 * streams in the same response.
 */
export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ConvexAuthNextjsServerProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ConvexAuthNextjsServerProvider>
    </Suspense>
  );
}
