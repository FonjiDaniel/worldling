import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Code, EmailLayout, Text } from "./Layout";
import type { TemplateProps } from "./types";

function AuthResetEmail({ data, siteUrl }: TemplateProps<EmailTemplateData<"auth.reset">>) {
  return (
    <EmailLayout
      preview={`Your reset code is ${data.code}`}
      heading="Reset your password"
      siteUrl={siteUrl}
    >
      <Text>Enter this code to choose a new password. It works for {data.minutes} minutes.</Text>
      <Code>{data.code}</Code>
      <Text muted>
        If you didn&apos;t ask for this, you can ignore this email. Your password stays the same.
      </Text>
    </EmailLayout>
  );
}

export const authReset = { ...EMAIL_TEMPLATES["auth.reset"], Component: AuthResetEmail };
