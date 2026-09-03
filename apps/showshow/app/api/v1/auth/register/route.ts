import { isPostgresEnabled } from "@/lib/db/client";
import { signMobileToken } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-http";
import { rolesFromJoin } from "@/lib/mobile-roles";
import { pgRegisterUser } from "@/lib/store/pg-repo";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(req: Request) {
  if (!isPostgresEnabled()) {
    return mobileJson({ error: "Accounts are not available." }, { status: 503 });
  }

  let body: { name?: string; email?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return mobileJson({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const roles = rolesFromJoin(String(body.role || "artist"));

  if (!name || !email || password.length < 8) {
    return mobileJson(
      { error: "Name, email, and password (8+ characters) are required." },
      { status: 400 },
    );
  }

  try {
    const created = await pgRegisterUser({ name, email, password, roles });
    const user = created.user;
    const token = await signMobileToken({ id: user.id, email: user.email, roles: user.roles });
    return mobileJson({
      token,
      user: { id: user.id, name: user.name, email: user.email, roles: user.roles },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create account.";
    const status = message.includes("already exists") ? 409 : 400;
    return mobileJson({ error: message }, { status });
  }
}
