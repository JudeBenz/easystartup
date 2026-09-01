import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { FormBanner } from "@/components/form-banner";
import { SubmitButton } from "@/components/submit-button";
import { setThemeAction } from "@/lib/actions";
import { saveAvatarAction } from "@/lib/actions-more";
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_PRESETS,
  getThemePreset,
  resolveThemeId,
} from "@/lib/themes";
import { auth, signOut } from "@/lib/auth";
import { getSessionUser } from "@/lib/session-data";
import { StoredImage } from "@/components/stored-image";

export const metadata = { title: "Account" };

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

  if (!user) redirect("/signin?next=/settings");

  return (
    <div>
      <PageHeader title="Account" description="Your name, roles, and color scheme." />
      <FormBanner searchParams={sp} />

      <Panel well className="mb-6">
        <h2 className="font-display text-[1.4rem]">{user.name}</h2>
        <StoredImage
          objectKey={user.avatarUrl}
          alt=""
          className="mt-3 h-20 w-20 rounded-full object-cover"
        />
        <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
          {user.email} · {user.roles.join(", ")}
        </p>
        <form action={saveAvatarAction} encType="multipart/form-data" className="mt-4 grid max-w-md gap-3">
          <label className="ss-label">
            <span>Profile photo</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="ss-input" />
          </label>
          <SubmitButton className="ss-btn ss-btn-secondary min-h-[var(--tap)]">Save photo</SubmitButton>
        </form>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-4"
          >
            <button type="submit" className="ss-btn ss-btn-secondary min-h-[var(--tap)]">
              Sign out
            </button>
          </form>
        ) : null}
      </Panel>

      <Panel well className="mb-6">
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
