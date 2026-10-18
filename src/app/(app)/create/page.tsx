import type { Metadata } from "next";

import { CreatorScreen } from "@/features/creator/creator-screen";

export const metadata: Metadata = {
  title: "Create your world · Worldling",
  description: "Shape a small world of your own: land, sky, colors and a name.",
};

export default function CreatePage() {
  return <CreatorScreen />;
}
