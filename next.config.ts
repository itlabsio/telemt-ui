import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only the required server files,
  // enabling a minimal Docker image without the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
