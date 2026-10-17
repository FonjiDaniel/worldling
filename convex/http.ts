import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { auth } from "./auth";
import { UNSUBSCRIBE_PATH, verifyLinkToken } from "./email/links";
import { confirmPage, donePage, invalidPage } from "./email/unsubscribePage";
import { publicHttpAction } from "./lib/functions";

const http = httpRouter();

// Convex Auth: OAuth callbacks and JWKS (SPEC §6).
auth.addHttpRoutes(http);

// SPEC §7.8. GET shows a confirm page; POST (its button, and RFC 8058 one-click from the
// List-Unsubscribe-Post header) adds the suppression.

http.route({
  path: UNSUBSCRIBE_PATH,
  method: "GET",
  handler: publicHttpAction(async (ctx, request) => {
    const claims = await verifyLinkToken(tokenOf(request), Date.now());
    if (claims === null) {
      ctx.log.info("email.unsubscribe.invalid", { method: "GET" });
      return invalidPage();
    }
    return confirmPage(claims.scope, request.url);
  }),
});

http.route({
  path: UNSUBSCRIBE_PATH,
  method: "POST",
  handler: publicHttpAction(async (ctx, request) => {
    const claims = await verifyLinkToken(tokenOf(request), Date.now());
    if (claims === null) {
      ctx.log.info("email.unsubscribe.invalid", { method: "POST" });
      return invalidPage();
    }
    await ctx.runMutation(internal.email.suppressions.add, { ...claims, reason: "unsubscribed" });
    ctx.log.info("email.unsubscribe.ok", { scope: claims.scope });
    return donePage(claims.scope);
  }),
});

function tokenOf(request: Request): string {
  return new URL(request.url).searchParams.get("t") ?? "";
}

export default http;
