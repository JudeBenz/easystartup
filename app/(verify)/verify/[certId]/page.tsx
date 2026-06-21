import "./print.css";
import { headers } from "next/headers";
import {
  getCertificationById,
  getOrg,
  getProcedure,
  getUser,
} from "@/lib/store";
import { qrDataUrl } from "@/lib/qr";
import { Certificate } from "@/components/certs/certificate";
import { PrintButton } from "@/components/certs/print-button";
import { cn } from "@/lib/utils";

/** Absolute origin for the QR's verify URL (env override, else request host). */
async function getOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const cert = getCertificationById(certId);

  if (!cert) {
    return (
      <div className="cert-page flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
          Certificate not found
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          We couldn&apos;t verify this certificate.
        </h1>
        <p className="mt-2 max-w-md text-sm text-soft">
          The certificate ID doesn&apos;t match any record on file. It may have
          been mistyped or revoked.
        </p>
      </div>
    );
  }

  const user = getUser(cert.userId);
  const proc = getProcedure(cert.procedureId);
  const org = getOrg();
  const expired = cert.expiresAt
    ? new Date(cert.expiresAt).getTime() < Date.now()
    : false;

  const origin = await getOrigin();
  const verifyUrl = `${origin}/verify/${certId}`;
  const qr = await qrDataUrl(verifyUrl);

  return (
    <div className="cert-page min-h-screen bg-paper px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Verify banner + print (hidden in print output) */}
        <div className="no-print mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border border-rule2 bg-panel px-3 py-2">
            <span
              aria-hidden
              className={cn(
                "inline-block h-[9px] w-[9px]",
                expired ? "bg-amber" : "bg-green"
              )}
            />
            <span
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.12em]",
                expired ? "text-amber" : "text-green"
              )}
            >
              {expired ? "Expired" : "Verified"}
            </span>
          </div>
          <PrintButton />
        </div>

        <Certificate
          orgName={org.name}
          traineeName={user?.name ?? "Unknown trainee"}
          procedureTitle={proc?.title ?? "Procedure"}
          versionNumber={cert.versionNumber}
          certId={cert.id}
          issuedAt={cert.issuedAt}
          expiresAt={cert.expiresAt}
          expired={expired}
          qrDataUrl={qr || undefined}
          verifyUrl={verifyUrl}
        />

        <p className="no-print mt-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          EasyStartUp — verified credential
        </p>
      </div>
    </div>
  );
}
