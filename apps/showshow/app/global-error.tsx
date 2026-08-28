"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
