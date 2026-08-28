import { cookies } from "next/headers";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { registerAccountAction, setThemeAction, signInAction } from "@/lib/actions";
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_PRESETS,
  getThemePreset,
  resolveThemeId,
} from "@/lib/themes";
import { isPostgresEnabled } from "@/lib/db/client";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { isEmailConfigured } from "@/lib/email/resend";
import { auth, signOut } from "@/lib/auth";
import { getSessionUser } from "@/lib/session-data";
import { isDemoPersonasEnabled } from "@/lib/demo-mode";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const jar = await cookies();
  const current = resolveThemeId(jar.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  const active = getThemePreset(current);
  const session = await auth();
  const user = await getSessionUser();
  const pg = isPostgresEnabled();
  const stripeOk = isStripeConfigured();
  const emailOk = isEmailConfigured();
  const demo = isDemoPersonasEnabled();
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account, theme, and system readiness for production hosting."
      />

      <FormBanner searchParams={sp} />

      {next && !session?.user ? (
        <Panel className="mb-6 border-l-4 border-[var(--accent)]">
          <p className="text-[1.05rem]">
            Sign in to continue to{" "}
            <code className="text-sm">{next}</code>
          </p>
        </Panel>
      ) : null}

      <Panel className="mb-6">
        <h2 className="font-display text-[1.4rem]">Account</h2>
        <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
          Signed in as <strong>{user.name}</strong> ({user.email}) · roles{" "}
          {user.roles.join(", ")}
          {session?.user
            ? " · secure session"
            : demo
              ? " · demo persona"
              : " · sign in for a secure session"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <form action={signInAction} className="grid gap-3">
            <p className="text-base font-bold">Email sign-in</p>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="ss-input"
              defaultValue={user.email}
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="ss-input"
            />
            <SubmitButton>Sign in</SubmitButton>
            <p className="text-sm text-[var(--muted)]">
              {demo ? (
                <>
                  Seeded demo password when DB is seeded: <code>showshow</code>
                  {" · "}
                </>
              ) : null}
              {pg ? (
                <a href="/forgot-password" className="font-medium hover:text-[var(--field)]">
                  Forgot password?
                </a>
              ) : null}
            </p>
          </form>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/settings" });
            }}
            className="flex flex-col justify-end"
          >
            <button type="submit" className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
              Sign out
            </button>
          </form>
        </div>
      </Panel>

      {pg ? (
        <Panel className="mb-6">
          <h2 className="font-display text-[1.4rem]">Create account</h2>
          <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
            Registers into Postgres with a hashed password, then signs you in.
          </p>
          <form action={registerAccountAction} className="mt-4 grid max-w-lg gap-3">
            <input name="name" required placeholder="Full name" className="ss-input" />
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="ss-input"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (8+ characters)"
              className="ss-input"
            />
            <label className="ss-label">
              Starting role
              <select name="role" className="ss-select" defaultValue="artist">
                <option value="artist">Artist</option>
                <option value="showgoer">Showgoer</option>
                <option value="director">Director</option>
              </select>
            </label>
            <SubmitButton>Create account</SubmitButton>
          </form>
        </Panel>
      ) : null}

      <Panel className="mb-6">
        <h2 className="font-display text-[1.4rem]">Production readiness</h2>
        <ul className="mt-3 space-y-2 text-[1.05rem]">
          <li className="flex items-center justify-between gap-3">
            <span>Postgres (`DATABASE_URL`)</span>
            <Badge tone={pg ? "field" : "warn"}>
              {pg ? "connected path" : "demo JSON fallback"}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Stripe keys</span>
            <Badge tone={stripeOk ? "field" : "warn"}>
              {stripeOk ? "configured" : "not set — commerce offline"}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Auth secret</span>
            <Badge tone={process.env.AUTH_SECRET ? "field" : "warn"}>
              {process.env.AUTH_SECRET ? "set" : "missing AUTH_SECRET"}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Resend email</span>
            <Badge tone={emailOk ? "field" : "warn"}>
              {emailOk ? "configured" : "deadline mail skipped"}
            </Badge>
          </li>
        </ul>
        <p className="mt-3 text-base text-[var(--muted)]">
          See <code>docs/ARCHITECTURE.md</code> and <code>docs/DEPLOY.md</code>.
        </p>
      </Panel>

      <Panel className="mb-6">
        <p className="text-[1.125rem]">
          Current theme: <strong>{active.name}</strong>
        </p>
        <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{active.blurb}</p>
      </Panel>

      <h2 className="font-display mb-4 text-[1.5rem]">Color schemes</h2>
      <form action={setThemeAction} className="grid gap-4 sm:grid-cols-2">
        {THEME_PRESETS.map((theme) => {
          const selected = theme.id === current;
          return (
            <label
              key={theme.id}
              className={`ss-panel flex cursor-pointer flex-col gap-4 !p-5 transition ${
                selected ? "outline outline-[3px] outline-[var(--accent)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[1.25rem] font-bold">{theme.name}</p>
                  <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{theme.blurb}</p>
                </div>
                {selected ? <Badge tone="field">Active</Badge> : null}
              </div>
              <div className="flex gap-2" aria-hidden="true">
                {theme.swatches.map((color) => (
                  <span
                    key={color}
                    className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--line)]"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="mt-auto flex items-center gap-3">
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  defaultChecked={selected}
                  className="h-6 w-6 accent-[var(--accent)]"
                />
                <span className="text-[1.05rem] font-bold">
                  {selected ? "Selected" : "Use this scheme"}
                </span>
              </div>
            </label>
          );
        })}
        <div className="sm:col-span-2">
          <SubmitButton>Save color scheme</SubmitButton>
        </div>
      </form>
    </div>
  );
}
