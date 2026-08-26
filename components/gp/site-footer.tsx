import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 py-8 pb-6 lg:mt-16 lg:py-10">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="gp-display text-xl text-white sm:text-2xl">
            Aruba Solo Cup GP
          </div>
          <p className="mt-1 max-w-md text-sm text-white/55">
            Family RC racing. Red cups. One phone for Race Control. $500 winner
            takes all.
          </p>
        </div>
        <div className="hidden flex-wrap gap-4 text-sm text-aruba-teal sm:flex">
          <Link href="/drivers" className="hover:underline">
            Drivers
          </Link>
          <Link href="/leaderboard" className="hover:underline">
            Standings
          </Link>
          <Link href="/rules" className="hover:underline">
            Rules
          </Link>
        </div>
      </div>
    </footer>
  );
}
