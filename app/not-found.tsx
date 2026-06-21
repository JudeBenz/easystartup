import Link from "next/link";
import { Button } from "@/components/ui/button";

/** On-brand 404 — for notFound() calls and unmatched routes. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
        404 · Not found
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-2 max-w-md text-sm text-soft">
        The link may be broken, or the item may have been removed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/home">Go home</Link>
      </Button>
    </div>
  );
}
