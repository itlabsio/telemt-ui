"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { browserApi } from "@/lib/api/browser";
import type { UserInfo } from "@/types/api";

interface DeleteUserDialogProps {
  open: boolean;
  user: UserInfo | null;
  onClose: () => void;
  onDeleted: () => void;
  currentRevision?: string;
}

export function DeleteUserDialog({
  open,
  user,
  onClose,
  onDeleted,
  currentRevision,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!user) return null;

  async function handleDelete() {
    setLoading(true);
    setApiError(null);
    try {
      await browserApi.deleteUser(user!.username, currentRevision);
      onDeleted();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete User"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-destructive)]/25 bg-[var(--color-destructive)]/8 px-4 py-3 text-sm text-[var(--color-destructive)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>
              Delete user <strong className="font-mono">{user.username}</strong>?
            </p>
            {user.current_connections > 0 && (
              <p className="mt-1 text-xs opacity-80">
                This user has {user.current_connections} active connection(s).
                They will be terminated.
              </p>
            )}
          </div>
        </div>

        {apiError && (
          <p className="rounded-md bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]">
            {apiError}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" loading={loading} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}