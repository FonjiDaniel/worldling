import type { ComponentType } from "react";

import type { EmailTemplateKey } from "../../shared/emailTemplates";
import { accountDeleted } from "./accountDeleted";
import { accountExport } from "./accountExport";
import { accountWelcome } from "./accountWelcome";
import { adminTest } from "./adminTest";
import { authReset } from "./authReset";
import { authVerify } from "./authVerify";
import { cometsAlert } from "./cometsAlert";
import { digestWeekly } from "./digestWeekly";
import type { TemplateProps } from "./types";

// Each template is { category, schema, subject, previewData, Component } (SPEC §7.7).
export const templates = {
  "auth.verify": authVerify,
  "auth.reset": authReset,
  "account.welcome": accountWelcome,
  "account.export": accountExport,
  "account.deleted": accountDeleted,
  "comets.alert": cometsAlert,
  "digest.weekly": digestWeekly,
  "admin.test": adminTest,
} satisfies Record<EmailTemplateKey, object>;

/** The component for `key`, typed loosely for rendering data that is already validated. */
export function componentFor(key: EmailTemplateKey): ComponentType<TemplateProps<unknown>> {
  return templates[key].Component as ComponentType<TemplateProps<unknown>>;
}
