import type { NextConfig } from "next";

// Static security headers applied to every response.
// Content-Security-Policy is set separately in proxy.ts, since it needs a
// fresh per-request nonce and can't be a static value.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Standalone output bundles only the required server files,
  // enabling a minimal Docker image without the full node_modules tree.
  output: "standalone",

  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
