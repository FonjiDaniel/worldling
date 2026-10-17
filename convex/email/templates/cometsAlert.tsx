import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Heading, Quote, Text } from "./Layout";
import { plural, type TemplateProps } from "./types";

function CometsAlertEmail({
  data,
  unsubscribeUrl,
}: TemplateProps<EmailTemplateData<"comets.alert">>) {
  const more = data.count - data.comets.length;
  return (
    <EmailLayout
      preview={`Visitors left you ${plural(data.count, "comet", "comets")}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading>{EMAIL_TEMPLATES["comets.alert"].subject(data)}</Heading>
      <Text>Hi {data.displayName}, visitors left you something.</Text>
      {data.comets.map((comet, index) => (
        <Quote key={index} from={comet.from}>
          {comet.text}
        </Quote>
      ))}
      {more > 0 && <Text muted>And {plural(more, "more comet", "more comets")}.</Text>}
      <Button href={data.worldUrl}>See your comets</Button>
    </EmailLayout>
  );
}

export const cometsAlert = { ...EMAIL_TEMPLATES["comets.alert"], Component: CometsAlertEmail };
