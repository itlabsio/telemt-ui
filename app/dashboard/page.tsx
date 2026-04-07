import type { Metadata } from "next";
import {
  Activity,
  Users,
  Wifi,
  Clock,
  Server,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusIndicator } from "@/components/dashboard/status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { serverApi } from "@/lib/api/server";
import { formatUptime, formatEpoch, formatNum, formatPct } from "@/lib/fmt";

export const metadata: Metadata = { title: "Overview" };

// Fetch is best-effort: a failed individual call returns null.
async function safeGet<T>(promise: Promise<{ data: T }>): Promise<T | null> {
  try {
    return (await promise).data;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const [health, systemInfo, gates, summary, minimalAll] = await Promise.all([
    safeGet(serverApi.health()),
    safeGet(serverApi.systemInfo()),
    safeGet(serverApi.runtimeGates()),
    safeGet(serverApi.statsSummary()),
    safeGet(serverApi.statsMinimalAll()),
  ]);

  const isHealthy =
    health?.status === "ok" &&
    (gates?.accepting_new_connections ?? false);

  const coveragePct = minimalAll?.data?.me_writers?.summary?.coverage_pct ?? null;
  const coverageVariant =
    coveragePct === null
      ? "unknown"
      : coveragePct >= 90
        ? "ok"
        : coveragePct >= 60
          ? "warning"
          : "error";

  return (
    <div className="flex flex-col">
      <Topbar
        title="Overview"
        description={
          systemInfo
            ? `${systemInfo.version} · ${systemInfo.target_os}/${systemInfo.target_arch}`
            : "Connecting…"
        }
      />

      <div className="p-6 space-y-6">
        {/* Health banner */}
        {health && (
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              isHealthy
                ? "border-[var(--color-success)]/25 bg-[var(--color-success)]/8 text-[var(--color-success)]"
                : "border-[var(--color-destructive)]/25 bg-[var(--color-destructive)]/8 text-[var(--color-destructive)]"
            }`}
          >
            {isHealthy ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">
              {isHealthy ? "Proxy is healthy and accepting connections" : "Proxy health check failed"}
            </span>
            {health.read_only && (
              <Badge variant="warning" className="ml-auto">
                Read-only
              </Badge>
            )}
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Uptime"
            value={summary ? formatUptime(summary.uptime_seconds) : "—"}
            icon={<Clock className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
          />
          <StatCard
            label="Total connections"
            value={summary ? formatNum(summary.connections_total) : "—"}
            sub={summary ? `${formatNum(summary.connections_bad_total)} failed` : undefined}
            icon={<Wifi className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
          />
          <StatCard
            label="Configured users"
            value={summary ? formatNum(summary.configured_users) : "—"}
            icon={<Users className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
          />
          <StatCard
            label="Handshake timeouts"
            value={summary ? formatNum(summary.handshake_timeouts_total) : "—"}
            accent={
              summary && summary.handshake_timeouts_total > 0 ? "warning" : "default"
            }
            icon={<Activity className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Runtime gates */}
          <Card>
            <CardHeader>
              <CardTitle>Runtime Gates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gates ? (
                <>
                  <StatusIndicator
                    state={gates.accepting_new_connections ? "ok" : "error"}
                    label="Accepting connections"
                    detail={gates.accepting_new_connections ? "Open" : "Closed"}
                  />
                  <StatusIndicator
                    state={gates.me_runtime_ready ? "ok" : "warning"}
                    label="ME runtime"
                    detail={gates.me_runtime_ready ? "Ready" : "Not ready"}
                  />
                  <StatusIndicator
                    state="ok"
                    label="Transport mode"
                    detail={gates.use_middle_proxy ? "Middle Proxy" : "Direct"}
                  />
                  <StatusIndicator
                    state={gates.me2dc_fallback_enabled ? "warning" : "ok"}
                    label="ME → DC fallback"
                    detail={gates.me2dc_fallback_enabled ? "Enabled" : "Disabled"}
                  />
                  <div className="pt-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--color-muted-foreground)]">Startup progress</span>
                      <span className="text-[var(--color-foreground)]">
                        {formatPct(gates.startup_progress_pct)}
                      </span>
                    </div>
                    <Progress
                      value={gates.startup_progress_pct}
                      variant={gates.startup_status === "ready" ? "success" : "default"}
                    />
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {gates.startup_status} · {gates.startup_stage}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">Unavailable</p>
              )}
            </CardContent>
          </Card>

          {/* ME writers coverage */}
          <Card>
            <CardHeader>
              <CardTitle>ME Writer Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {minimalAll?.data?.me_writers ? (
                <>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-[var(--color-foreground)]">
                        {minimalAll.data.me_writers.summary.alive_writers}
                        <span className="ml-1 text-lg text-[var(--color-muted-foreground)]">
                          / {minimalAll.data.me_writers.summary.required_writers}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">alive / required writers</p>
                    </div>
                    <Badge
                      variant={
                        coverageVariant === "ok"
                          ? "success"
                          : coverageVariant === "warning"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {coveragePct !== null ? formatPct(coveragePct) : "—"}
                    </Badge>
                  </div>
                  <Progress
                    value={coveragePct ?? 0}
                    variant={
                      coverageVariant === "ok"
                        ? "success"
                        : coverageVariant === "warning"
                          ? "warning"
                          : "destructive"
                    }
                  />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {minimalAll.data.me_writers.summary.configured_endpoints}
                      </p>
                      <p className="text-[var(--color-muted-foreground)]">Endpoints</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {minimalAll.data.me_writers.summary.available_endpoints}
                      </p>
                      <p className="text-[var(--color-muted-foreground)]">Available</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {minimalAll.data.me_writers.summary.configured_dc_groups}
                      </p>
                      <p className="text-[var(--color-muted-foreground)]">DC groups</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {minimalAll?.enabled === false
                    ? "Minimal runtime disabled. Enable server.api.minimal_runtime_enabled."
                    : "Unavailable"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System info */}
        {systemInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3 lg:grid-cols-4">
                {[
                  { label: "Version", value: systemInfo.version },
                  { label: "Platform", value: `${systemInfo.target_os}/${systemInfo.target_arch}` },
                  { label: "Build profile", value: systemInfo.build_profile },
                  { label: "Config reloads", value: formatNum(systemInfo.config_reload_count) },
                  { label: "Started at", value: formatEpoch(systemInfo.process_started_at_epoch_secs) },
                  systemInfo.git_commit
                    ? { label: "Git commit", value: systemInfo.git_commit.slice(0, 10) }
                    : null,
                  systemInfo.rustc_version
                    ? { label: "Rust", value: systemInfo.rustc_version }
                    : null,
                  systemInfo.build_time_utc
                    ? { label: "Built at", value: systemInfo.build_time_utc }
                    : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item!.label}>
                      <dt className="text-xs text-[var(--color-muted-foreground)]">{item!.label}</dt>
                      <dd className="mt-0.5 font-mono text-xs text-[var(--color-foreground)] break-all">
                        {item!.value}
                      </dd>
                    </div>
                  ))}
              </dl>
              <div className="mt-4 flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                <span className="font-mono text-xs text-[var(--color-muted-foreground)] break-all">
                  {systemInfo.config_path}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}