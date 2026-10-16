"use client";

import { Info } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function OverlaysSection() {
  return (
    <ShowcaseSection
      id="overlays"
      title="Overlays"
      description="Focus moves in, stays in, and returns to the trigger. Escape closes."
    >
      <ShowcaseRow label="Dialog and sheets">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Name your world</DialogTitle>
              <DialogDescription>Pick something short. You can change it later.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open bottom sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetTitle>Tend your world</SheetTitle>
            <SheetDescription>On phones, the creator panel lives here.</SheetDescription>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open side sheet</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              No comets yet. Share your world to get the first one.
            </SheetDescription>
          </SheetContent>
        </Sheet>
      </ShowcaseRow>
      <ShowcaseRow label="Confirm with typed phrase">
        <ConfirmDialog
          trigger={<Button variant="danger">Delete world</Button>}
          title="Delete Pebble?"
          description="Your world, its bloom and every comet will be gone for good. This can't be undone."
          confirmPhrase="pebble"
          confirmLabel="Delete forever"
          onConfirm={async () => {
            await wait(1);
            toast.success("Pebble was deleted.");
          }}
        />
      </ShowcaseRow>
      <ShowcaseRow label="Popover and tooltip">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost">What is bloom?</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-sm">
              Bloom grows when people visit and send comets. Your world changes as it blooms.
            </p>
          </PopoverContent>
        </Popover>
        <Tooltip content="Bloom grows with every visit">
          <IconButton label="About bloom" icon={<Info />} />
        </Tooltip>
      </ShowcaseRow>
      <ShowcaseRow label="Toasts">
        <Button variant="secondary" onClick={() => toast.success("Comet sent. It's on its way.")}>
          Success toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error("That comet didn't send. Check your connection and try again.")
          }
        >
          Error toast
        </Button>
        <Button variant="secondary" onClick={() => toast.info("Your world bloomed to level 3.")}>
          Info toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Draft saved", {
              description: "Sign in to keep it.",
              action: { label: "Sign in", onClick: () => undefined },
            })
          }
        >
          Toast with action
        </Button>
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
