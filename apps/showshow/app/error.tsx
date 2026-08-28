"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-[var(--muted)]">Try again. If money was involved, check Stripe before retrying.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="ss-btn ss-btn-primary">
          Retry
        </button>
        <Link href="/" className="ss-btn ss-btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
