import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/types/domain";

const ISSUER = "showshow-native";
const DAYS = 30;

function secretKey() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type MobileTokenPayload = {
  sub: string;
  email: string;
  roles: UserRole[];
};

export async function signMobileToken(user: { id: string; email: string; roles: UserRole[] }) {
  return new SignJWT({ email: user.email, roles: user.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(secretKey());
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const roles = Array.isArray(payload.roles) ? (payload.roles as UserRole[]) : [];
    if (!sub || !email) return null;
    return { sub, email, roles };
  } catch {
    return null;
  }
}

export function bearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}
