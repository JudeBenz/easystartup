"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/sync/supabase-client";
import { signInWithMagicLink, signOut } from "@/lib/sync/SyncProvider";
import { pullAndMerge, pushAll } from "@/lib/sync/engine";
import { getSupabase } from "@/lib/sync/supabase-client";
import { PHONE_THEMES } from "@/lib/store/phone-prefs";
import type { PhoneThemeId } from "@/types/domain";
import { haptic } from "@/lib/phone/haptics";

export function SettingsApp() {
  const exportData = useLifeStore((s) => s.exportData);
  const importData = useLifeStore((s) => s.importData);
  const syncStatus = useLifeStore((s) => s.syncStatus);
  const syncError = useLifeStore((s) => s.syncError);
  const lastSyncedAt = useLifeStore((s) => s.lastSyncedAt);
  const syncUserEmail = useLifeStore((s) => s.syncUserEmail);
  const phonePrefs = useLifeStore((s) => s.phonePrefs);
  const setPhoneTheme = useLifeStore((s) => s.setPhoneTheme);
  const setNotificationsEnabled = useLifeStore((s) => s.setNotificationsEnabled);

  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    geminiConfigured: boolean;
    hint: string;
  } | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) =>
        setAiStatus({
          provider: d.provider,
          geminiConfigured: d.geminiConfigured,
          hint: d.hint,
        }),
      )
      .catch(() => null);
  }, []);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importData(reader.result as string);
      setStatus("Data imported successfully.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const msg = await signInWithMagicLink(email);
      setAuthMsg(msg);
    } catch (err) {
      setAuthMsg(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    try {
      await signOut();
      setAuthMsg("Signed out. Data stays on this device.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleForceSync() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const supabase = getSupabase();
      const { data } = await supabase!.auth.getUser();
      if (!data.user) throw new Error("Not signed in");
      await pullAndMerge(data.user.id);
      await pushAll(data.user.id);
      setAuthMsg("Force sync complete.");
    } catch (err) {
      setAuthMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setAuthBusy(false);
    }
  }

  const statusColor =
    syncStatus === "synced"
      ? "bg-emerald-500"
      : syncStatus === "connecting"
        ? "bg-sky-400"
        : syncStatus === "error"
          ? "bg-red-500"
          : "bg-yellow-400";

  return (
    <div className="flex h-full flex-col bg-[#f5f5f5] text-sm text-gray-900">
      <header className="border-b border-gray-400/30 bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 text-white">
        <h2 className="text-base font-bold">System Settings</h2>
        <p className="text-xs text-slate-300">Sync · Backup · AI</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Phone wallpaper
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(PHONE_THEMES) as PhoneThemeId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPhoneTheme(id);
                  haptic("light");
                }}
                className={`overflow-hidden rounded-xl border-2 text-left ${
                  phonePrefs.themeId === id
                    ? "border-sky-500"
                    : "border-transparent"
                }`}
              >
                <div
                  className="h-14 w-full"
                  style={{ background: PHONE_THEMES[id].background }}
                />
                <p className="bg-gray-50 px-2 py-1 text-[10px] font-medium">
                  {PHONE_THEMES[id].name}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Reminders
          </h3>
          <label className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span>
              Notify for upcoming events &amp; morning errands
            </span>
            <input
              type="checkbox"
              checked={phonePrefs.notificationsEnabled}
              onChange={async (e) => {
                const on = e.target.checked;
                if (on && "Notification" in window) {
                  const perm = await Notification.requestPermission();
                  if (perm !== "granted") {
                    setStatus("Notification permission denied.");
                    return;
                  }
                }
                setNotificationsEnabled(on);
                haptic("success");
              }}
              className="h-4 w-4"
            />
          </label>
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Cloud Sync (phone ↔ computer)
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`} />
            <span className="text-xs capitalize">{syncStatus}</span>
            {lastSyncedAt && (
              <span className="text-[10px] text-gray-400">
                · {new Date(lastSyncedAt).toLocaleString()}
              </span>
            )}
          </div>
          {syncError && (
            <p className="mt-1 text-[10px] text-red-600">{syncError}</p>
          )}

          {!configured ? (
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <p>
                Add free Supabase keys to enable realtime sync (under $10/mo —
                free tier is enough):
              </p>
              <code className="block rounded bg-gray-100 p-2 text-[10px]">
                NEXT_PUBLIC_SUPABASE_URL=…
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=…
              </code>
              <p>
                Then run <code className="rounded bg-gray-100 px-1">supabase/schema.sql</code>{" "}
                in the SQL editor. See <strong>SYNC.md</strong>.
              </p>
            </div>
          ) : syncUserEmail ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-600">
                Signed in as <strong>{syncUserEmail}</strong>
              </p>
              <p className="text-[11px] text-gray-500">
                Changes on phone and computer sync live. Sign in with the same
                email on every device.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleForceSync}
                  className="rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Sync now
                </button>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleSignOut}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="mt-3 space-y-2">
              <p className="text-[11px] text-gray-500">
                Sign in with a magic link — same email on phone + computer =
                shared data.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={authBusy}
                  className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Send link
                </button>
              </div>
            </form>
          )}
          {authMsg && (
            <p className="mt-2 text-[11px] text-emerald-700">{authMsg}</p>
          )}
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            AI Assistant
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                aiStatus?.geminiConfigured ? "bg-emerald-500" : "bg-yellow-400"
              }`}
            />
            <span className="text-xs">
              {aiStatus ? `Provider: ${aiStatus.provider}` : "Checking…"}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Default is Gemini Flash (~$0/mo). Set{" "}
            <code className="rounded bg-gray-100 px-1">GEMINI_API_KEY</code>.
          </p>
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Backup &amp; Restore
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Manual JSON backup (also useful before enabling sync).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Export Backup
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
            >
              Import Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Install on Phone
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Deploy → Add to Home Screen. Sign in with the same email for sync.
            Guide: <code className="rounded bg-gray-100 px-1">PHONE.md</code>
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-gray-600">
            <li>Deploy to Vercel</li>
            <li>Open URL on phone → Add to Home Screen</li>
            <li>Open System → send magic link with your email</li>
          </ol>
        </section>

        {status && <p className="text-xs text-emerald-600">{status}</p>}
      </div>
    </div>
  );
}
