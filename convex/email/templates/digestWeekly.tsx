import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Greeting, Text } from "./Layout";
import { plural, type TemplateProps } from "./types";

function DigestEmail({
  data,
  siteUrl,
  unsubscribeUrl,
}: TemplateProps<EmailTemplateData<"digest.weekly">>) {
  return (
    <EmailLayout
      preview={`${plural(data.visits, "visit", "visits")} this week`}
      heading={`Your week on ${data.worldName}`}
      siteUrl={siteUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Greeting>Hi {data.displayName},</Greeting>
      <Text>Here is what happened on your world this week.</Text>
      <Text>
        {plural(data.visits, "visit", "visits")}
        <br />
        {plural(data.comets, "comet", "comets")}
        <br />
        Bloom level {data.level}
        <br />
        Tended on {plural(data.streak, "day", "days")}
      </Text>
      <Button href={data.worldUrl}>Tend my world</Button>
    </EmailLayout>
  );
}

export const digestWeekly = { ...EMAIL_TEMPLATES["digest.weekly"], Component: DigestEmail };
