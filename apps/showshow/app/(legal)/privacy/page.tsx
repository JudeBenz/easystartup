import { PageHeader, Panel } from "@/components/ui";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Privacy policy"
        description="How ShowShow handles your data — last updated August 2026."
      />
      <Panel className="prose-ss space-y-4 text-[1.05rem] leading-relaxed">
        <p>
          ShowShow stores account email, application tracker notes, and ROI logs you enter.
          Payment card data is handled by Stripe; we never store card numbers.
        </p>
        <p>
          Opted-in ROI aggregates are anonymized before appearing in public rankings. We do not
          sell personal data. Official show facts come from public organizer websites.
        </p>
        <p>
          Contact your account email on file for data export or deletion requests.
        </p>
      </Panel>
    </div>
  );
}
