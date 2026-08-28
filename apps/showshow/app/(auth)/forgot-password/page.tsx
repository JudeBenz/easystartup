import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/ui";
import { requestPasswordResetAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const pg = isPostgresEnabled();

  return (
    <AppShell>
      <PageHeader
        title="Forgot password"
        description="We'll email a reset link when Postgres and Resend are configured."
      />

      {!pg ? (
        <Panel>
          <p className="text-[1.05rem] text-[var(--muted)]">
            Password reset is available in Postgres mode. Set <code>DATABASE_URL</code> first.
          </p>
          <p className="mt-3">
            <Link href="/settings" className="font-medium hover:text-[var(--field)]">
              Back to settings
            </Link>
          </p>
        </Panel>
      ) : params.sent ? (
        <Panel>
          <p className="text-[1.05rem]">
            If an account exists for that email, a reset link has been sent.
          </p>
          {params.preview ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Email not configured — dev preview:{" "}
              <a href={params.preview} className="break-all font-medium hover:text-[var(--field)]">
                {params.preview}
              </a>
            </p>
          ) : null}
          <p className="mt-4">
            <Link href="/settings" className="font-medium hover:text-[var(--field)]">
              Back to sign in
            </Link>
          </p>
        </Panel>
      ) : (
        <Panel className="max-w-lg">
          <form action={requestPasswordResetAction} className="grid gap-3">
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="ss-input"
            />
            <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              Send reset link
            </button>
          </form>
          <p className="mt-4 text-sm">
            <Link href="/settings" className="font-medium hover:text-[var(--field)]">
              Back to settings
            </Link>
          </p>
        </Panel>
      )}
    </AppShell>
  );
}
