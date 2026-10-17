import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Code, EmailLayout, Heading, Text } from "./Layout";
import type { TemplateProps } from "./types";

function AuthVerifyEmail({ data }: TemplateProps<EmailTemplateData<"auth.verify">>) {
  return (
    <EmailLayout preview={`Your code is ${data.code}`}>
      <Heading>Your verification code</Heading>
      <Text>Enter this code to finish signing in. It works for {data.minutes} minutes.</Text>
      <Code>{data.code}</Code>
      <Text muted>If you didn&apos;t ask for this, you can ignore this email.</Text>
    </EmailLayout>
  );
}

export const authVerify = { ...EMAIL_TEMPLATES["auth.verify"], Component: AuthVerifyEmail };
