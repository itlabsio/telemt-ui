// Server-side Telemt API client.
// Runs exclusively inside Next.js Server Components and Route Handlers.
// The Authorization header is never sent to the browser.

import type {
  SuccessEnvelope,
  ApiResponse,
  HealthData,
  SystemInfoData,
  RuntimeGatesData,
  RuntimeInitializationData,
  EffectiveLimitsData,
  SecurityPostureData,
  SecurityWhitelistData,
  SummaryData,
  ZeroAllData,
  UpstreamsData,
  MinimalAllData,
  MeWritersData,
  DcStatusData,
  RuntimeMePoolStateData,
  RuntimeMeQualityData,
  RuntimeUpstreamQualityData,
  RuntimeNatStunData,
  RuntimeMeSelftestData,
  RuntimeEdgeConnectionsSummaryData,
  RuntimeEdgeEventsData,
  UserInfo,
  CreateUserRequest,
  CreateUserResponse,
  PatchUserRequest,
} from "@/types/api";

import { primaryBackend, getBackend } from "@/lib/backends";

const DEFAULT_TIMEOUT_MS = 10_000;

export class TelemetApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly requestId?: number
  ) {
    super(message);
    this.name = "TelemetApiError";
  }
}

async function parseResponse<T>(res: Response): Promise<SuccessEnvelope<T>> {
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new TelemetApiError(
      "parse_error",
      `Failed to parse response (HTTP ${res.status})`,
      res.status
    );
  }
  if (!body.ok) {
    throw new TelemetApiError(
      body.error.code,
      body.error.message,
      res.status,
      body.request_id
    );
  }
  return body;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── API factory ───────────────────────────────────────────────────────────────
// Creates a server-side API client bound to a specific base URL and auth header.

function makeApi(baseUrl: string, authHeader: string) {
  function buildHeaders(revision?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;
    if (revision) headers["If-Match"] = revision;
    return headers;
  }

  async function get<T>(path: string): Promise<SuccessEnvelope<T>> {
    const res = await fetchWithTimeout(`${baseUrl}${path}`, {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store",
    });
    return parseResponse<T>(res);
  }

  async function mutate<TReq, TRes>(
    method: "POST" | "PATCH" | "DELETE",
    path: string,
    body?: TReq,
    revision?: string
  ): Promise<SuccessEnvelope<TRes>> {
    const res = await fetchWithTimeout(`${baseUrl}${path}`, {
      method,
      headers: buildHeaders(revision),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return parseResponse<TRes>(res);
  }

  return {
    health: () => get<HealthData>("/v1/health"),
    systemInfo: () => get<SystemInfoData>("/v1/system/info"),
    runtimeGates: () => get<RuntimeGatesData>("/v1/runtime/gates"),
    runtimeInitialization: () =>
      get<RuntimeInitializationData>("/v1/runtime/initialization"),
    effectiveLimits: () => get<EffectiveLimitsData>("/v1/limits/effective"),
    securityPosture: () => get<SecurityPostureData>("/v1/security/posture"),
    securityWhitelist: () => get<SecurityWhitelistData>("/v1/security/whitelist"),
    statsSummary: () => get<SummaryData>("/v1/stats/summary"),
    statsZeroAll: () => get<ZeroAllData>("/v1/stats/zero/all"),
    statsUpstreams: () => get<UpstreamsData>("/v1/stats/upstreams"),
    statsMinimalAll: () => get<MinimalAllData>("/v1/stats/minimal/all"),
    statsMeWriters: () => get<MeWritersData>("/v1/stats/me-writers"),
    statsDcs: () => get<DcStatusData>("/v1/stats/dcs"),
    runtimeMePoolState: () =>
      get<RuntimeMePoolStateData>("/v1/runtime/me_pool_state"),
    runtimeMeQuality: () =>
      get<RuntimeMeQualityData>("/v1/runtime/me_quality"),
    runtimeUpstreamQuality: () =>
      get<RuntimeUpstreamQualityData>("/v1/runtime/upstream_quality"),
    runtimeNatStun: () => get<RuntimeNatStunData>("/v1/runtime/nat_stun"),
    runtimeMeSelftest: () =>
      get<RuntimeMeSelftestData>("/v1/runtime/me-selftest"),
    runtimeEdgeConnectionsSummary: () =>
      get<RuntimeEdgeConnectionsSummaryData>("/v1/runtime/connections/summary"),
    runtimeEdgeEvents: (limit?: number) =>
      get<RuntimeEdgeEventsData>(
        `/v1/runtime/events/recent${limit !== undefined ? `?limit=${limit}` : ""}`
      ),
    listUsers: () => get<UserInfo[]>("/v1/users"),
    getUser: (username: string) =>
      get<UserInfo>(`/v1/users/${encodeURIComponent(username)}`),
    createUser: (req: CreateUserRequest, revision?: string) =>
      mutate<CreateUserRequest, CreateUserResponse>("POST", "/v1/users", req, revision),
    patchUser: (username: string, req: PatchUserRequest, revision?: string) =>
      mutate<PatchUserRequest, UserInfo>(
        "PATCH",
        `/v1/users/${encodeURIComponent(username)}`,
        req,
        revision
      ),
    deleteUser: (username: string, revision?: string) =>
      mutate<undefined, string>(
        "DELETE",
        `/v1/users/${encodeURIComponent(username)}`,
        undefined,
        revision
      ),
  };
}

/**
 * Creates a server-side API client for a specific backend index.
 * Falls back to the primary backend when the index is out of range.
 */
export function createServerApi(serverIndex: number) {
  const backend = getBackend(serverIndex) ?? primaryBackend();
  return makeApi(backend.baseUrl, backend.authHeader);
}

/** Default server-side API client bound to the primary backend (index 0). */
export const serverApi = makeApi(
  primaryBackend().baseUrl,
  primaryBackend().authHeader
);