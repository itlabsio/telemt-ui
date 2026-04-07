// Auth.js v5 configuration with a generic OIDC provider.
// Provider discovery uses the issuer well-known endpoint automatically.
// All sensitive values are read from server-only environment variables.

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Optional e-mail domain allowlist parsed from AUTH_ALLOWED_EMAIL_DOMAINS.
const ALLOWED_DOMAINS = (process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

function isEmailAllowed(email?: string | null): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true;
  if (!email) return false;
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain ?? "");
}

const config: NextAuthConfig = {
  providers: [
    {
      id: "oidc",
      name: "SSO",
      type: "oidc",
      issuer: process.env.AUTH_ISSUER,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: process.env.AUTH_SCOPE ?? "openid profile email",
        },
      },
    },
  ],

  // JWT sessions are stateless and compatible with serverless deployments.
  session: { strategy: "jwt" },

  callbacks: {
    signIn({ profile }) {
      return isEmailAllowed(profile?.email as string | undefined);
    },

    jwt({ token, profile }) {
      if (profile) {
        token.name = (profile.name as string | undefined) ?? token.name;
        token.email = (profile.email as string | undefined) ?? token.email;
        token.picture = (profile.picture as string | undefined) ?? token.picture;
        token.sub = (profile.sub as string | undefined) ?? token.sub;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        // Propagate JWT claims into the session user object.
        // Cast through unknown to satisfy the Auth.js v5 strict session.user type
        // which marks email as non-nullable in the session callback context.
        const u = session.user as unknown as Record<string, unknown>;
        u.name = token.name ?? null;
        u.email = token.email ?? null;
        u.image = (token.picture as string | undefined) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);