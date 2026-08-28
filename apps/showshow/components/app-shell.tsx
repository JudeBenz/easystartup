import Link from "next/link";
import { getSessionUser, listUsers } from "@/lib/session-data";
import { switchUserAction, resetDemoAction } from "@/lib/actions";
import { SiteNav } from "@/components/site-nav";

function demoPersonasEnabled() {
  return (
    process.env.SHOWSHOW_DEMO_PERSONAS === "1" || !process.env.DATABASE_URL?.trim()
  );
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const users = await listUsers();
  const role = user.roles[0] ?? "guest";
  const demo = demoPersonasEnabled();

  const personaForm = demo ? (
    <form action={switchUserAction} className="grid gap-3">
      <label className="ss-label" htmlFor="persona">
        Choose a demo person
        <select
          id="persona"
          name="userId"
          defaultValue={user.id}
          className="ss-select"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.roles[0]})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="ss-btn ss-btn-primary w-full sm:w-auto">
        Switch person
      </button>
    </form>
  ) : (
    <p className="text-[1.05rem] text-[var(--muted)]">
      Demo personas are off. Sign in from Settings.
    </p>
  );

  const resetForm = demo ? (
    <form action={resetDemoAction}>
      <button type="submit" className="ss-btn ss-btn-secondary w-full sm:w-auto">
        Reset demo data
      </button>
    </form>
  ) : (
    <span />
  );

  return (
    <div className="min-h-screen">
      <SiteNav
        userLabel={`${user.name.split(" ")[0]} · ${role}`}
        roles={user.roles}
        personaForm={personaForm}
        resetForm={resetForm}
      />
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-6 pb-32 md:px-6 md:py-8 lg:pb-10"
      >
        {children}
      </main>
      <footer className="mx-auto hidden max-w-6xl px-6 pb-8 text-base text-[var(--muted)] lg:block">
        Facts from official show sites. Rankings come from artist reports, not guidebooks.{" "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}
