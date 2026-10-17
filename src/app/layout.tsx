import type { Metadata } from "next";

import { AuthProviders } from "@/components/shared/auth-providers";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { SkipLink } from "@/components/shared/skip-link";
import { Toaster } from "@/components/ui/toaster";
import { fontVariables } from "@/styles/fonts";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Worldling",
  description: "Grow a world of your own. Visit everyone else's.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <OfflineBanner />
        <AuthProviders>{children}</AuthProviders>
        <Toaster />
      </body>
    </html>
  );
}
