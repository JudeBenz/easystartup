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

  const isProd = process.env.NODE_ENV === "production";
  const detail = !isProd && error.message ? error.message : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-[var(--muted)]">
        Try again. If money was involved, check Stripe before retrying checkout.
      </p>
      {detail ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="ss-btn ss-btn-primary">
          Retry
        </button>
        <Link href="/" className="ss-btn ss-btn-secondary">
          Home
        </Link>
        <Link href="/settings" className="ss-btn ss-btn-ghost">
          Settings
        </Link>
      </div>
    </div>
  );
}
