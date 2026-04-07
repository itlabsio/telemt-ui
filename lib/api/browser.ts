// Browser-side Telemt API client.
// All requests are sent to the /api/telemt proxy route handler which injects
// the backend Authorization header server-side.

import type {
  ApiResponse,
  SuccessEnvelope,
  HealthData,
  SystemInfoData,
  RuntimeGatesData,
  RuntimeInitializationData,
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
  SecurityPostureData,
  SecurityWhitelistData,
  UserInfo,
  CreateUserRequest,
  CreateUserResponse,
  PatchUserRequest,
} from "@/types/api";

// Proxy base — requests go to the Next.js route handler, not directly to backend.
const PROXY = "/api/telemt";

export class BrowserApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "BrowserApiError";
  }
}

async function parseResponse<T>(res: Response): Promise<SuccessEnvelope<T>> {
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new BrowserApiError("parse_error", `Failed to parse response (HTTP ${res.status})`, res.status);
  }
  if (!body.ok) {
    throw new BrowserApiError(body.error.code, body.error.message, res.status);
  }
  return body;
}

async function get<T>(path: string): Promise<SuccessEnvelope<T>> {
  const res = await fetch(`${PROXY}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

async function mutate<TReq, TRes>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: TReq,
  ifMatch?: string
): Promise<SuccessEnvelope<TRes>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
  };
  if (ifMatch) headers["If-Match"] = ifMatch;

  const res = await fetch(`${PROXY}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return parseResponse<TRes>(res);
}

// SWR fetcher — returns unwrapped data for a given proxy path.
export async function swrFetcher<T>(path: string): Promise<T> {
  const envelope = await get<T>(path);
  return envelope.data;
}

export const browserApi = {
  health: () => get<HealthData>("/v1/health"),
  systemInfo: () => get<SystemInfoData>("/v1/system/info"),
  runtimeGates: () => get<RuntimeGatesData>("/v1/runtime/gates"),
  runtimeInitialization: () => get<RuntimeInitializationData>("/v1/runtime/initialization"),
  statsSummary: () => get<SummaryData>("/v1/stats/summary"),
  statsZeroAll: () => get<ZeroAllData>("/v1/stats/zero/all"),
  statsUpstreams: () => get<UpstreamsData>("/v1/stats/upstreams"),
  statsMinimalAll: () => get<MinimalAllData>("/v1/stats/minimal/all"),
  statsMeWriters: () => get<MeWritersData>("/v1/stats/me-writers"),
  statsDcs: () => get<DcStatusData>("/v1/stats/dcs"),
  runtimeMePoolState: () => get<RuntimeMePoolStateData>("/v1/runtime/me_pool_state"),
  runtimeMeQuality: () => get<RuntimeMeQualityData>("/v1/runtime/me_quality"),
  runtimeUpstreamQuality: () => get<RuntimeUpstreamQualityData>("/v1/runtime/upstream_quality"),
  runtimeNatStun: () => get<RuntimeNatStunData>("/v1/runtime/nat_stun"),
  runtimeMeSelftest: () => get<RuntimeMeSelftestData>("/v1/runtime/me-selftest"),
  runtimeEdgeConnectionsSummary: () =>
    get<RuntimeEdgeConnectionsSummaryData>("/v1/runtime/connections/summary"),
  runtimeEdgeEvents: (limit?: number) =>
    get<RuntimeEdgeEventsData>(
      `/v1/runtime/events/recent${limit !== undefined ? `?limit=${limit}` : ""}`
    ),
  securityPosture: () => get<SecurityPostureData>("/v1/security/posture"),
  securityWhitelist: () => get<SecurityWhitelistData>("/v1/security/whitelist"),
  listUsers: () => get<UserInfo[]>("/v1/users"),
  getUser: (username: string) => get<UserInfo>(`/v1/users/${encodeURIComponent(username)}`),
  createUser: (req: CreateUserRequest, ifMatch?: string) =>
    mutate<CreateUserRequest, CreateUserResponse>("POST", "/v1/users", req, ifMatch),
  patchUser: (username: string, req: PatchUserRequest, ifMatch?: string) =>
    mutate<PatchUserRequest, UserInfo>(
      "PATCH",
      `/v1/users/${encodeURIComponent(username)}`,
      req,
      ifMatch
    ),
  deleteUser: (username: string, ifMatch?: string) =>
    mutate<undefined, string>(
      "DELETE",
      `/v1/users/${encodeURIComponent(username)}`,
      undefined,
      ifMatch
    ),
};