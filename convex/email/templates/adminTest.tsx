import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { EmailLayout, Heading, Text } from "./Layout";
import type { TemplateProps } from "./types";

const TRANSPORT_LABEL = { smtp: "SMTP", resend: "Resend" } as const;
const SOURCE_LABEL = { db: "the saved settings", env: "the environment fallback" } as const;

function AdminTestEmail({ data }: TemplateProps<EmailTemplateData<"admin.test">>) {
  return (
    <EmailLayout preview="Your email setup works">
      <Heading>Your email setup works</Heading>
      <Text>
        This test came through {TRANSPORT_LABEL[data.transport]} using {SOURCE_LABEL[data.source]}.
      </Text>
      <Text muted>You can activate this setup now.</Text>
    </EmailLayout>
  );
}

export const adminTest = { ...EMAIL_TEMPLATES["admin.test"], Component: AdminTestEmail };
