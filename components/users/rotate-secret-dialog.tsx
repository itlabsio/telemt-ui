"use client";

import { useState } from "react";
import { Copy, CheckCircle2, KeyRound } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createBrowserApi } from "@/lib/api/browser";
import type { UserInfo, CreateUserResponse } from "@/types/api";

interface RotateSecretDialogProps {
  open: boolean;
  user: UserInfo | null;
  onClose: () => void;
  onRotated: () => void;
  currentRevision?: string;
  serverIndex?: number;
}

export function RotateSecretDialog({
  open,
  user,
  onClose,
  onRotated,
  currentRevision,
  serverIndex = 0,
}: RotateSecretDialogProps) {
  const api = createBrowserApi(serverIndex);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  async function handleRotate() {
    setLoading(true);
    setApiError(null);
    try {
      const res = await api.rotateSecret(user!.username, undefined, currentRevision);
      setResult(res.data);
      onRotated();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (result) {
      navigator.clipboard.writeText(result.secret).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setResult(null);
    setApiError(null);
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Rotate Secret">
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/25 bg-[var(--color-success)]/8 px-4 py-3 text-sm text-[var(--color-success)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Secret rotated for <strong className="font-mono">{user.username}</strong>.
            </span>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-muted-foreground)]">
              New secret — copy it now, it will not be shown again. All existing proxy links for
              this user are now invalid.
            </p>
            <div className="flex items-center gap-2 rounded-md bg-[var(--color-secondary)] px-3 py-2">
              <span className="flex-1 font-mono text-sm text-[var(--color-foreground)] break-all">
                {result.secret}
              </span>
              <button
                onClick={copySecret}
                className="shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Generate a new secret for <strong className="font-mono">{user.username}</strong>?
              Every proxy link currently in use by this user will stop working immediately.
            </p>
          </div>

          {apiError && (
            <p className="rounded-md bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]">
              {apiError}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" loading={loading} onClick={handleRotate}>
              Rotate Secret
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
