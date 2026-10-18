import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { EmailLayout, Greeting, Text } from "./Layout";
import type { TemplateProps } from "./types";

function DeletedEmail({ data, siteUrl }: TemplateProps<EmailTemplateData<"account.deleted">>) {
  return (
    <EmailLayout
      preview="Your account and your world are deleted"
      heading="Goodbye for now"
      siteUrl={siteUrl}
    >
      <Greeting>Hi {data.displayName},</Greeting>
      <Text>
        Your Worldling account and your world are deleted. Thank you for growing something with us.
      </Text>
      <Text muted>If you didn&apos;t ask for this, reply to this email right away.</Text>
    </EmailLayout>
  );
}

export const accountDeleted = { ...EMAIL_TEMPLATES["account.deleted"], Component: DeletedEmail };
