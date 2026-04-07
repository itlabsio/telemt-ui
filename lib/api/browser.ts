// Browser-side Telemt API client.
// All requests are sent to the /api/telemt/<serverIndex>/v1/... proxy route
// handler which injects the backend Authorization header server-side.

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

// Returns the proxy base URL for a given backend index.
function proxyBase(serverIndex: number): string {
  return `/api/telemt/${serverIndex}`;
}

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

async function get<T>(serverIndex: number, path: string): Promise<SuccessEnvelope<T>> {
  const res = await fetch(`${proxyBase(serverIndex)}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

async function mutate<TReq, TRes>(
  serverIndex: number,
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

  const res = await fetch(`${proxyBase(serverIndex)}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return parseResponse<TRes>(res);
}

// Creates a scoped API client bound to a specific backend server index.
// All method signatures remain identical to the previous single-server API.
export function createBrowserApi(serverIndex: number) {
  const g = <T>(path: string) => get<T>(serverIndex, path);
  const m = <TReq, TRes>(
    method: "POST" | "PATCH" | "DELETE",
    path: string,
    body?: TReq,
    ifMatch?: string
  ) => mutate<TReq, TRes>(serverIndex, method, path, body, ifMatch);

  return {
    health: () => g<HealthData>("/v1/health"),
    systemInfo: () => g<SystemInfoData>("/v1/system/info"),
    runtimeGates: () => g<RuntimeGatesData>("/v1/runtime/gates"),
    runtimeInitialization: () => g<RuntimeInitializationData>("/v1/runtime/initialization"),
    statsSummary: () => g<SummaryData>("/v1/stats/summary"),
    statsZeroAll: () => g<ZeroAllData>("/v1/stats/zero/all"),
    statsUpstreams: () => g<UpstreamsData>("/v1/stats/upstreams"),
    statsMinimalAll: () => g<MinimalAllData>("/v1/stats/minimal/all"),
    statsMeWriters: () => g<MeWritersData>("/v1/stats/me-writers"),
    statsDcs: () => g<DcStatusData>("/v1/stats/dcs"),
    runtimeMePoolState: () => g<RuntimeMePoolStateData>("/v1/runtime/me_pool_state"),
    runtimeMeQuality: () => g<RuntimeMeQualityData>("/v1/runtime/me_quality"),
    runtimeUpstreamQuality: () => g<RuntimeUpstreamQualityData>("/v1/runtime/upstream_quality"),
    runtimeNatStun: () => g<RuntimeNatStunData>("/v1/runtime/nat_stun"),
    runtimeMeSelftest: () => g<RuntimeMeSelftestData>("/v1/runtime/me-selftest"),
    runtimeEdgeConnectionsSummary: () =>
      g<RuntimeEdgeConnectionsSummaryData>("/v1/runtime/connections/summary"),
    runtimeEdgeEvents: (limit?: number) =>
      g<RuntimeEdgeEventsData>(
        `/v1/runtime/events/recent${limit !== undefined ? `?limit=${limit}` : ""}`
      ),
    securityPosture: () => g<SecurityPostureData>("/v1/security/posture"),
    securityWhitelist: () => g<SecurityWhitelistData>("/v1/security/whitelist"),
    listUsers: () => g<UserInfo[]>("/v1/users"),
    getUser: (username: string) => g<UserInfo>(`/v1/users/${encodeURIComponent(username)}`),
    createUser: (req: CreateUserRequest, ifMatch?: string) =>
      m<CreateUserRequest, CreateUserResponse>("POST", "/v1/users", req, ifMatch),
    patchUser: (username: string, req: PatchUserRequest, ifMatch?: string) =>
      m<PatchUserRequest, UserInfo>(
        "PATCH",
        `/v1/users/${encodeURIComponent(username)}`,
        req,
        ifMatch
      ),
    deleteUser: (username: string, ifMatch?: string) =>
      m<undefined, string>(
        "DELETE",
        `/v1/users/${encodeURIComponent(username)}`,
        undefined,
        ifMatch
      ),
  };
}

// Default single-server client for backward compatibility (index 0).
export const browserApi = createBrowserApi(0);