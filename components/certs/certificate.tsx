import { fmtDate } from "@/lib/format";
import { StatusDot } from "@/components/status-dot";
import { cn } from "@/lib/utils";

export interface CertificateProps {
  orgName: string;
  traineeName: string;
  procedureTitle: string;
  versionNumber: number;
  certId: string;
  issuedAt: string;
  expiresAt?: string;
  expired: boolean;
  /** Pre-rendered QR (data URL). Omit to hide the QR (e.g. in-app preview). */
  qrDataUrl?: string;
  /** Absolute /verify URL — used for the QR alt text. */
  verifyUrl?: string;
}

/**
 * A printable credential — a *document*, not a dashboard card. Warm paper, a 2px
 * ink masthead rule, Space Grotesk display name, JetBrains Mono for id/version/
 * dates, hairline frame. Pure presentational; server-renderable.
 */
export function Certificate({
  orgName,
  traineeName,
  procedureTitle,
  versionNumber,
  certId,
  issuedAt,
  expiresAt,
  expired,
  qrDataUrl,
  verifyUrl,
}: CertificateProps) {
  return (
    <div className="cert-doc mx-auto w-full max-w-2xl border border-rule2 bg-panel p-8 sm:p-12">
      {/* Masthead */}
      <div className="border-b-2 border-ink pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy">
          {orgName}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Certificate of Competency
        </h1>
      </div>

      {/* Body */}
      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          This certifies that
        </p>
        <p className="mt-1 break-words font-display text-3xl font-bold text-ink sm:text-4xl">
          {traineeName}
        </p>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          has demonstrated competency in
        </p>
        <p className="mt-1 break-words font-display text-xl font-semibold text-ink">
          {procedureTitle}
        </p>
      </div>

      {/* Meta + QR */}
      <div className="mt-10 flex items-end justify-between gap-6">
        <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4">
          <Meta label="Version" value={`v${versionNumber}`} />
          <Meta label="Status">
            <StatusDot tone={expired ? "amber" : "green"}>
              {expired ? "Expired" : "Valid"}
            </StatusDot>
          </Meta>
          <Meta label="Issued" value={fmtDate(issuedAt)} />
          <Meta
            label="Expires"
            value={expiresAt ? fmtDate(expiresAt) : "No expiry"}
          />
          <div className="col-span-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Certificate ID
            </dt>
            <dd className="mt-0.5 break-all font-mono text-[11px] text-soft">
              {certId}
            </dd>
          </div>
        </dl>

        {qrDataUrl && (
          <div className="shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={
                verifyUrl
                  ? `QR code — verify this certificate at ${verifyUrl}`
                  : "QR code to verify this certificate"
              }
              width={112}
              height={112}
              className="h-28 w-28 border border-rule2"
            />
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
              Scan to verify
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-sm font-semibold text-ink">
        {children ?? value}
      </dd>
    </div>
  );
}
