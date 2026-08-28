import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { resetPasswordAction } from "@/lib/actions";
import { isPostgresEnabled } from "@/lib/db/client";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  const pg = isPostgresEnabled();
  const email = params.email ?? "";
  const token = params.token ?? "";

  return (
    <AppShell>
      <PageHeader
        title="Reset password"
        description="Choose a new password for your ShowShow account."
      />

      <FormBanner searchParams={params} />

      {!pg ? (
        <Panel>
          <p className="text-[1.05rem] text-[var(--muted)]">
            Password reset requires Postgres. Set <code>DATABASE_URL</code> first.
          </p>
        </Panel>
      ) : !email || !token ? (
        <Panel>
          <p className="text-[1.05rem] text-[var(--muted)]">
            This reset link is incomplete. Request a new one from{" "}
            <Link href="/forgot-password" className="font-medium hover:text-[var(--field)]">
              forgot password
            </Link>
            .
          </p>
        </Panel>
      ) : (
        <Panel className="max-w-lg">
          <form action={resetPasswordAction} className="grid gap-3">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="token" value={token} />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="New password (8+ characters)"
              className="ss-input"
            />
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="Confirm new password"
              className="ss-input"
            />
            <SubmitButton>Update password</SubmitButton>
          </form>
        </Panel>
      )}
    </AppShell>
  );
}
