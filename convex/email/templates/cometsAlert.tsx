import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Greeting, Quote, Text } from "./Layout";
import { plural, type TemplateProps } from "./types";

function CometsAlertEmail({
  data,
  siteUrl,
  unsubscribeUrl,
}: TemplateProps<EmailTemplateData<"comets.alert">>) {
  const more = data.count - data.comets.length;
  return (
    <EmailLayout
      preview={`Visitors left you ${plural(data.count, "comet", "comets")}`}
      heading={
        data.count === 1
          ? `A comet landed on ${data.worldName}`
          : `${plural(data.count, "comet", "comets")} landed on ${data.worldName}`
      }
      siteUrl={siteUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Greeting>Hi {data.displayName},</Greeting>
      <Text>Visitors left you something kind.</Text>
      {data.comets.map((comet, index) => (
        <Quote key={index} from={comet.from}>
          {comet.text}
        </Quote>
      ))}
      {more > 0 && <Text muted>And {plural(more, "more comet", "more comets")}.</Text>}
      <Button href={data.worldUrl}>Read my comets</Button>
    </EmailLayout>
  );
}

export const cometsAlert = { ...EMAIL_TEMPLATES["comets.alert"], Component: CometsAlertEmail };
