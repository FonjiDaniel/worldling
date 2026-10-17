import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

import {
  GUEST_ONLY,
  matchesAny,
  safeNextPath,
  SIGN_IN_PATH,
  SIGNED_IN_ONLY,
} from "@/features/auth/routes";

// Next 16 proxy (SPEC §6.5, ADR-015): proxies /api/auth to Convex and redirects by auth
// state. UX only; every Convex function checks access itself (ADR-010).
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const { pathname, search } = request.nextUrl;
  const guarded = matchesAny(pathname, SIGNED_IN_ONLY);
  const guestOnly = matchesAny(pathname, GUEST_ONLY);
  if (!guarded && !guestOnly) return;

  const signedIn = await convexAuth.isAuthenticated();
  if (guarded && !signedIn) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return nextjsMiddlewareRedirect(request, `${SIGN_IN_PATH}?next=${next}`);
  }
  if (guestOnly && signedIn) {
    return nextjsMiddlewareRedirect(
      request,
      safeNextPath(request.nextUrl.searchParams.get("next")),
    );
  }
});

export const config = {
  // Everything except Next internals and static files; /api/auth must stay included.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
