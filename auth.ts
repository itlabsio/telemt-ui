// Auth.js v5 configuration with a generic OIDC provider.
// Provider discovery uses the issuer well-known endpoint automatically.
// All sensitive values are read from server-only environment variables.

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Optional e-mail domain allowlist parsed from OIDC_ALLOWED_EMAIL_DOMAINS.
const ALLOWED_DOMAINS = (process.env.OIDC_ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

// Optional group allowlist parsed from OIDC_ALLOW_GROUPS.
// When non-empty, the user's "groups" claim must contain at least one entry.
const ALLOWED_GROUPS = (process.env.OIDC_ALLOW_GROUPS ?? "")
  .split(",")
  .map((g) => g.trim())
  .filter(Boolean);

function isEmailAllowed(email?: string | null): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true;
  if (!email) return false;
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain ?? "");
}

function isGroupAllowed(groups: unknown): boolean {
  if (ALLOWED_GROUPS.length === 0) return true;
  if (!Array.isArray(groups)) return false;
  return (groups as string[]).some((g) => ALLOWED_GROUPS.includes(g));
}

const config: NextAuthConfig = {
  providers: [
    {
      id: "oidc",
      name: "SSO",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: {
        params: {
          scope: process.env.OIDC_SCOPE ?? "openid profile email",
        },
      },
      // Request groups claim if the provider supports it.
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? null,
          image: profile.picture ?? null,
        };
      },
    },
  ],

  // JWT sessions are stateless and compatible with serverless deployments.
  session: { strategy: "jwt" },

  callbacks: {
    signIn({ profile }) {
      if (!isEmailAllowed(profile?.email as string | undefined)) return false;
      if (!isGroupAllowed((profile as Record<string, unknown>)?.groups)) return false;
      return true;
    },

    jwt({ token, profile }) {
      if (profile) {
        token.name = (profile.name as string | undefined) ?? token.name;
        token.email = (profile.email as string | undefined) ?? token.email;
        token.picture = (profile.picture as string | undefined) ?? token.picture;
        token.sub = (profile.sub as string | undefined) ?? token.sub;
        // Persist groups claim so it is available in session callback.
        token.groups = (profile as Record<string, unknown>).groups ?? token.groups;
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