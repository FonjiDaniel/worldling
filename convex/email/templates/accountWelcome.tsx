import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Heading, Text } from "./Layout";
import type { TemplateProps } from "./types";

function WelcomeEmail({
  data,
  unsubscribeUrl,
}: TemplateProps<EmailTemplateData<"account.welcome">>) {
  return (
    <EmailLayout preview={`${data.worldName} is out there now`} unsubscribeUrl={unsubscribeUrl}>
      <Heading>Welcome, {data.displayName}</Heading>
      <Text>
        {data.worldName} is out there now, waiting to bloom. Tend it each day and it grows. Visit
        other worlds and leave a comet when one makes you smile.
      </Text>
      <Button href={data.worldUrl}>Visit your world</Button>
    </EmailLayout>
  );
}

export const accountWelcome = { ...EMAIL_TEMPLATES["account.welcome"], Component: WelcomeEmail };
