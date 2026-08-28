import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { createPostAction } from "@/lib/actions-more";
import { getFeed } from "@/lib/store";
import { isPostgresEnabled } from "@/lib/db/client";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const posts = await getFeed();
  const canPost = isPostgresEnabled();

  return (
    <div>
      <PageHeader
        title="Feed"
        description="Artists post work and show updates. Showgoers follow favorites."
      />

      {canPost ? (
        <Panel className="mb-6">
          <form action={createPostAction} className="grid gap-3">
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Share studio progress, booth prep, or a show update…"
              className="ss-input"
            />
            <button type="submit" className="ss-btn ss-btn-primary w-fit min-h-[var(--tap)]">
              Post
            </button>
          </form>
        </Panel>
      ) : null}

      <div className="mx-auto max-w-2xl space-y-4">
        {posts.map(({ post, author, artist, show }) => (
          <Panel key={post.id} className="">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line)] text-sm font-bold">
                  {(artist?.displayName ?? author.name).slice(0, 1)}
                </div>
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
                  <p className="text-base text-[var(--muted)]">
                    {formatDate(post.createdAt, "MMM d · h:mm a")}
                  </p>
                </div>
              </div>
              {show ? <Badge tone="field">{show.name}</Badge> : null}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{post.body}</p>
          </Panel>
        ))}
        {!posts.length ? (
          <Panel>
            <p className="text-[var(--muted)]">No posts yet. Be the first to share an update.</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
