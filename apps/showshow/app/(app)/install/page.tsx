import { PageHeader } from "@/components/ui";

export const metadata = { title: "Add to your phone" };

export default function InstallPage() {
  return (
    <div>
      <PageHeader
        title="Put ShowShow on your phone"
        description="This is a website you can save to your Home Screen. It works in Safari and Chrome without the App Store."
      />
      <ol className="ss-prose space-y-6 text-[1.125rem]">
        <li>
          <p className="font-display text-[1.5rem] leading-tight">iPhone</p>
          <p className="mt-2 text-[var(--muted)]">
            Open this site in Safari — not in Instagram or a QR preview. Tap the Share button, then{" "}
            <strong className="text-[var(--ink)]">Add to Home Screen</strong>. ShowShow appears with
            your other apps.
          </p>
        </li>
        <li>
          <p className="font-display text-[1.5rem] leading-tight">Android</p>
          <p className="mt-2 text-[var(--muted)]">
            Open in Chrome. Tap the menu, then <strong className="text-[var(--ink)]">Install app</strong> or{" "}
            <strong className="text-[var(--ink)]">Add to Home screen</strong>.
          </p>
        </li>
      </ol>
      <p className="ss-prose mt-10 text-[1.05rem] text-[var(--muted)]">
        A listing in Apple’s App Store is a separate Apple review process. It is not how you get
        ShowShow on a phone this week. Use Add to Home Screen above.
      </p>
    </div>
  );
}
