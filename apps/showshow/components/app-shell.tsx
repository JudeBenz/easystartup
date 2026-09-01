import Link from "next/link";
import { getSessionUser, listUsers } from "@/lib/session-data";
import { switchUserAction, resetDemoAction } from "@/lib/actions";
import { SiteNav } from "@/components/site-nav";
import { isDemoPersonasEnabled } from "@/lib/demo-mode";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const demo = isDemoPersonasEnabled();
  const role = user?.roles[0] ?? "guest";

  const accountPanel = demo ? (
    <>
      <form action={switchUserAction} className="grid gap-3">
        <label className="ss-label" htmlFor="persona">
          Internal demo person
          <select
            id="persona"
            name="userId"
            defaultValue={user?.id}
            className="ss-select"
          >
            {(await listUsers()).map((u) => (
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
      <form action={resetDemoAction}>
        <button type="submit" className="ss-btn ss-btn-secondary w-full sm:w-auto">
          Reset demo data
        </button>
      </form>
    </>
  ) : user ? (
    <p className="text-[1.05rem] text-[var(--muted)]">
      Signed in as {user.name}.{" "}
      <Link href="/settings" className="font-medium underline">
        Account
      </Link>
    </p>
  ) : (
    <div className="flex flex-col gap-3">
      <Link href="/signin" className="ss-btn ss-btn-secondary w-full">
        Sign in
      </Link>
      <Link href="/join" className="ss-btn ss-btn-primary w-full">
        Create account
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SiteNav
        userLabel={user ? `${user.name.split(" ")[0]} · ${role}` : ""}
        roles={user?.roles ?? []}
        signedIn={Boolean(user)}
        accountPanel={accountPanel}
      />
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-6 pb-32 md:px-6 md:py-8 lg:pb-10"
      >
        {children}
      </main>
      <footer className="mx-auto hidden max-w-6xl border-t border-[var(--line)] px-6 py-8 font-meta text-[var(--muted)] lg:block">
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
