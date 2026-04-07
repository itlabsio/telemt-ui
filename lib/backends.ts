// Backend server registry.
//
// Servers are configured via numbered environment variable suffixes:
//
//   TELEMT_API_BASE_URL_1=http://server1:9091   TELEMT_API_AUTH_HEADER_1=secret1
//   TELEMT_API_BASE_URL_2=http://server2:9091   TELEMT_API_AUTH_HEADER_2=secret2
//
// For a single-server setup the legacy unprefixed form is also accepted:
//   TELEMT_API_BASE_URL=http://127.0.0.1:9091   TELEMT_API_AUTH_HEADER=secret
//
// Optional human-readable label:
//   TELEMT_API_LABEL_1=Production
//
// Servers are indexed 0-based in the order their suffix numbers appear
// (sorted ascending). The primary server (index 0) is used for the
// readiness probe.

export interface BackendConfig {
  /** 0-based runtime index used in proxy URLs. */
  index: number;
  /** Human-readable label shown in the server selector. */
  label: string;
  /** Backend base URL without trailing slash. */
  baseUrl: string;
  /** Value for the Authorization header, empty string means no header. */
  authHeader: string;
}

function parseBackends(): BackendConfig[] {
  const configs: BackendConfig[] = [];

  // Collect all numeric suffixes present in the environment.
  const suffixes = new Set<number>();
  for (const key of Object.keys(process.env)) {
    const m = key.match(/^TELEMT_API_BASE_URL_(\d+)$/);
    if (m) suffixes.add(Number(m[1]));
  }

  if (suffixes.size > 0) {
    // Numbered form: TELEMT_API_BASE_URL_1, TELEMT_API_BASE_URL_2, …
    const sorted = [...suffixes].sort((a, b) => a - b);
    for (const suffix of sorted) {
      const baseUrl = process.env[`TELEMT_API_BASE_URL_${suffix}`]?.trim();
      if (!baseUrl) continue;
      configs.push({
        index: configs.length,
        label:
          process.env[`TELEMT_API_LABEL_${suffix}`]?.trim() ||
          `Server ${suffix}`,
        baseUrl: baseUrl.replace(/\/$/, ""),
        authHeader: process.env[`TELEMT_API_AUTH_HEADER_${suffix}`]?.trim() ?? "",
      });
    }
  }

  // Fallback: legacy unprefixed variables (single-server setup).
  if (configs.length === 0) {
    const baseUrl = process.env.TELEMT_API_BASE_URL?.trim();
    configs.push({
      index: 0,
      label: process.env.TELEMT_API_LABEL?.trim() || "Server",
      baseUrl: (baseUrl ?? "http://127.0.0.1:9091").replace(/\/$/, ""),
      authHeader: process.env.TELEMT_API_AUTH_HEADER?.trim() ?? "",
    });
  }

  return configs;
}

// Module-level singleton — evaluated once per process.
export const BACKENDS: BackendConfig[] = parseBackends();

/** Returns the backend at `index`, or undefined when out of range. */
export function getBackend(index: number): BackendConfig | undefined {
  return BACKENDS[index];
}

/** Returns the primary backend (index 0), always defined. */
export function primaryBackend(): BackendConfig {
  return BACKENDS[0];
}

/** Safe client-facing representation — strips the auth header. */
export interface BackendInfo {
  index: number;
  label: string;
}

export function backendInfoList(): BackendInfo[] {
  return BACKENDS.map(({ index, label }) => ({ index, label }));
}