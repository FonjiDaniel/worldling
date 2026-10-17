/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_email from "../admin/email.js";
import type * as email_compose from "../email/compose.js";
import type * as email_config from "../email/config.js";
import type * as email_dispatch from "../email/dispatch.js";
import type * as email_envConfig from "../email/envConfig.js";
import type * as email_errors from "../email/errors.js";
import type * as email_links from "../email/links.js";
import type * as email_outbox from "../email/outbox.js";
import type * as email_providers from "../email/providers.js";
import type * as email_suppressions from "../email/suppressions.js";
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
import type * as email_testSend from "../email/testSend.js";
import type * as email_types from "../email/types.js";
import type * as email_unsubscribePage from "../email/unsubscribePage.js";
import type * as email_workpool from "../email/workpool.js";
import type * as http from "../http.js";
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
import type * as model_emailConfigs from "../model/emailConfigs.js";
import type * as model_emailOutbox from "../model/emailOutbox.js";
import type * as shared_emailConfig from "../shared/emailConfig.js";
import type * as shared_emailTemplates from "../shared/emailTemplates.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_graphemes from "../shared/graphemes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/email": typeof admin_email;
  "email/compose": typeof email_compose;
  "email/config": typeof email_config;
  "email/dispatch": typeof email_dispatch;
  "email/envConfig": typeof email_envConfig;
  "email/errors": typeof email_errors;
  "email/links": typeof email_links;
  "email/outbox": typeof email_outbox;
  "email/providers": typeof email_providers;
  "email/suppressions": typeof email_suppressions;
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
  "email/testSend": typeof email_testSend;
  "email/types": typeof email_types;
  "email/unsubscribePage": typeof email_unsubscribePage;
  "email/workpool": typeof email_workpool;
  http: typeof http;
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
  "model/emailConfigs": typeof model_emailConfigs;
  "model/emailOutbox": typeof model_emailOutbox;
  "shared/emailConfig": typeof shared_emailConfig;
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
