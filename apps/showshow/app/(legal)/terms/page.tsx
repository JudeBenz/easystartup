import { PageHeader, Panel } from "@/components/ui";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Terms of service"
        description="Using ShowShow — last updated August 2026."
      />
      <Panel className="space-y-4 text-[1.05rem] leading-relaxed">
        <p>
          ShowShow is a marketplace platform connecting artists, showgoers, and fair directors.
          Artists selling through Connect are independent sellers responsible for fulfillment and
          taxes.
        </p>
        <p>
          ROI and ranking data are self-reported and not audited financial advice. Directors must
          only claim shows they represent.
        </p>
        <p>Refunds follow Stripe and each seller&apos;s stated policy.</p>
      </Panel>
    </div>
  );
}
