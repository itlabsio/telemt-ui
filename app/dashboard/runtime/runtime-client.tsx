"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusIndicator } from "@/components/dashboard/status-indicator";
import { createBrowserApi } from "@/lib/api/browser";
import { useServerIndex } from "@/lib/use-server-index";
import { formatMs, formatNum, formatEpoch, formatPct, formatBytes } from "@/lib/fmt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const POLL = 5_000;

function useSWRData<T>(key: string, fetcher: () => Promise<{ data: T }>) {
  return useSWR(key, () => fetcher().then((e) => e.data), { refreshInterval: POLL });
}

export default function RuntimeClient() {
  const [serverIndex] = useServerIndex();
  const api = createBrowserApi(serverIndex);

  const { data: mePool, mutate: m1 } = useSWRData(`${serverIndex}:mePool`, api.runtimeMePoolState);
  const { data: meQuality, mutate: m2 } = useSWRData(`${serverIndex}:meQuality`, api.runtimeMeQuality);
  const { data: selftest, mutate: m3 } = useSWRData(`${serverIndex}:selftest`, api.runtimeMeSelftest);
  const { data: natStun, mutate: m4 } = useSWRData(`${serverIndex}:natStun`, api.runtimeNatStun);
  const { mutate: m5 } = useSWRData(`${serverIndex}:upstreamQ`, api.runtimeUpstreamQuality);
  const { data: edgeConn, mutate: m6 } = useSWRData(`${serverIndex}:edgeConn`, api.runtimeEdgeConnectionsSummary);
  const { data: events, mutate: m7 } = useSWRData(`${serverIndex}:events`, () => api.runtimeEdgeEvents(100));
  const { data: init, mutate: m8 } = useSWRData(`${serverIndex}:init`, api.runtimeInitialization);

  const refresh = useCallback(() => {
    m1(); m2(); m3(); m4(); m5(); m6(); m7(); m8();
  }, [m1, m2, m3, m4, m5, m6, m7, m8]);

  function selftestState(state: string): "ok" | "warning" | "error" | "unknown" {
    if (state === "ok") return "ok";
    if (state === "error") return "error";
    return "unknown";
  }


  return (
    <>
      <Topbar
        title="Runtime"
        description="Live ME pool, selftest, NAT/STUN, upstream quality"
        actions={<RefreshButton onClick={refresh} />}
      />

      <div className="p-6 space-y-6">
        {/* Startup initialization */}
        {init && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Startup Initialization
                <Badge
                  variant={
                    init.status === "ready"
                      ? "success"
                      : init.status === "failed"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {init.status}
                </Badge>
                {init.degraded && <Badge variant="warning">degraded</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-muted-foreground)]">Overall progress</span>
                  <span>{formatPct(init.progress_pct)}</span>
                </div>
                <Progress
                  value={init.progress_pct}
                  variant={
                    init.status === "ready"
                      ? "success"
                      : init.status === "failed"
                        ? "destructive"
                        : "default"
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Transport</p>
                  <p className="font-medium">{init.transport_mode}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Stage</p>
                  <p className="font-medium">{init.current_stage}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Elapsed</p>
                  <p className="font-medium">{init.total_elapsed_ms} ms</p>
                </div>
                {init.ready_at_epoch_secs && (
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Ready at</p>
                    <p className="font-medium text-xs">{formatEpoch(init.ready_at_epoch_secs)}</p>
                  </div>
                )}
              </div>

              {/* ME init state */}
              <div className="rounded-lg bg-[var(--color-secondary)]/40 px-3 py-2">
                <p className="mb-1 text-xs font-medium text-[var(--color-foreground)]">ME Initialization</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span>
                    <span className="text-[var(--color-muted-foreground)]">Status: </span>
                    <Badge variant={init.me.status === "ready" ? "success" : init.me.status === "failed" ? "destructive" : "warning"} className="text-xs">
                      {init.me.status}
                    </Badge>
                  </span>
                  <span>
                    <span className="text-[var(--color-muted-foreground)]">Stage: </span>
                    {init.me.current_stage}
                  </span>
                  <span>
                    <span className="text-[var(--color-muted-foreground)]">Attempt: </span>
                    {init.me.init_attempt} / {init.me.retry_limit}
                  </span>
                </div>
                {init.me.last_error && (
                  <p className="mt-1.5 text-xs text-[var(--color-destructive)]">{init.me.last_error}</p>
                )}
              </div>

              {/* Components timeline */}
              {init.components.length > 0 && (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {init.components.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.status === "ready"
                                  ? "success"
                                  : c.status === "failed"
                                    ? "destructive"
                                    : c.status === "skipped"
                                      ? "outline"
                                      : "warning"
                              }
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {c.duration_ms !== undefined ? `${c.duration_ms} ms` : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums">{c.attempts}</TableCell>
                          <TableCell className="text-xs text-[var(--color-muted-foreground)]">
                            {c.details ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ME Pool State */}
          <Card>
            <CardHeader>
              <CardTitle>ME Pool State</CardTitle>
            </CardHeader>
            <CardContent>
              {mePool?.data ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-lg bg-[var(--color-secondary)]/40 p-2">
                      <p className="text-lg font-bold text-[var(--color-foreground)]">
                        {mePool.data.writers.health.healthy}
                      </p>
                      <p className="text-[var(--color-success)]">Healthy</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-secondary)]/40 p-2">
                      <p className="text-lg font-bold text-[var(--color-foreground)]">
                        {mePool.data.writers.health.degraded}
                      </p>
                      <p className="text-[var(--color-warning)]">Degraded</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-secondary)]/40 p-2">
                      <p className="text-lg font-bold text-[var(--color-foreground)]">
                        {mePool.data.writers.health.draining}
                      </p>
                      <p className="text-[var(--color-muted-foreground)]">Draining</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Active generation</span>
                      <span className="font-mono">{mePool.data.generations.active_generation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Warm generation</span>
                      <span className="font-mono">{mePool.data.generations.warm_generation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Hardswap pending</span>
                      <span>{mePool.data.hardswap.pending ? "yes" : "no"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Refill in-flight</span>
                      <span className="font-mono">{mePool.data.refill.inflight_endpoints_total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Contour warm/active</span>
                      <span className="font-mono">
                        {mePool.data.writers.contour.warm}/{mePool.data.writers.contour.active}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {mePool?.reason === "source_unavailable"
                    ? "ME pool not available (direct mode or init failed)"
                    : "Loading…"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selftest */}
          <Card>
            <CardHeader>
              <CardTitle>ME Self-test</CardTitle>
            </CardHeader>
            <CardContent>
              {selftest?.data ? (
                <div className="space-y-2.5">
                  <StatusIndicator
                    state={selftestState(selftest.data.kdf.state)}
                    label="KDF"
                    detail={`${selftest.data.kdf.ewma_errors_per_min.toFixed(2)} err/min · ${formatNum(selftest.data.kdf.errors_total)} total`}
                  />
                  <StatusIndicator
                    state={selftestState(selftest.data.timeskew.state)}
                    label="Time skew"
                    detail={
                      selftest.data.timeskew.max_skew_secs_15m !== undefined
                        ? `max ${selftest.data.timeskew.max_skew_secs_15m}s / 15m · ${selftest.data.timeskew.samples_15m} samples`
                        : "No samples"
                    }
                  />
                  <StatusIndicator
                    state={selftest.data.bnd.addr_state === "ok" ? "ok" : "error"}
                    label="SOCKS BND address"
                    detail={`addr:${selftest.data.bnd.addr_state} port:${selftest.data.bnd.port_state}${selftest.data.bnd.last_addr ? ` · ${selftest.data.bnd.last_addr}` : ""}`}
                  />
                  <StatusIndicator
                    state={selftest.data.pid.state === "non-one" ? "ok" : "warning"}
                    label="Process PID"
                    detail={`PID ${selftest.data.pid.pid} (${selftest.data.pid.state})`}
                  />
                  <div className="pt-1 border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Interface IPs</p>
                    <div className="flex gap-3 text-xs">
                      {selftest.data.ip.v4 && (
                        <span>
                          IPv4:{" "}
                          <span className={selftest.data.ip.v4.state === "good" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
                            {selftest.data.ip.v4.addr}
                          </span>
                        </span>
                      )}
                      {selftest.data.ip.v6 && (
                        <span>
                          IPv6:{" "}
                          <span className={selftest.data.ip.v6.state === "good" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
                            {selftest.data.ip.v6.addr}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {selftest?.reason === "source_unavailable"
                    ? "ME pool unavailable"
                    : "Loading…"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ME Quality */}
          <Card>
            <CardHeader>
              <CardTitle>ME Quality</CardTitle>
            </CardHeader>
            <CardContent>
              {meQuality?.data ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "KDF drift", value: meQuality.data.counters.kdf_drift_total },
                      { label: "KDF port drift", value: meQuality.data.counters.kdf_port_only_drift_total },
                      { label: "Reconnect attempts", value: meQuality.data.counters.reconnect_attempt_total },
                      { label: "Reconnect success", value: meQuality.data.counters.reconnect_success_total },
                      { label: "Reader EOF", value: meQuality.data.counters.reader_eof_total },
                      { label: "Idle close", value: meQuality.data.counters.idle_close_by_peer_total },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[var(--color-muted-foreground)]">{label}</span>
                        <span className="font-mono tabular-nums">{formatNum(value)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-2">
                    <p className="text-xs font-medium text-[var(--color-foreground)] mb-1.5">Route drops</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { label: "No connection", value: meQuality.data.route_drops.no_conn_total },
                        { label: "Channel closed", value: meQuality.data.route_drops.channel_closed_total },
                        { label: "Queue full", value: meQuality.data.route_drops.queue_full_total },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[var(--color-muted-foreground)]">{label}</span>
                          <span className={`font-mono tabular-nums ${value > 0 ? "text-[var(--color-warning)]" : ""}`}>
                            {formatNum(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DC RTT table */}
                  {meQuality.data.dc_rtt.length > 0 && (
                    <div className="border-t border-[var(--color-border)] pt-2">
                      <p className="text-xs font-medium text-[var(--color-foreground)] mb-1.5">DC Coverage & RTT</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>DC</TableHead>
                            <TableHead>RTT</TableHead>
                            <TableHead>Writers</TableHead>
                            <TableHead>Coverage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {meQuality.data.dc_rtt.map((dc) => (
                            <TableRow key={dc.dc}>
                              <TableCell className="font-mono">{dc.dc}</TableCell>
                              <TableCell className="tabular-nums">{formatMs(dc.rtt_ema_ms)}</TableCell>
                              <TableCell className="tabular-nums">
                                {dc.alive_writers}/{dc.required_writers}
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">Loading…</p>
              )}
            </CardContent>
          </Card>

          {/* NAT/STUN */}
          <Card>
            <CardHeader>
              <CardTitle>NAT / STUN</CardTitle>
            </CardHeader>
            <CardContent>
              {natStun?.data ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <StatusIndicator
                      state={natStun.data.flags.nat_probe_enabled ? "ok" : "warning"}
                      label="NAT probe"
                    />
                    <StatusIndicator
                      state={natStun.data.flags.nat_probe_disabled_runtime ? "warning" : "ok"}
                      label="Runtime disabled"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted-foreground)]">Live STUN servers</span>
                      <span className="font-mono">{natStun.data.servers.live_total}</span>
                    </div>
                    {natStun.data.stun_backoff_remaining_ms && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted-foreground)]">Backoff remaining</span>
                        <span className="font-mono">{natStun.data.stun_backoff_remaining_ms} ms</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[var(--color-border)] pt-2 space-y-1 text-xs">
                    {natStun.data.reflection.v4 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted-foreground)]">IPv4 reflection</span>
                        <span className="font-mono">
                          {natStun.data.reflection.v4.addr}
                          <span className="ml-1 text-[var(--color-muted-foreground)]">
                            ({natStun.data.reflection.v4.age_secs}s ago)
                          </span>
                        </span>
                      </div>
                    )}
                    {natStun.data.reflection.v6 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted-foreground)]">IPv6 reflection</span>
                        <span className="font-mono">
                          {natStun.data.reflection.v6.addr}
                          <span className="ml-1 text-[var(--color-muted-foreground)]">
                            ({natStun.data.reflection.v6.age_secs}s ago)
                          </span>
                        </span>
                      </div>
                    )}
                    {!natStun.data.reflection.v4 && !natStun.data.reflection.v6 && (
                      <p className="text-[var(--color-muted-foreground)]">No reflection data yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {natStun?.reason === "source_unavailable" ? "STUN state unavailable" : "Loading…"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edge connections */}
        {edgeConn && (
          <Card>
            <CardHeader>
              <CardTitle>Edge Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {edgeConn.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                    {[
                      { label: "Total live", value: edgeConn.data.totals.current_connections },
                      { label: "Via ME", value: edgeConn.data.totals.current_connections_me },
                      { label: "Direct", value: edgeConn.data.totals.current_connections_direct },
                      { label: "Active users", value: edgeConn.data.totals.active_users },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-[var(--color-secondary)]/40 p-3">
                        <p className="text-xl font-bold tabular-nums text-[var(--color-foreground)]">{formatNum(value)}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {edgeConn.data.top.by_connections.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-[var(--color-foreground)]">
                        Top users by connections
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Connections</TableHead>
                            <TableHead>Total traffic</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {edgeConn.data.top.by_connections.map((u) => (
                            <TableRow key={u.username}>
                              <TableCell className="font-mono text-sm">{u.username}</TableCell>
                              <TableCell className="tabular-nums">{formatNum(u.current_connections)}</TableCell>
                              <TableCell className="tabular-nums">{formatBytes(u.total_octets)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span>Cache TTL: {edgeConn.data.cache.ttl_ms} ms</span>
                    {edgeConn.data.cache.served_from_cache && <Badge variant="outline">cached</Badge>}
                    {edgeConn.data.cache.stale_cache_used && <Badge variant="warning">stale</Badge>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {edgeConn.reason === "feature_disabled"
                    ? "Edge connections disabled. Enable server.api.runtime_edge_enabled."
                    : edgeConn.reason === "source_unavailable"
                      ? "Data temporarily unavailable"
                      : "Loading…"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent events */}
        {events && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.data ? (
                <div className="space-y-2">
                  {events.data.dropped_total > 0 && (
                    <p className="text-xs text-[var(--color-warning)]">
                      {formatNum(events.data.dropped_total)} events dropped due to buffer pressure
                    </p>
                  )}
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {[...events.data.events].reverse().map((ev) => (
                      <div
                        key={ev.seq}
                        className="flex items-start gap-3 rounded-md px-3 py-1.5 hover:bg-[var(--color-secondary)]/30 text-xs"
                      >
                        <span className="shrink-0 font-mono text-[var(--color-muted-foreground)]">
                          {new Date(ev.ts_epoch_secs * 1000).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {ev.event_type}
                        </Badge>
                        <span className="text-[var(--color-foreground)] break-all">{ev.context}</span>
                      </div>
                    ))}
                    {events.data.events.length === 0 && (
                      <p className="text-[var(--color-muted-foreground)]">No events yet</p>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Buffer capacity: {events.data.capacity}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {events.reason === "feature_disabled"
                    ? "Events disabled. Enable server.api.runtime_edge_enabled."
                    : "Loading…"}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}