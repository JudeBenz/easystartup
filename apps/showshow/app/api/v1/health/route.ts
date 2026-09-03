import { mobileJson, mobileOptions } from "@/lib/mobile-http";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET() {
  return mobileJson({ ok: true });
}
