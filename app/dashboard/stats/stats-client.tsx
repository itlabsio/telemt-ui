"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createBrowserApi } from "@/lib/api/browser";
import { useServerIndex } from "@/lib/use-server-index";
import { formatNum, formatMs, formatPct } from "@/lib/fmt";

const POLL = 10_000;

function useSWRData<T>(key: string, fetcher: () => Promise<{ data: T }>) {
  return useSWR(key, () => fetcher().then((e) => e.data), {
    refreshInterval: POLL,
  });
}

export default function StatsClient() {
  const [serverIndex] = useServerIndex();
  const api = createBrowserApi(serverIndex);

  const { data: zero, mutate: m1 } = useSWRData(`${serverIndex}:zeroAll`, api.statsZeroAll);
  const { data: upstreams, mutate: m2 } = useSWRData(`${serverIndex}:upstreams`, api.statsUpstreams);
  const { data: dcs, mutate: m3 } = useSWRData(`${serverIndex}:dcs`, api.statsDcs);
  const { data: writers, mutate: m4 } = useSWRData(`${serverIndex}:meWriters`, api.statsMeWriters);

  const refresh = useCallback(() => {
    m1(); m2(); m3(); m4();
  }, [m1, m2, m3, m4]);

  return (
    <>
      <Topbar
        title="Statistics"
        description="Zero-cost counters, upstream health, DC coverage"
        actions={<RefreshButton onClick={refresh} />}
      />

      <div className="p-6 space-y-6">
        {/* Core counters */}
        {zero && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Counters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Total connections", value: formatNum(zero.core.connections_total) },
                  { label: "Failed connections", value: formatNum(zero.core.connections_bad_total) },
                  { label: "Handshake timeouts", value: formatNum(zero.core.handshake_timeouts_total) },
                  { label: "Configured users", value: formatNum(zero.core.configured_users) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{label}</span>
                    <span className="font-mono tabular-nums">{value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--color-border)] flex gap-2 flex-wrap">
                  <Badge variant={zero.core.telemetry_core_enabled ? "success" : "outline"}>
                    core telemetry {zero.core.telemetry_core_enabled ? "on" : "off"}
                  </Badge>
                  <Badge variant={zero.core.telemetry_user_enabled ? "success" : "outline"}>
                    user telemetry {zero.core.telemetry_user_enabled ? "on" : "off"}
                  </Badge>
                  <Badge variant="secondary">ME: {zero.core.telemetry_me_level}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upstream Connect Counters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Attempts", value: formatNum(zero.upstream.connect_attempt_total) },
                  { label: "Successes", value: formatNum(zero.upstream.connect_success_total) },
                  { label: "Failures", value: formatNum(zero.upstream.connect_fail_total) },
                  { label: "Fail-fast hard errors", value: formatNum(zero.upstream.connect_failfast_hard_error_total) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{label}</span>
                    <span className="font-mono tabular-nums">{value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Attempt distribution
                  </p>
                  {[
                    { label: "1 try", value: zero.upstream.connect_attempts_bucket_1 },
                    { label: "2 tries", value: zero.upstream.connect_attempts_bucket_2 },
                    { label: "3–4 tries", value: zero.upstream.connect_attempts_bucket_3_4 },
                    { label: ">4 tries", value: zero.upstream.connect_attempts_bucket_gt_4 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">{label}</span>
                      <span className="font-mono tabular-nums">{formatNum(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ME Pool Lifecycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Pool swaps", value: formatNum(zero.pool.pool_swap_total) },
                  { label: "Active draining pools", value: formatNum(zero.pool.pool_drain_active) },
                  { label: "Force closes", value: formatNum(zero.pool.pool_force_close_total) },
                  { label: "Stale picks", value: formatNum(zero.pool.pool_stale_pick_total) },
                  { label: "Writers removed", value: formatNum(zero.pool.writer_removed_total) },
                  { label: "Unexpected removals", value: formatNum(zero.pool.writer_removed_unexpected_total) },
                  { label: "Refill triggers", value: formatNum(zero.pool.refill_triggered_total) },
                  { label: "Refill skipped (in-flight)", value: formatNum(zero.pool.refill_skipped_inflight_total) },
                  { label: "Refill failures", value: formatNum(zero.pool.refill_failed_total) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{label}</span>
                    <span className="font-mono tabular-nums">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ME Protocol Counters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Keepalive sent", value: zero.middle_proxy.keepalive_sent_total },
                  { label: "Keepalive failed", value: zero.middle_proxy.keepalive_failed_total },
                  { label: "Keepalive pong", value: zero.middle_proxy.keepalive_pong_total },
                  { label: "Keepalive timeout", value: zero.middle_proxy.keepalive_timeout_total },
                  { label: "Reconnect attempts", value: zero.middle_proxy.reconnect_attempt_total },
                  { label: "Reconnect success", value: zero.middle_proxy.reconnect_success_total },
                  { label: "Handshake rejects", value: zero.middle_proxy.handshake_reject_total },
                  { label: "KDF drift", value: zero.middle_proxy.kdf_drift_total },
                  { label: "KDF port-only drift", value: zero.middle_proxy.kdf_port_only_drift_total },
                  { label: "SOCKS KDF strict reject", value: zero.middle_proxy.socks_kdf_strict_reject_total },
                  { label: "SOCKS KDF compat fallback", value: zero.middle_proxy.socks_kdf_compat_fallback_total },
                  { label: "Route drop (no conn)", value: zero.middle_proxy.route_drop_no_conn_total },
                  { label: "Route drop (queue full)", value: zero.middle_proxy.route_drop_queue_full_total },
                  { label: "Endpoint quarantines", value: zero.middle_proxy.endpoint_quarantine_total },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{label}</span>
                    <span
                      className={`font-mono tabular-nums ${value > 0 &&
                        (label.includes("drift") ||
                          label.includes("reject") ||
                          label.includes("drop") ||
                          label.includes("quarantine"))
                        ? "text-[var(--color-warning)]"
                        : ""
                        }`}
                    >
                      {formatNum(value)}
                    </span>
                  </div>
                ))}

                {zero.middle_proxy.handshake_error_codes.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-foreground)] mb-1">
                      Handshake error codes
                    </p>
                    {zero.middle_proxy.handshake_error_codes.map((ec: import("@/types/api").ZeroCodeCount) => (
                      <div key={ec.code} className="flex justify-between text-xs">
                        <span className="font-mono text-[var(--color-muted-foreground)]">
                          code {ec.code}
                        </span>
                        <span className="font-mono tabular-nums text-[var(--color-warning)]">
                          {formatNum(ec.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desync Counters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Total desyncs", value: zero.desync.desync_total },
                  { label: "Fully logged", value: zero.desync.desync_full_logged_total },
                  { label: "Suppressed", value: zero.desync.desync_suppressed_total },
                  { label: "Invalid secure padding", value: zero.desync.secure_padding_invalid_total },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{label}</span>
                    <span
                      className={`font-mono tabular-nums ${value > 0 ? "text-[var(--color-warning)]" : ""}`}
                    >
                      {formatNum(value)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-foreground)] mb-1.5">
                    Frame buckets
                  </p>
                  {[
                    { label: "0 frames", value: zero.desync.desync_frames_bucket_0 },
                    { label: "1–2 frames", value: zero.desync.desync_frames_bucket_1_2 },
                    { label: "3–10 frames", value: zero.desync.desync_frames_bucket_3_10 },
                    { label: ">10 frames", value: zero.desync.desync_frames_bucket_gt_10 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-[var(--color-muted-foreground)]">{label}</span>
                      <span className="font-mono tabular-nums">{formatNum(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upstreams */}
        {upstreams && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Upstreams
                {!upstreams.enabled && (
                  <Badge variant="outline">runtime disabled</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upstreams.summary && (
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  {[
                    { label: "Configured", value: upstreams.summary.configured_total },
                    {
                      label: "Healthy",
                      value: upstreams.summary.healthy_total,
                      accent: upstreams.summary.healthy_total === upstreams.summary.configured_total
                        ? "success" as const
                        : "warning" as const,
                    },
                    { label: "Unhealthy", value: upstreams.summary.unhealthy_total },
                    {
                      label: "Direct / SOCKS4 / SOCKS5 / SS",
                      value: `${upstreams.summary.direct_total} / ${upstreams.summary.socks4_total} / ${upstreams.summary.socks5_total} / ${upstreams.summary.shadowsocks_total}`,
                    },
                  ].map(({ label, value, accent }: { label: string; value: string | number; accent?: "success" | "warning" }) => (
                    <div key={label} className="rounded-lg bg-[var(--color-secondary)]/40 p-3">
                      <p
                        className={`text-lg font-bold tabular-nums ${accent === "success"
                          ? "text-[var(--color-success)]"
                          : accent === "warning"
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--color-foreground)]"
                          }`}
                      >
                        {value}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {upstreams.upstreams && upstreams.upstreams.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fails</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Last check</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upstreams.upstreams.map((u: import("@/types/api").UpstreamStatus) => (
                      <TableRow key={u.upstream_id}>
                        <TableCell className="font-mono text-xs text-[var(--color-muted-foreground)]">
                          {u.upstream_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{u.route_kind}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.address}</TableCell>
                        <TableCell className="tabular-nums">{u.weight}</TableCell>
                        <TableCell>
                          <Badge variant={u.healthy ? "success" : "destructive"}>
                            {u.healthy ? "healthy" : "unhealthy"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`tabular-nums ${u.fails > 0 ? "text-[var(--color-warning)]" : ""}`}
                        >
                          {u.fails}
                        </TableCell>
                        <TableCell className="tabular-nums">{formatMs(u.effective_latency_ms)}</TableCell>
                        <TableCell className="tabular-nums text-xs text-[var(--color-muted-foreground)]">
                          {u.last_check_age_secs}s ago
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!upstreams.enabled && upstreams.reason && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {upstreams.reason === "feature_disabled"
                    ? "Enable server.api.minimal_runtime_enabled for runtime upstream data."
                    : upstreams.reason}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* DC status */}
        {dcs?.middle_proxy_enabled && dcs.dcs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>DC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DC</TableHead>
                    <TableHead>Endpoints</TableHead>
                    <TableHead>Avail.</TableHead>
                    <TableHead>Writers alive/req.</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>RTT</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Floor min/tgt/max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcs.dcs.map((dc: import("@/types/api").DcStatus) => (
                    <TableRow key={dc.dc}>
                      <TableCell className="font-mono font-semibold">{dc.dc}</TableCell>
                      <TableCell className="tabular-nums text-xs">
                        {dc.endpoints.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="tabular-nums">{dc.available_endpoints}</span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            ({formatPct(dc.available_pct)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {dc.alive_writers}/{dc.required_writers}
                        {dc.floor_capped && (
                          <Badge variant="warning" className="ml-1 text-xs">capped</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={dc.coverage_pct}
                            className="w-16"
                            variant={
                              dc.coverage_pct >= 90
                                ? "success"
                                : dc.coverage_pct >= 60
                                  ? "warning"
                                  : "destructive"
                            }
                          />
                          <span className="text-xs tabular-nums">{formatPct(dc.coverage_pct)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatMs(dc.rtt_ms)}</TableCell>
                      <TableCell className="tabular-nums">{dc.load}</TableCell>
                      <TableCell className="tabular-nums text-xs text-[var(--color-muted-foreground)]">
                        {dc.floor_min}/{dc.floor_target}/{dc.floor_max}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ME Writers */}
        {writers?.middle_proxy_enabled && (
          <Card>
            <CardHeader>
              <CardTitle>ME Writers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                {[
                  { label: "Configured endpoints", value: writers.summary.configured_endpoints },
                  { label: "Available endpoints", value: writers.summary.available_endpoints },
                  { label: "Required writers", value: writers.summary.required_writers },
                  { label: "Alive writers", value: writers.summary.alive_writers },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-[var(--color-secondary)]/40 p-3">
                    <p className="text-xl font-bold tabular-nums text-[var(--color-foreground)]">{value}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Progress
                  value={writers.summary.coverage_pct}
                  variant={
                    writers.summary.coverage_pct >= 90
                      ? "success"
                      : writers.summary.coverage_pct >= 60
                        ? "warning"
                        : "destructive"
                  }
                />
                <span className="shrink-0 text-sm font-medium">
                  {formatPct(writers.summary.coverage_pct)} coverage
                </span>
              </div>

              {writers.writers.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>DC</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>RTT</TableHead>
                      <TableHead>Idle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {writers.writers.map((w: import("@/types/api").MeWriterStatus) => (
                      <TableRow key={w.writer_id}>
                        <TableCell className="font-mono text-xs">{w.writer_id}</TableCell>
                        <TableCell className="font-mono">{w.dc ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{w.endpoint}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              w.draining
                                ? "outline"
                                : w.degraded
                                  ? "warning"
                                  : w.state === "active"
                                    ? "success"
                                    : "secondary"
                            }
                          >
                            {w.state}
                            {w.draining && " (draining)"}
                            {w.degraded && " (degraded)"}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">{w.bound_clients}</TableCell>
                        <TableCell className="tabular-nums">{formatMs(w.rtt_ema_ms)}</TableCell>
                        <TableCell className="tabular-nums text-xs text-[var(--color-muted-foreground)]">
                          {w.idle_for_secs !== undefined ? `${w.idle_for_secs}s` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feature disabled notices */}
        {dcs && !dcs.middle_proxy_enabled && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                ME writer and DC stats require{" "}
                <code className="font-mono text-xs">server.api.minimal_runtime_enabled = true</code>.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}