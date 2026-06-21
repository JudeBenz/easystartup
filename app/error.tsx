"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Route-level error fallback — keeps a thrown Server Component from white-screening. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        This screen hit an error.
      </h1>
      <p className="mt-2 max-w-md text-sm text-soft">
        Your data is safe. Try reloading this screen, or head back home.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/home">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
