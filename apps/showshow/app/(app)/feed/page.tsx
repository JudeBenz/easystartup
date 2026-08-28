import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getFeed } from "@/lib/store";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const posts = await getFeed();

  return (
    <div>
      <PageHeader
        title="Feed"
        description="Artists post work and show updates. Showgoers follow favorites."
      />
      <div className="mx-auto max-w-2xl space-y-4">
        {posts.map(({ post, author, artist, show }) => (
          <Panel key={post.id} className="">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={author.avatarUrl ?? "https://api.dicebear.com/9.x/shapes/svg?seed=x"}
                  alt=""
                  className="h-10 w-10 rounded-full bg-white"
                />
                <div>
                  <p className="font-semibold">
                    {artist ? (
                      <Link href={`/artists/${artist.slug}`} className="hover:text-[var(--field)]">
                        {artist.displayName}
                      </Link>
                    ) : (
                      author.name
                    )}
                  </p>
                  <p className="text-base text-[var(--muted)]">{formatDate(post.createdAt, "MMM d · h:mm a")}</p>
                </div>
              </div>
              {show ? <Badge tone="field">{show.name}</Badge> : null}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{post.body}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
