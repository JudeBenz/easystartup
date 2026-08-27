import { cookies } from "next/headers";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { setThemeAction } from "@/lib/actions";
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_PRESETS,
  getThemePreset,
  resolveThemeId,
} from "@/lib/themes";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const jar = await cookies();
  const current = resolveThemeId(jar.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  const active = getThemePreset(current);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Pick a color scheme that is easy on your eyes. Your choice is saved on this device."
      />

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
          <button type="submit" className="ss-btn ss-btn-primary">
            Save color scheme
          </button>
        </div>
      </form>

      <Panel className="mt-8">
        <h2 className="font-display text-[1.4rem]">Preview</h2>
        <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
          Buttons and status chips update with your theme.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="ss-btn ss-btn-primary">
            Primary
          </button>
          <button type="button" className="ss-btn ss-btn-secondary">
            Secondary
          </button>
          <Badge tone="field">Accepted</Badge>
          <Badge tone="signal">Promoted</Badge>
          <Badge tone="warn">Waitlist</Badge>
        </div>
      </Panel>
    </div>
  );
}
