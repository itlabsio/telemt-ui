"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Save, RotateCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBrowserApi, BrowserApiError } from "@/lib/api/browser";
import { useServerIndex } from "@/lib/use-server-index";
import { formatEpoch } from "@/lib/fmt";
import {
  EDITABLE_CONFIG_SECTIONS,
  type EditableConfigSection,
  type ReloadStatus,
} from "@/types/api";

const TERMINAL_STATES = new Set(["succeeded", "rolled_back", "failed"]);

const SECTION_DESCRIPTIONS: Record<EditableConfigSection, string> = {
  general: "Core proxy behavior, links, telemetry.",
  timeouts: "Client/upstream timeout policy.",
  censorship: "TLS front / SNI domain settings.",
  upstreams: "Upstream routing entries.",
  show_link: "Public proxy-link generation flags.",
  dc_overrides: "Per-DC endpoint overrides.",
};

function stateVariant(state: string): "success" | "destructive" | "warning" | "secondary" {
  if (state === "succeeded") return "success";
  if (state === "failed" || state === "rolled_back") return "destructive";
  if (TERMINAL_STATES.has(state)) return "secondary";
  return "warning";
}

export default function ConfigClient() {
  const [serverIndex] = useServerIndex();
  const api = createBrowserApi(serverIndex);

  const {
    data: configEnvelope,
    error: configError,
    isLoading: configLoading,
    mutate: mutateConfig,
  } = useSWR([serverIndex, "/v1/config"], () => api.getConfig(), {
    revalidateOnFocus: false,
  });

  const { data: healthEnvelope, mutate: mutateHealth } = useSWR(
    [serverIndex, "/v1/health"],
    () => api.health(),
    { refreshInterval: 15_000 }
  );

  const readOnly = healthEnvelope?.data.read_only ?? false;
  const revision = configEnvelope?.revision;

  const [sectionText, setSectionText] = useState<Record<string, string>>({});
  const [sectionParseError, setSectionParseError] = useState<Record<string, string | null>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<EditableConfigSection | null>(null);
  const [saveMessage, setSaveMessage] = useState<Record<string, string | null>>({});
  const [saveError, setSaveError] = useState<Record<string, string | null>>({});

  // Sync textareas from fetched config, but only for sections the user
  // hasn't started editing locally.
  useEffect(() => {
    if (!configEnvelope) return;
    setSectionText((prev) => {
      const next = { ...prev };
      for (const section of EDITABLE_CONFIG_SECTIONS) {
        if (dirty[section]) continue;
        const value = configEnvelope.data[section];
        next[section] = value !== undefined ? JSON.stringify(value, null, 2) : "";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configEnvelope]);

  const [reloadMode, setReloadMode] = useState<"instant" | "drain">("instant");
  const [reloadTimeoutSecs, setReloadTimeoutSecs] = useState("30");
  const [failurePolicy, setFailurePolicy] = useState<"keep_new" | "rollback">("keep_new");
  const [applyReloadOnSave, setApplyReloadOnSave] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [activeReloadId, setActiveReloadId] = useState<number | null>(null);

  const { data: reloadStatusEnvelope } = useSWR(
    activeReloadId !== null ? [serverIndex, "reload-status", activeReloadId] : null,
    () => api.reloadStatus(activeReloadId!),
    {
      refreshInterval: (data) =>
        data && TERMINAL_STATES.has(data.data.state) ? 0 : 1_500,
    }
  );
  const reloadStatus: ReloadStatus | undefined = reloadStatusEnvelope?.data;

  const refresh = () => {
    mutateConfig();
    mutateHealth();
  };

  function handleTextChange(section: EditableConfigSection, text: string) {
    setSectionText((prev) => ({ ...prev, [section]: text }));
    setDirty((prev) => ({ ...prev, [section]: true }));
    setSaveMessage((prev) => ({ ...prev, [section]: null }));
    if (text.trim() === "") {
      setSectionParseError((prev) => ({ ...prev, [section]: null }));
      return;
    }
    try {
      JSON.parse(text);
      setSectionParseError((prev) => ({ ...prev, [section]: null }));
    } catch (err) {
      setSectionParseError((prev) => ({
        ...prev,
        [section]: err instanceof Error ? err.message : "Invalid JSON",
      }));
    }
  }

  function resetSection(section: EditableConfigSection) {
    const value = configEnvelope?.data[section];
    setSectionText((prev) => ({
      ...prev,
      [section]: value !== undefined ? JSON.stringify(value, null, 2) : "",
    }));
    setDirty((prev) => ({ ...prev, [section]: false }));
    setSectionParseError((prev) => ({ ...prev, [section]: null }));
    setSaveMessage((prev) => ({ ...prev, [section]: null }));
    setSaveError((prev) => ({ ...prev, [section]: null }));
  }

  async function saveSection(section: EditableConfigSection) {
    const text = sectionText[section] ?? "";
    let parsed: Record<string, unknown>;
    try {
      parsed = text.trim() === "" ? {} : JSON.parse(text);
    } catch (err) {
      setSectionParseError((prev) => ({
        ...prev,
        [section]: err instanceof Error ? err.message : "Invalid JSON",
      }));
      return;
    }

    setSaving(section);
    setSaveError((prev) => ({ ...prev, [section]: null }));
    setSaveMessage((prev) => ({ ...prev, [section]: null }));
    try {
      const res = await api.patchConfig(
        { [section]: parsed },
        revision,
        applyReloadOnSave
          ? {
              mode: reloadMode,
              timeoutSecs: reloadMode === "drain" ? Number(reloadTimeoutSecs) || 30 : undefined,
              failurePolicy,
            }
          : undefined
      );
      setDirty((prev) => ({ ...prev, [section]: false }));
      setSaveMessage((prev) => ({
        ...prev,
        [section]: res.data.reload
          ? `Saved · reload #${res.data.reload.reload_id} ${res.data.reload.state}`
          : "Saved",
      }));
      if (res.data.reload) setActiveReloadId(res.data.reload.reload_id);
      await mutateConfig();
    } catch (err) {
      setSaveError((prev) => ({
        ...prev,
        [section]: err instanceof BrowserApiError ? err.message : "Failed to save section",
      }));
    } finally {
      setSaving(null);
    }
  }

  async function triggerReload() {
    setTriggering(true);
    setReloadError(null);
    try {
      const res = await api.systemReload(
        {
          mode: reloadMode,
          timeout_secs: reloadMode === "drain" ? Number(reloadTimeoutSecs) || 30 : undefined,
          failure_policy: failurePolicy,
        },
        revision
      );
      setActiveReloadId(res.data.reload_id);
    } catch (err) {
      setReloadError(err instanceof BrowserApiError ? err.message : "Failed to trigger reload");
    } finally {
      setTriggering(false);
    }
  }

  const anyDirty = useMemo(() => Object.values(dirty).some(Boolean), [dirty]);

  return (
    <>
      <Topbar
        title="Config"
        description="Editable config sections, revision, and runtime reload"
        actions={
          <>
            {readOnly && <Badge variant="warning">Read-only</Badge>}
            <RefreshButton onClick={refresh} loading={configLoading} />
          </>
        }
      />

      <div className="p-6 space-y-6">
        {configError && (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-[var(--color-destructive)]">
                {configError instanceof Error ? configError.message : "Failed to load config"}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {revision && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span>Revision:</span>
            <span className="font-mono">{revision.slice(0, 16)}…</span>
            {anyDirty && <Badge variant="warning">unsaved changes</Badge>}
          </div>
        )}

        {/* Runtime reload controls */}
        <Card>
          <CardHeader>
            <CardTitle>Runtime Reload</CardTitle>
            <CardDescription>
              Loads the current on-disk config and asks Maestro to activate a new runtime
              generation. Independent of the section editors below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-foreground)]">Mode</label>
                <select
                  value={reloadMode}
                  onChange={(e) => setReloadMode(e.target.value as "instant" | "drain")}
                  className="h-9 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
                >
                  <option value="instant">instant</option>
                  <option value="drain">drain</option>
                </select>
              </div>
              {reloadMode === "drain" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--color-foreground)]">
                    Drain timeout (s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3600}
                    value={reloadTimeoutSecs}
                    onChange={(e) => setReloadTimeoutSecs(e.target.value)}
                    className="h-9 w-28 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-foreground)]">
                  Failure policy
                </label>
                <select
                  value={failurePolicy}
                  onChange={(e) => setFailurePolicy(e.target.value as "keep_new" | "rollback")}
                  className="h-9 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
                >
                  <option value="keep_new">keep_new</option>
                  <option value="rollback">rollback</option>
                </select>
              </div>
              {!readOnly && (
                <Button size="sm" loading={triggering} onClick={triggerReload}>
                  <RotateCw className="h-3.5 w-3.5" />
                  Reload now
                </Button>
              )}
              <label className="ml-auto flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <input
                  type="checkbox"
                  checked={applyReloadOnSave}
                  onChange={(e) => setApplyReloadOnSave(e.target.checked)}
                />
                Also reload when saving a section below
              </label>
            </div>

            {reloadError && (
              <p className="rounded-md bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]">
                {reloadError}
              </p>
            )}

            {reloadStatus && (
              <div className="rounded-lg bg-[var(--color-secondary)]/40 px-3 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-muted-foreground)]">
                    Reload #{reloadStatus.reload_id} → generation {reloadStatus.target_generation}
                  </span>
                  <Badge variant={stateVariant(reloadStatus.state)}>{reloadStatus.state}</Badge>
                  <span className="text-[var(--color-muted-foreground)]">
                    {reloadStatus.mode} · {reloadStatus.failure_policy}
                  </span>
                  {reloadStatus.finished_at_epoch_secs && (
                    <span className="ml-auto text-[var(--color-muted-foreground)]">
                      {formatEpoch(reloadStatus.finished_at_epoch_secs)}
                    </span>
                  )}
                </div>
                {reloadStatus.error && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[var(--color-destructive)]">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {reloadStatus.error}
                  </p>
                )}
                {reloadStatus.warnings && reloadStatus.warnings.length > 0 && (
                  <ul className="mt-1.5 list-inside list-disc text-[var(--color-warning)]">
                    {reloadStatus.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
                {reloadStatus.deferred_process_fields && reloadStatus.deferred_process_fields.length > 0 && (
                  <p className="mt-1.5 text-[var(--color-muted-foreground)]">
                    Deferred (process restart required): {reloadStatus.deferred_process_fields.join(", ")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editable sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {EDITABLE_CONFIG_SECTIONS.map((section) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono">{section}</span>
                  {dirty[section] && <Badge variant="warning">edited</Badge>}
                  {configEnvelope && configEnvelope.data[section] === undefined && !dirty[section] && (
                    <Badge variant="outline">absent</Badge>
                  )}
                </CardTitle>
                <CardDescription>{SECTION_DESCRIPTIONS[section]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <textarea
                  value={sectionText[section] ?? ""}
                  onChange={(e) => handleTextChange(section, e.target.value)}
                  disabled={readOnly}
                  spellCheck={false}
                  rows={8}
                  className="w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-[var(--color-foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                />
                {sectionParseError[section] && (
                  <p className="text-xs text-[var(--color-destructive)]">
                    {sectionParseError[section]}
                  </p>
                )}
                {saveError[section] && (
                  <p className="text-xs text-[var(--color-destructive)]">{saveError[section]}</p>
                )}
                {saveMessage[section] && (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                    <CheckCircle2 className="h-3 w-3" />
                    {saveMessage[section]}
                  </p>
                )}
                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!dirty[section]}
                      onClick={() => resetSection(section)}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!dirty[section] || !!sectionParseError[section]}
                      loading={saving === section}
                      onClick={() => saveSection(section)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save section
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
