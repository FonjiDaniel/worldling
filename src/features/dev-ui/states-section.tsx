"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OfflineNotice } from "@/components/shared/offline-banner";
import { toast } from "@/components/ui/toaster";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

export function StatesSection() {
  return (
    <ShowcaseSection
      id="states"
      title="States"
      description="Every screen designs loading, empty, error, offline and signed out (SPEC §2.8)."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <ShowcaseRow label="Loading">
          <div className="w-full rounded-lg border border-line p-6">
            <LoadingState label="Loading comets" />
          </div>
        </ShowcaseRow>
        <ShowcaseRow label="Empty">
          <EmptyState
            className="w-full"
            title="No comets yet"
            description="Share your world to get the first one."
            action={<Button variant="secondary">Copy link</Button>}
          />
        </ShowcaseRow>
        <ShowcaseRow label="Error">
          <ErrorState
            className="w-full"
            description="We couldn't load the comets. Check your connection and try again."
            onRetry={() => toast.info("Trying again.")}
          />
        </ShowcaseRow>
        <ShowcaseRow label="Signed out">
          <EmptyState
            className="w-full"
            title="Your world is waiting"
            description="Sign in to tend your world and send comets."
            action={<Button>Sign in</Button>}
          />
        </ShowcaseRow>
      </div>
      <ShowcaseRow label="Offline banner (static preview)">
        <div className="w-full overflow-hidden rounded-md border border-line">
          <OfflineNotice />
        </div>
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
