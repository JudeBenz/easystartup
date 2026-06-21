import { NextResponse } from "next/server";
import {
  getCertifications,
  getUsers,
  getProcedures,
  demoToday,
} from "@/lib/store";

export function GET(): NextResponse {
  const certs = getCertifications();
  const users = getUsers();
  const procedures = getProcedures();
  const today = demoToday();

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const procMap = new Map(procedures.map((p) => [p.id, p.title]));

  const rows: string[] = [
    "Person,Email,Procedure,Version,Issued,Expires,Status",
  ];

  for (const cert of certs) {
    const user = users.find((u) => u.id === cert.userId);
    const isExpired = cert.expiresAt
      ? cert.expiresAt.slice(0, 10) <= today
      : false;

    rows.push(
      [
        `"${userMap.get(cert.userId) ?? cert.userId}"`,
        `"${user?.email ?? ""}"`,
        `"${procMap.get(cert.procedureId) ?? cert.procedureId}"`,
        `v${cert.versionNumber}`,
        cert.issuedAt.slice(0, 10),
        cert.expiresAt ? cert.expiresAt.slice(0, 10) : "",
        isExpired ? "Expired" : "Valid",
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="certifications-${today}.csv"`,
    },
  });
}
