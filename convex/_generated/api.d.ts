/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_audit from "../lib/audit.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_jobRuns from "../lib/jobRuns.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_settings from "../lib/settings.js";
import type * as lib_systemEvents from "../lib/systemEvents.js";
import type * as lib_time from "../lib/time.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_graphemes from "../shared/graphemes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/audit": typeof lib_audit;
  "lib/crypto": typeof lib_crypto;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/functions": typeof lib_functions;
  "lib/jobRuns": typeof lib_jobRuns;
  "lib/logger": typeof lib_logger;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/settings": typeof lib_settings;
  "lib/systemEvents": typeof lib_systemEvents;
  "lib/time": typeof lib_time;
  "shared/errors": typeof shared_errors;
  "shared/graphemes": typeof shared_graphemes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  emailWorkpool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"emailWorkpool">;
  shardedCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"shardedCounter">;
};
