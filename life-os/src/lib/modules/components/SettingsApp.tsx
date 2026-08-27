"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeStore } from "@/lib/store";

export function SettingsApp() {
  const exportData = useLifeStore((s) => s.exportData);
  const importData = useLifeStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    geminiConfigured: boolean;
    hint: string;
  } | null>(null);

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

  return (
    <div className="flex h-full flex-col bg-[#f5f5f5] text-sm text-gray-900">
      <header className="border-b border-gray-400/30 bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 text-white">
        <h2 className="text-base font-bold">System Settings</h2>
        <p className="text-xs text-slate-300">Sync &amp; Backup</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
            Default is Gemini Flash (~$0/mo free tier). Add{" "}
            <code className="rounded bg-gray-100 px-1">GEMINI_API_KEY</code> from{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 underline"
            >
              Google AI Studio
            </a>
            . Voice mic in LifeInvader is free via the browser.
          </p>
          {aiStatus?.hint && (
            <p className="mt-1 text-[10px] text-gray-400">{aiStatus.hint}</p>
          )}
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Sync Status
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="text-xs">Offline — local storage only</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Cloud sync via Supabase is planned for Phase 2. Your data is saved
            locally in this browser and persists across sessions.
          </p>
        </section>

        <section className="rounded border border-gray-300 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Backup &amp; Restore
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Export your data as JSON to move between devices until cloud sync
            ships.
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
            Deploy once, then Add to Home Screen. New features appear when you
            reopen the app after we deploy — no App Store wait. Full guide:{" "}
            <code className="rounded bg-gray-100 px-1">PHONE.md</code>
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-gray-600">
            <li>
              Deploy to Vercel (<code className="rounded bg-gray-100 px-1">npx vercel --prod</code>)
            </li>
            <li>Open the URL on your phone</li>
            <li>
              <strong>iPhone:</strong> Safari → Share → Add to Home Screen
            </li>
            <li>
              <strong>Android:</strong> Chrome → Install app / Add to Home screen
            </li>
          </ol>
        </section>

        {status && <p className="text-xs text-emerald-600">{status}</p>}
      </div>
    </div>
  );
}
