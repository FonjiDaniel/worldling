import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Greeting, Text } from "./Layout";
import type { TemplateProps } from "./types";

function WelcomeEmail({
  data,
  siteUrl,
  unsubscribeUrl,
}: TemplateProps<EmailTemplateData<"account.welcome">>) {
  return (
    <EmailLayout
      preview={`${data.worldName} is out there now`}
      heading="Grow a world of your own."
      siteUrl={siteUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Greeting>Hi {data.displayName},</Greeting>
      <Text>
        You&apos;ve found a little corner of the universe. {data.worldName} is out there now, ready
        to grow. Visit other worlds and leave a comet, a short, kind message, when one makes you
        smile.
      </Text>
      <Button href={data.worldUrl}>View my world</Button>
      <Text muted>Your world will bloom as you tend it and friends visit.</Text>
    </EmailLayout>
  );
}

export const accountWelcome = { ...EMAIL_TEMPLATES["account.welcome"], Component: WelcomeEmail };
