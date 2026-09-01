import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { registerAccountAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";

export const metadata = { title: "Create account" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pg = isPostgresEnabled();
  const role = typeof sp.role === "string" ? sp.role : "artist";

  return (
    <AppShell>
      <PageHeader
        title="Create a ShowShow account"
        description="Artists track applications and ROI. Directors claim fairs. Showgoers follow artists at the weekend."
      />
      <FormBanner searchParams={sp} />
      <Panel well className="max-w-lg">
        {!pg ? (
          <p className="text-[1.05rem] text-[var(--muted)]">
            Signup needs the production database. You can still browse shows, maps, and rankings.
          </p>
        ) : (
          <form action={registerAccountAction} className="grid gap-3">
            <label className="ss-label">
              Full name
              <input name="name" required className="ss-input" autoComplete="name" />
            </label>
            <label className="ss-label">
              Email
              <input name="email" type="email" required className="ss-input" autoComplete="email" />
            </label>
            <label className="ss-label">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="ss-input"
                autoComplete="new-password"
              />
            </label>
            <label className="ss-label">
              I am a
              <select name="role" className="ss-select" defaultValue={role}>
                <option value="artist">Exhibiting artist</option>
                <option value="director">Show director</option>
                <option value="showgoer">Showgoer</option>
              </select>
            </label>
            <SubmitButton>Create account</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-sm">
          <Link href="/signin" className="font-medium hover:text-[var(--field)]">
            Already have an account? Sign in
          </Link>
        </p>
      </Panel>
    </AppShell>
  );
}
