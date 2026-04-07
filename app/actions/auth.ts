"use server";

// Server actions for authentication flows.
// Exported separately so they can be imported in Client Components.

import { signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}