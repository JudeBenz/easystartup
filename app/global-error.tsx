"use client";

import { Button } from "@/components/ui/button";

/**
 * Last-resort fallback when the root layout itself errors. Must render its own
 * <html>/<body>. Inline bg/color so it stays on-brand even if no layout CSS vars
 * are present.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#F1F4F0", color: "#14181A" }}>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
            Something went wrong
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            The app hit an unexpected error.
          </h1>
          <p className="mt-2 max-w-md text-sm text-soft">
            Reload to get back to a working screen.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Button onClick={() => reset()}>Reload</Button>
            <Button asChild variant="outline">
              <a href="/home">Go home</a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
