import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { EmailLayout, Heading, Text } from "./Layout";
import type { TemplateProps } from "./types";

function DeletedEmail({ data }: TemplateProps<EmailTemplateData<"account.deleted">>) {
  return (
    <EmailLayout preview="Your account and your world are deleted">
      <Heading>Goodbye for now, {data.displayName}</Heading>
      <Text>
        Your Worldling account and your world are deleted. Thank you for growing something with us.
      </Text>
      <Text muted>If you didn&apos;t ask for this, reply to this email right away.</Text>
    </EmailLayout>
  );
}

export const accountDeleted = { ...EMAIL_TEMPLATES["account.deleted"], Component: DeletedEmail };
