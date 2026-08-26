import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="gp-display text-2xl text-white">Aruba Solo Cup GP</div>
          <p className="mt-1 max-w-md text-sm text-white/55">
            Family RC racing. Red cups. One phone for Race Control. $500 winner
            takes all. Mini prizes for the circuits. Grammy is inevitable.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-aruba-teal">
          <Link href="/drivers" className="hover:underline">
            Drivers
          </Link>
          <Link href="/leaderboard" className="hover:underline">
            Standings
          </Link>
          <Link href="/race-control" className="hover:underline">
            Race Control
          </Link>
        </div>
      </div>
    </footer>
  );
}
