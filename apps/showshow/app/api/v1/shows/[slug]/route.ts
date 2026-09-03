import { getShowBySlug } from "@/lib/store";
import { showDetail } from "@/lib/mobile-dto";
import { mobileJson, mobileOptions } from "@/lib/mobile-http";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getShowBySlug(slug);
  if (!data) return mobileJson({ error: "Show not found" }, { status: 404 });
  return mobileJson({ show: showDetail(data) });
}
