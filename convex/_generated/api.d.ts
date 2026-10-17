/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as email_templates_Layout from "../email/templates/Layout.js";
import type * as email_templates_accountDeleted from "../email/templates/accountDeleted.js";
import type * as email_templates_accountExport from "../email/templates/accountExport.js";
import type * as email_templates_accountWelcome from "../email/templates/accountWelcome.js";
import type * as email_templates_adminTest from "../email/templates/adminTest.js";
import type * as email_templates_authReset from "../email/templates/authReset.js";
import type * as email_templates_authVerify from "../email/templates/authVerify.js";
import type * as email_templates_cometsAlert from "../email/templates/cometsAlert.js";
import type * as email_templates_digestWeekly from "../email/templates/digestWeekly.js";
import type * as email_templates_index from "../email/templates/index.js";
import type * as email_templates_render from "../email/templates/render.js";
import type * as email_templates_theme from "../email/templates/theme.js";
import type * as email_templates_types from "../email/templates/types.js";
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
import type * as shared_emailTemplates from "../shared/emailTemplates.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_graphemes from "../shared/graphemes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "email/templates/Layout": typeof email_templates_Layout;
  "email/templates/accountDeleted": typeof email_templates_accountDeleted;
  "email/templates/accountExport": typeof email_templates_accountExport;
  "email/templates/accountWelcome": typeof email_templates_accountWelcome;
  "email/templates/adminTest": typeof email_templates_adminTest;
  "email/templates/authReset": typeof email_templates_authReset;
  "email/templates/authVerify": typeof email_templates_authVerify;
  "email/templates/cometsAlert": typeof email_templates_cometsAlert;
  "email/templates/digestWeekly": typeof email_templates_digestWeekly;
  "email/templates/index": typeof email_templates_index;
  "email/templates/render": typeof email_templates_render;
  "email/templates/theme": typeof email_templates_theme;
  "email/templates/types": typeof email_templates_types;
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
  "shared/emailTemplates": typeof shared_emailTemplates;
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
