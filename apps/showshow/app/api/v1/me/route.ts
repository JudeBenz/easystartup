import { getUser } from "@/lib/store";
import { bearerToken, verifyMobileToken } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-http";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(req: Request) {
  const token = bearerToken(req);
  if (!token) return mobileJson({ error: "Sign in required." }, { status: 401 });
  const payload = await verifyMobileToken(token);
  if (!payload) return mobileJson({ error: "Session expired." }, { status: 401 });
  const user = await getUser(payload.sub);
  if (!user) return mobileJson({ error: "Account not found." }, { status: 401 });
  return mobileJson({
    user: { id: user.id, name: user.name, email: user.email, roles: user.roles },
  });
}
