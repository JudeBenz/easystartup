import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { createPostAction } from "@/lib/actions-more";
import { getFeed } from "@/lib/store";
import { isPostgresEnabled } from "@/lib/db/client";
import { auth } from "@/lib/auth";

export const metadata = { title: "Feed" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const posts = await getFeed();
  const pg = isPostgresEnabled();
  const session = await auth();

  return (
    <div>
      <PageHeader
        title="Feed"
        description="Artists post work and show updates. Showgoers follow favorites."
      />

      <FormBanner searchParams={sp} />

      {!pg ? (
        <Panel className="mb-6">
          <p className="text-[1.05rem] text-[var(--muted)]">
            Posting requires Postgres. Set <code>DATABASE_URL</code> and seed the database to enable
            the feed composer.
          </p>
        </Panel>
      ) : !session?.user ? (
        <Panel className="mb-6">
          <p className="text-[1.05rem] text-[var(--muted)]">
            <Link href="/signin" className="font-medium underline">
              Sign in
            </Link>{" "}
            to post updates. Browsing the feed works without an account.
          </p>
        </Panel>
      ) : (
        <Panel well className="mb-6">
          <form action={createPostAction} className="grid gap-3">
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Share studio progress, booth prep, or a show update…"
              className="ss-input"
            />
            <SubmitButton pendingLabel="Posting…">Post</SubmitButton>
          </form>
        </Panel>
      )}

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
