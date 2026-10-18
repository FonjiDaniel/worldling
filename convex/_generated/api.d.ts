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
import type * as admin_system from "../admin/system.js";
import type * as auth from "../auth.js";
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
import type * as email_templates_emailLayout from "../email/templates/emailLayout.js";
import type * as email_templates_emailTheme from "../email/templates/emailTheme.js";
import type * as email_templates_index from "../email/templates/index.js";
import type * as email_templates_render from "../email/templates/render.js";
import type * as email_templates_types from "../email/templates/types.js";
import type * as email_testSend from "../email/testSend.js";
import type * as email_types from "../email/types.js";
import type * as email_unsubscribePage from "../email/unsubscribePage.js";
import type * as email_workpool from "../email/workpool.js";
import type * as http from "../http.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authEmail from "../lib/authEmail.js";
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
import type * as model_admin from "../model/admin.js";
import type * as model_emailConfigs from "../model/emailConfigs.js";
import type * as model_emailOutbox from "../model/emailOutbox.js";
import type * as model_profiles from "../model/profiles.js";
import type * as model_sessions from "../model/sessions.js";
import type * as model_worlds from "../model/worlds.js";
import type * as profiles from "../profiles.js";
import type * as sessions from "../sessions.js";
import type * as shared_commonPasswords from "../shared/commonPasswords.js";
import type * as shared_emailConfig from "../shared/emailConfig.js";
import type * as shared_emailTemplates from "../shared/emailTemplates.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_galaxy from "../shared/galaxy.js";
import type * as shared_graphemes from "../shared/graphemes.js";
import type * as shared_moderation from "../shared/moderation.js";
import type * as shared_otp from "../shared/otp.js";
import type * as shared_password from "../shared/password.js";
import type * as shared_random from "../shared/random.js";
import type * as shared_usernames from "../shared/usernames.js";
import type * as shared_worldParams from "../shared/worldParams.js";
import type * as system from "../system.js";
import type * as testing_e2e from "../testing/e2e.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/email": typeof admin_email;
  "admin/system": typeof admin_system;
  auth: typeof auth;
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
  "email/templates/emailLayout": typeof email_templates_emailLayout;
  "email/templates/emailTheme": typeof email_templates_emailTheme;
  "email/templates/index": typeof email_templates_index;
  "email/templates/render": typeof email_templates_render;
  "email/templates/types": typeof email_templates_types;
  "email/testSend": typeof email_testSend;
  "email/types": typeof email_types;
  "email/unsubscribePage": typeof email_unsubscribePage;
  "email/workpool": typeof email_workpool;
  http: typeof http;
  "lib/audit": typeof lib_audit;
  "lib/authEmail": typeof lib_authEmail;
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
  "model/admin": typeof model_admin;
  "model/emailConfigs": typeof model_emailConfigs;
  "model/emailOutbox": typeof model_emailOutbox;
  "model/profiles": typeof model_profiles;
  "model/sessions": typeof model_sessions;
  "model/worlds": typeof model_worlds;
  profiles: typeof profiles;
  sessions: typeof sessions;
  "shared/commonPasswords": typeof shared_commonPasswords;
  "shared/emailConfig": typeof shared_emailConfig;
  "shared/emailTemplates": typeof shared_emailTemplates;
  "shared/errors": typeof shared_errors;
  "shared/galaxy": typeof shared_galaxy;
  "shared/graphemes": typeof shared_graphemes;
  "shared/moderation": typeof shared_moderation;
  "shared/otp": typeof shared_otp;
  "shared/password": typeof shared_password;
  "shared/random": typeof shared_random;
  "shared/usernames": typeof shared_usernames;
  "shared/worldParams": typeof shared_worldParams;
  system: typeof system;
  "testing/e2e": typeof testing_e2e;
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
