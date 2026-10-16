import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id={MAIN_ID}
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center focus:outline-none"
    >
      <Logo variant="mark" className="size-20" />
      <h1 className="text-3xl font-semibold">This corner of space is quiet</h1>
      <p className="max-w-prose text-lg text-text-muted">
        There&apos;s no world at this address. It may have moved, or it was never here.
      </p>
      <Link href="/" className={buttonVariants({ variant: "primary" })}>
        Back to the start
      </Link>
    </main>
  );
}
