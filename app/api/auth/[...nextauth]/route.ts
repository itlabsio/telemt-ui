// Auth.js route handler — exposes OIDC callback, sign-in, and sign-out
// endpoints under /api/auth/*.

import { handlers } from "@/auth";

export const { GET, POST } = handlers;