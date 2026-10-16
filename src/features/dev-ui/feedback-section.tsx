"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

export function FeedbackSection() {
  return (
    <ShowcaseSection
      id="feedback"
      title="Feedback"
      description="Status always pairs color with an icon and words."
    >
      <ShowcaseRow label="Badges">
        <Badge>Draft</Badge>
        <Badge tone="primary">Level 3</Badge>
        <Badge tone="accent">Blooming</Badge>
        <Badge tone="success">
          <CircleCheck aria-hidden />
          Delivered
        </Badge>
        <Badge tone="warning">
          <TriangleAlert aria-hidden />
          Unsaved
        </Badge>
        <Badge tone="danger">
          <CircleAlert aria-hidden />
          Failed
        </Badge>
        <Badge tone="info">
          <Info aria-hidden />
          Update
        </Badge>
      </ShowcaseRow>
      <ShowcaseRow label="Avatars">
        <Avatar name="Ada Lovelace" size="sm" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" size="lg" />
      </ShowcaseRow>
      <ShowcaseRow label="Tabs">
        <Tabs defaultValue="comets" className="w-full">
          <TabsList aria-label="World activity">
            <TabsTrigger value="comets">Comets</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="bloom">Bloom</TabsTrigger>
          </TabsList>
          <TabsContent value="comets">12 comets this week.</TabsContent>
          <TabsContent value="visitors">48 visits this week.</TabsContent>
          <TabsContent value="bloom">Level 3, halfway to 4.</TabsContent>
        </Tabs>
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
