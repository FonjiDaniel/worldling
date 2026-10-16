"use client";

import { type ReactNode, type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function isConfirmationMatch(input: string, phrase: string): boolean {
  return input === phrase;
}

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  /** The exact text the person must type, for example their username. */
  confirmPhrase: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmPhrase,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
}: ConfirmDialogProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const matches = isConfirmationMatch(typed, confirmPhrase);

  function handleOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) setTyped("");
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!matches || pending) return;
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
      setTyped("");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent role="alertdialog">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <Label htmlFor={inputId}>
              Type <span className="font-mono text-warning">{confirmPhrase}</span> to confirm
            </Label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value);
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={pending}
            />
          </Field>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                handleOpenChange(false);
              }}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" variant="danger" disabled={!matches} pending={pending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
