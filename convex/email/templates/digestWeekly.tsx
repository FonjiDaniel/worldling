import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Heading, Text } from "./Layout";
import { plural, type TemplateProps } from "./types";

function DigestEmail({ data, unsubscribeUrl }: TemplateProps<EmailTemplateData<"digest.weekly">>) {
  return (
    <EmailLayout
      preview={`${plural(data.visits, "visit", "visits")} this week`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading>Your week on {data.worldName}</Heading>
      <Text>Hi {data.displayName}, here is how your world did this week.</Text>
      <Text>
        {plural(data.visits, "visit", "visits")}
        <br />
        {plural(data.comets, "comet", "comets")}
        <br />
        Level {data.level}
        <br />
        {plural(data.streak, "day", "days")} of tending in a row
      </Text>
      <Button href={data.worldUrl}>Tend your world</Button>
    </EmailLayout>
  );
}

export const digestWeekly = { ...EMAIL_TEMPLATES["digest.weekly"], Component: DigestEmail };
