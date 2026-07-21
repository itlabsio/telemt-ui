"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { UserPlus, Search, Wifi } from "lucide-react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserTable } from "@/components/users/user-table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { RotateSecretDialog } from "@/components/users/rotate-secret-dialog";
import { UserActionDialog, type UserAction } from "@/components/users/user-action-dialog";
import { createBrowserApi } from "@/lib/api/browser";
import { useServerIndex } from "@/lib/use-server-index";
import type { UserInfo, HealthData } from "@/types/api";

const POLL_INTERVAL = 10_000;

export default function UsersClient() {
  const [serverIndex] = useServerIndex();
  const api = createBrowserApi(serverIndex);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserInfo | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserInfo | null>(null);
  const [rotateSecretUser, setRotateSecretUser] = useState<UserInfo | null>(null);
  const [actionState, setActionState] = useState<{ action: UserAction; user: UserInfo } | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);

  const {
    data: usersEnvelope,
    error: usersError,
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useSWR([serverIndex, "/v1/users"], () => api.listUsers(), {
    refreshInterval: POLL_INTERVAL,
  });

  const {
    data: healthEnvelope,
  } = useSWR([serverIndex, "/v1/health"], () => api.health(), {
    refreshInterval: POLL_INTERVAL,
  });

  const { data: activeIpsEnvelope, mutate: mutateActiveIps } = useSWR(
    [serverIndex, "/v1/stats/users/active-ips"],
    () => api.usersActiveIps(),
    { refreshInterval: POLL_INTERVAL }
  );

  const refresh = useCallback(() => {
    mutateUsers();
    mutateActiveIps();
  }, [mutateUsers, mutateActiveIps]);

  async function handleEnable(user: UserInfo) {
    setEnableError(null);
    try {
      await api.enableUser(user.username, revision);
      refresh();
    } catch (err) {
      setEnableError(err instanceof Error ? err.message : "Failed to enable user");
    }
  }

  const users = usersEnvelope?.data ?? [];
  const revision = usersEnvelope?.revision;
  const health = healthEnvelope?.data as HealthData | undefined;
  const readOnly = health?.read_only ?? false;

  const filtered = search.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(search.trim().toLowerCase()))
    : users;

  const activeConnections = users.reduce((sum, u) => sum + u.current_connections, 0);

  return (
    <>
      <Topbar
        title="Users"
        description={`${users.length} configured · ${activeConnections} active connections`}
        actions={
          <>
            {readOnly && <Badge variant="warning">Read-only</Badge>}
            <RefreshButton onClick={refresh} loading={usersLoading} />
            {!readOnly && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Add user
              </Button>
            )}
          </>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Filter users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {usersError ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[var(--color-destructive)]">
                  {usersError instanceof Error ? usersError.message : "Failed to load users"}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
                  Retry
                </Button>
              </div>
            ) : usersLoading && users.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[var(--color-muted-foreground)]">Loading…</p>
              </div>
            ) : (
              <UserTable
                users={filtered}
                readOnly={readOnly}
                onEdit={setEditUser}
                onDelete={setDeleteUser}
                onEnable={handleEnable}
                onDisable={(user) => setActionState({ action: "disable", user })}
                onRotateSecret={setRotateSecretUser}
                onResetQuota={(user) => setActionState({ action: "reset-quota", user })}
              />
            )}
            {enableError && (
              <p className="border-t border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-destructive)]">
                {enableError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active source IPs across all users */}
        {activeIpsEnvelope && activeIpsEnvelope.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Active Source IPs
                <span className="ml-auto text-xs font-normal text-[var(--color-muted-foreground)]">
                  {activeIpsEnvelope.data.length} user(s) with active connections
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {activeIpsEnvelope.data.map((row) => (
                  <div key={row.username} className="flex items-start gap-3 text-sm">
                    <span className="w-32 shrink-0 truncate font-mono text-[var(--color-foreground)]">
                      {row.username}
                    </span>
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {row.active_ips.map((ip) => (
                        <span
                          key={ip}
                          className="rounded bg-[var(--color-secondary)]/50 px-2 py-0.5 font-mono text-xs text-[var(--color-muted-foreground)]"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
        currentRevision={revision}
        serverIndex={serverIndex}
      />

      <EditUserDialog
        open={editUser !== null}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={refresh}
        currentRevision={revision}
        serverIndex={serverIndex}
      />

      <DeleteUserDialog
        open={deleteUser !== null}
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onDeleted={refresh}
        currentRevision={revision}
        serverIndex={serverIndex}
      />

      <RotateSecretDialog
        open={rotateSecretUser !== null}
        user={rotateSecretUser}
        onClose={() => setRotateSecretUser(null)}
        onRotated={refresh}
        currentRevision={revision}
        serverIndex={serverIndex}
      />

      <UserActionDialog
        open={actionState !== null}
        action={actionState?.action ?? null}
        user={actionState?.user ?? null}
        onClose={() => setActionState(null)}
        onDone={refresh}
        currentRevision={revision}
        serverIndex={serverIndex}
      />
    </>
  );
}