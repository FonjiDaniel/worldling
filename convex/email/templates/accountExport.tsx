import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Heading, Text } from "./Layout";
import type { TemplateProps } from "./types";

function ExportEmail({ data }: TemplateProps<EmailTemplateData<"account.export">>) {
  return (
    <EmailLayout preview="Your Worldling export is ready to download">
      <Heading>Your data is ready</Heading>
      <Text>Your Worldling export is ready. The link works for {data.hours} hours.</Text>
      <Button href={data.downloadUrl}>Download your data</Button>
      <Text muted>If you didn&apos;t ask for this, change your password right away.</Text>
    </EmailLayout>
  );
}

export const accountExport = { ...EMAIL_TEMPLATES["account.export"], Component: ExportEmail };
