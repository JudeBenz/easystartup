import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <PageHeader title="Page not found" description="That URL is not on ShowShow." />
      <Panel>
        <Link href="/" className="ss-btn ss-btn-primary">
          Back home
        </Link>
      </Panel>
    </div>
  );
}
