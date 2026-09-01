"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem", textAlign: "center" }}>
        <h1>ShowShow error</h1>
        <p>{error.message}</p>
        <button type="button" onClick={reset}>
          Retry
        </button>
        <p>
          <Link href="/">Home</Link>
        </p>
      </body>
    </html>
  );
}
