"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createBrowserApi } from "@/lib/api/browser";
import type { UserInfo } from "@/types/api";

export type UserAction = "disable" | "reset-quota";

interface UserActionDialogProps {
  open: boolean;
  action: UserAction | null;
  user: UserInfo | null;
  onClose: () => void;
  onDone: () => void;
  currentRevision?: string;
  serverIndex?: number;
}

const COPY: Record<UserAction, { title: string; message: (u: UserInfo) => string; confirmLabel: string }> = {
  disable: {
    title: "Disable User",
    message: (u) =>
      `Disable ${u.username}? Active sessions for this user will be closed immediately and no new connections will be admitted until re-enabled.`,
    confirmLabel: "Disable",
  },
  "reset-quota": {
    title: "Reset Quota",
    message: (u) => `Reset the runtime data quota counter for ${u.username} back to 0?`,
    confirmLabel: "Reset Quota",
  },
};

export function UserActionDialog({
  open,
  action,
  user,
  onClose,
  onDone,
  currentRevision,
  serverIndex = 0,
}: UserActionDialogProps) {
  const api = createBrowserApi(serverIndex);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!user || !action) return null;
  const copy = COPY[action];

  async function handleConfirm() {
    setLoading(true);
    setApiError(null);
    try {
      if (action === "disable") {
        await api.disableUser(user!.username, currentRevision);
      } else if (action === "reset-quota") {
        await api.resetUserQuota(user!.username, currentRevision);
      }
      onDone();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={copy.title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{copy.message(user)}</p>
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
          <Button variant="destructive" className="flex-1" loading={loading} onClick={handleConfirm}>
            {copy.confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
