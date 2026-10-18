import { EMAIL_TEMPLATES, type EmailTemplateData } from "../../shared/emailTemplates";
import { Button, EmailLayout, Text } from "./Layout";
import type { TemplateProps } from "./types";

function ExportEmail({ data, siteUrl }: TemplateProps<EmailTemplateData<"account.export">>) {
  return (
    <EmailLayout
      preview="Your Worldling export is ready to download"
      heading="Your data is ready"
      siteUrl={siteUrl}
    >
      <Text>Your Worldling export is ready. The link works for {data.hours} hours.</Text>
      <Button href={data.downloadUrl}>Download my data</Button>
      <Text muted>If you didn&apos;t ask for this, change your password right away.</Text>
    </EmailLayout>
  );
}

export const accountExport = { ...EMAIL_TEMPLATES["account.export"], Component: ExportEmail };
