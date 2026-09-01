import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getPostgres, isPostgresEnabled } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getUser, listUsers } from "@/lib/store";
import type { UserRole } from "@/types/domain";

/**
 * Auth.js (next-auth v5) — production sessions when AUTH_SECRET is set.
 * Demo personas remain available only when SHOWSHOW_DEMO_PERSONAS=1.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        if (isPostgresEnabled()) {
          const db = getPostgres()!;
          const row = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
          if (!row?.passwordHash) return null;
          const ok = await compare(password, row.passwordHash);
          if (!ok) return null;
          return {
            id: row.id,
            email: row.email,
            name: row.name,
            image: row.image ?? undefined,
          };
        }

        // Demo fallback: password "showshow" for seeded emails
        const all = await listUsers();
        const user = all.find((u) => u.email.toLowerCase() === email);
        if (!user || password !== "showshow") return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    Credentials({
      id: "demo-persona",
      name: "Demo persona",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (process.env.SHOWSHOW_DEMO_PERSONAS !== "1") {
          return null;
        }
        const userId = String(credentials?.userId || "");
        const user = await getUser(userId);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & { roles?: UserRole[] };
      if (user?.id) {
        t.sub = user.id;
        const profile = await resolveRoles(user.id);
        t.roles = profile.roles;
      } else if (t.sub && !t.roles) {
        const profile = await resolveRoles(t.sub);
        t.roles = profile.roles;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & { roles?: UserRole[] };
      if (session.user && t.sub) {
        session.user.id = t.sub;
        session.user.roles = t.roles ?? [];
      }
      return session;
    },
  },
});

async function resolveRoles(userId: string): Promise<{ roles: UserRole[] }> {
  if (isPostgresEnabled()) {
    const db = getPostgres()!;
    const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
    return { roles: (row?.roles as UserRole[]) ?? [] };
  }
  const user = await getUser(userId);
  return { roles: user?.roles ?? [] };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: UserRole[];
    };
  }

  interface User {
    roles?: UserRole[];
  }
}
