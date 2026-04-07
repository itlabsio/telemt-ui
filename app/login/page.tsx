import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { error, callbackUrl } = await searchParams;

  const errorMessage =
    error === "AccessDenied"
      ? "Access denied. Your account is not authorised to sign in."
      : error === "Configuration"
        ? "Authentication is misconfigured. Contact your administrator."
        : error
          ? "Authentication error. Please try again."
          : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logotype */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/25">
            <Shield className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Telemt Control Panel
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
              Sign in to manage your MTProxy instance
            </p>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign-in action — server action triggers OIDC redirect */}
        <form
          action={async () => {
            "use server";
            await signIn("oidc", { redirectTo: callbackUrl ?? "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] shadow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <Shield className="h-4 w-4" />
            Sign in with SSO
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          Authenticated via your organisation&apos;s identity provider.
          No credentials are stored by this application.
        </p>
      </div>
    </div>
  );
}