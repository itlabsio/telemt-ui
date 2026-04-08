"use client";

import useSWR from "swr";
import { useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/dashboard/status-indicator";
import { createBrowserApi } from "@/lib/api/browser";
import { useServerIndex } from "@/lib/use-server-index";
import { formatEpoch } from "@/lib/fmt";

const POLL = 15_000;

function useSWRData<T>(key: string, fetcher: () => Promise<{ data: T }>) {
  return useSWR(key, () => fetcher().then((e) => e.data), {
    refreshInterval: POLL,
  });
}

export default function SecurityClient() {
  const [serverIndex] = useServerIndex();
  const api = createBrowserApi(serverIndex);

  const { data: posture, mutate: m1 } = useSWRData(`${serverIndex}:posture`, api.securityPosture);
  const { data: whitelist, mutate: m2 } = useSWRData(`${serverIndex}:whitelist`, api.securityWhitelist);
  const { mutate: m3 } = useSWRData(
    `${serverIndex}:effectiveLimits`,
    api.runtimeUpstreamQuality
  );

  const refresh = useCallback(() => {
    m1(); m2(); m3();
  }, [m1, m2, m3]);

  return (
    <>
      <Topbar
        title="Security"
        description="Posture overview, API whitelist, telemetry policy"
        actions={<RefreshButton onClick={refresh} />}
      />

      <div className="p-6 space-y-6">
        {/* Security posture */}
        {posture && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  API Security Posture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusIndicator
                  state={posture.api_read_only ? "warning" : "ok"}
                  label="API mode"
                  detail={posture.api_read_only ? "Read-only — mutations disabled" : "Read-write"}
                />
                <StatusIndicator
                  state={posture.api_whitelist_enabled ? "ok" : "warning"}
                  label="IP whitelist"
                  detail={
                    posture.api_whitelist_enabled
                      ? `Enabled · ${posture.api_whitelist_entries} CIDR entries`
                      : "Disabled — all source IPs accepted"
                  }
                />
                <StatusIndicator
                  state={posture.api_auth_header_enabled ? "ok" : "warning"}
                  label="Authorization header"
                  detail={
                    posture.api_auth_header_enabled
                      ? "Required on all requests"
                      : "Not configured — open access"
                  }
                />
                <StatusIndicator
                  state={posture.proxy_protocol_enabled ? "warning" : "ok"}
                  label="PROXY protocol"
                  detail={
                    posture.proxy_protocol_enabled ? "Enabled (trusted upstream required)" : "Disabled"
                  }
                />

                {/* Risk summary */}
                {(!posture.api_whitelist_enabled || !posture.api_auth_header_enabled) && (
                  <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/8 px-3 py-2.5 text-xs text-[var(--color-warning)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      API is accessible without full authentication.
                      Consider enabling both whitelist and auth header.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Telemetry & Logging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusIndicator
                  state={posture.telemetry_core_enabled ? "ok" : "warning"}
                  label="Core telemetry"
                  detail={posture.telemetry_core_enabled ? "Enabled" : "Disabled"}
                />
                <StatusIndicator
                  state={posture.telemetry_user_enabled ? "ok" : "warning"}
                  label="User telemetry"
                  detail={posture.telemetry_user_enabled ? "Enabled" : "Disabled"}
                />
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm text-[var(--color-foreground)]">ME telemetry level</p>
                  </div>
                  <Badge
                    variant={
                      posture.telemetry_me_level === "debug"
                        ? "warning"
                        : posture.telemetry_me_level === "normal"
                          ? "success"
                          : "outline"
                    }
                  >
                    {posture.telemetry_me_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-foreground)]">Log level</p>
                  </div>
                  <Badge
                    variant={
                      posture.log_level === "debug"
                        ? "warning"
                        : posture.log_level === "silent"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {posture.log_level}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Whitelist details */}
        {whitelist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {whitelist.enabled ? (
                  <Lock className="h-4 w-4 text-[var(--color-success)]" />
                ) : (
                  <Unlock className="h-4 w-4 text-[var(--color-warning)]" />
                )}
                API IP Whitelist
                <Badge variant={whitelist.enabled ? "success" : "warning"}>
                  {whitelist.enabled ? "active" : "disabled"}
                </Badge>
                <span className="ml-auto text-xs font-normal text-[var(--color-muted-foreground)]">
                  snapshot: {formatEpoch(whitelist.generated_at_epoch_secs)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whitelist.enabled && whitelist.entries.length > 0 ? (
                <div className="space-y-1.5">
                  {whitelist.entries.map((cidr) => (
                    <div
                      key={cidr}
                      className="flex items-center gap-2 rounded-md bg-[var(--color-secondary)]/40 px-3 py-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                      <span className="font-mono text-sm text-[var(--color-foreground)]">{cidr}</span>
                    </div>
                  ))}
                </div>
              ) : whitelist.enabled ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Whitelist is enabled but contains no entries — all IPs are blocked.
                </p>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Whitelist is disabled. All source IPs can access the API.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Security checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Security Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {posture ? (
              [
                {
                  label: "IP whitelist is configured",
                  ok: posture.api_whitelist_enabled && posture.api_whitelist_entries > 0,
                  critical: true,
                },
                {
                  label: "Authorization header is required",
                  ok: posture.api_auth_header_enabled,
                  critical: true,
                },
                {
                  label: "API is in read-only mode or mutations are intentional",
                  ok: !posture.api_read_only,
                  critical: false,
                },
                {
                  label: "Core telemetry is enabled",
                  ok: posture.telemetry_core_enabled,
                  critical: false,
                },
                {
                  label: "User telemetry is enabled",
                  ok: posture.telemetry_user_enabled,
                  critical: false,
                },
                {
                  label: "Log level is not silent",
                  ok: posture.log_level !== "silent",
                  critical: false,
                },
              ].map(({ label, ok, critical }) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${ok
                      ? "bg-[var(--color-success)]"
                      : critical
                        ? "bg-[var(--color-destructive)]"
                        : "bg-[var(--color-warning)]"
                      }`}
                  />
                  <span
                    className={`text-sm ${ok
                      ? "text-[var(--color-foreground)]"
                      : critical
                        ? "text-[var(--color-destructive)]"
                        : "text-[var(--color-warning)]"
                      }`}
                  >
                    {label}
                  </span>
                  {!ok && critical && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      critical
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}