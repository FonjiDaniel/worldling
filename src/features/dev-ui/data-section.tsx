"use client";

import dynamic from "next/dynamic";

import { LoadingState } from "@/components/shared/loading-state";

import { ShowcaseSection } from "./showcase-section";

// Admin-only widgets load on demand so they never weigh on public pages.
const DataDemos = dynamic(() => import("./data-demos").then((mod) => mod.DataDemos), {
  ssr: false,
  loading: () => <LoadingState label="Loading data widgets" />,
});

export function DataSection() {
  return (
    <ShowcaseSection
      id="data"
      title="Data"
      description="Admin table and chart. Sort with the column buttons."
    >
      <DataDemos />
    </ShowcaseSection>
  );
}
