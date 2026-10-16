import { env } from "./env";

/** /dev/** routes exist in development, or in a production build made for e2e tests. */
export function devRoutesEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || env.DEV_ROUTES === "true";
}
