"use client";

import { Check, Copy, ExternalLink, Share } from "lucide-react";
import { type MouseEvent, type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toaster";
import { reportError } from "@/lib/logger";

import { type SharePayload, shareTargets } from "./share";

// Share a world (SPEC §12): the native sheet on touch devices, otherwise a small popover with
// copy link and the usual networks.

/** Touch devices with a share sheet. Desktop browsers that have one still get the popover. */
function canShareNatively(payload: SharePayload): boolean {
  if (typeof navigator.share !== "function") return false;
  if (!window.matchMedia("(pointer: coarse)").matches) return false;
  return "canShare" in navigator ? navigator.canShare(payload) : true;
}

async function shareNatively(payload: SharePayload): Promise<void> {
  try {
    await navigator.share(payload);
  } catch (error) {
    // Closing the sheet is a choice, not a failure.
    if (error instanceof DOMException && error.name === "AbortError") return;
    reportError(error, { fn: "world.share.native" });
    toast.error("We couldn't open sharing. Copy the link instead.");
  }
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("We couldn't copy the link. Select it above and copy it yourself.");
    }
  };
  return (
    <Button variant="secondary" className="w-full" onClick={() => void copy()}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function SharePanel({ payload }: { payload: SharePayload }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="wl-label text-text">Share this world</p>
      <input
        readOnly
        value={payload.url}
        aria-label="World link"
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        className="w-full truncate rounded-sm bg-void px-3 py-2 wl-small text-text-muted border-control"
      />
      <CopyLink url={payload.url} />
      <ul className="grid grid-cols-2 gap-2" aria-label="Share on">
        {shareTargets(payload).map((target) => (
          <li key={target.name}>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <a href={target.href} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {target.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ShareControlProps {
  payload: SharePayload;
  /** "icon" for the corner button, "primary" for the main action. */
  look: "icon" | "primary";
  label: string;
  className?: string;
}

export function ShareControl({ payload, look, label, className }: ShareControlProps) {
  const onClick = (event: MouseEvent) => {
    if (!canShareNatively(payload)) return;
    event.preventDefault();
    void shareNatively(payload);
  };
  const trigger: ReactNode =
    look === "icon" ? (
      <IconButton label={label} icon={<Share />} onClick={onClick} className={className} />
    ) : (
      <Button size="lg" onClick={onClick} className={className}>
        <Share aria-hidden />
        {label}
      </Button>
    );
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="glass-panel">
        <SharePanel payload={payload} />
      </PopoverContent>
    </Popover>
  );
}
