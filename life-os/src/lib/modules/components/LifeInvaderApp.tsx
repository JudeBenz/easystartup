"use client";

export function LifeInvaderApp() {
  return (
    <div className="flex h-full flex-col bg-[#fdf2f2] text-sm text-gray-900">
      <header className="border-b border-red-800/20 bg-gradient-to-r from-red-700 to-red-600 px-4 py-3 text-white">
        <h2 className="text-base font-bold">LifeInvader</h2>
        <p className="text-xs text-red-200">Your Life. Your Network.</p>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">📱</div>
        <div>
          <h3 className="font-semibold text-gray-800">Coming Soon</h3>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            Notes, daily habits, streaks, and quick captures. This module shows
            how easy it is to plug in new trackers — just add a component and
            register it.
          </p>
        </div>
        <div className="rounded border border-dashed border-red-300 bg-white px-4 py-3 text-left text-xs text-gray-600">
          <p className="font-medium text-red-700">Planned features:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>Daily habit check-ins with streaks</li>
            <li>Quick notes &amp; journal entries</li>
            <li>Life stats dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
