"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { UserPlus, Search } from "lucide-react";
import { Topbar, RefreshButton } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserTable } from "@/components/users/user-table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
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

  const refresh = useCallback(() => mutateUsers(), [mutateUsers]);

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
              />
            )}
          </CardContent>
        </Card>
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
    </>
  );
}