import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { signInAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";
import { isDemoPersonasEnabled } from "@/lib/demo-mode";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const pg = isPostgresEnabled();
  const demo = isDemoPersonasEnabled();

  return (
    <AppShell>
      <PageHeader title="Sign in" description="Use the email and password for your ShowShow account." />
      <FormBanner searchParams={sp} />
      <Panel well className="max-w-lg">
        {!pg && !demo ? (
          <p className="text-[1.05rem] text-[var(--muted)]">
            Accounts are stored in Postgres. Browse the directory without signing in, or set{" "}
            <code>DATABASE_URL</code> to enable sign-in.
          </p>
        ) : (
          <form action={signInAction} className="grid gap-3">
            <input type="hidden" name="next" value={next} />
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
                className="ss-input"
                autoComplete="current-password"
              />
            </label>
            <SubmitButton>Sign in</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-sm text-[var(--muted)]">
          {pg ? (
            <>
              <Link href="/forgot-password" className="font-medium hover:text-[var(--field)]">
                Forgot password?
              </Link>
              {" · "}
            </>
          ) : null}
          <Link href="/join" className="font-medium hover:text-[var(--field)]">
            Create an account
          </Link>
        </p>
      </Panel>
    </AppShell>
  );
}
