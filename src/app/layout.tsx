import type { Metadata } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Worldling",
  description: "Grow a world of your own. Visit everyone else's.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
