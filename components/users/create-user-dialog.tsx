"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { browserApi } from "@/lib/api/browser";
import type { CreateUserResponse } from "@/types/api";
import { Copy, CheckCircle2 } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentRevision?: string;
}

interface FormState {
  username: string;
  secret: string;
  user_ad_tag: string;
  max_tcp_conns: string;
  max_unique_ips: string;
  expiration_rfc3339: string;
  data_quota_bytes: string;
}

const INITIAL: FormState = {
  username: "",
  secret: "",
  user_ad_tag: "",
  max_tcp_conns: "",
  max_unique_ips: "",
  expiration_rfc3339: "",
  data_quota_bytes: "",
};

export function CreateUserDialog({
  open,
  onClose,
  onCreated,
  currentRevision,
}: CreateUserDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((e2) => ({ ...e2, [key]: undefined }));
      },
      error: errors[key],
    };
  }

  function validate(): boolean {
    const next: Partial<FormState> = {};
    if (!form.username.trim()) {
      next.username = "Username is required";
    } else if (!/^[A-Za-z0-9_.\-]{1,64}$/.test(form.username)) {
      next.username = "Only A-Z a-z 0-9 _ . - allowed, max 64 chars";
    }
    if (form.secret && !/^[0-9a-fA-F]{32}$/.test(form.secret)) {
      next.secret = "Must be exactly 32 hex characters";
    }
    if (form.user_ad_tag && !/^[0-9a-fA-F]{32}$/.test(form.user_ad_tag)) {
      next.user_ad_tag = "Must be exactly 32 hex characters";
    }
    if (form.max_tcp_conns && (isNaN(Number(form.max_tcp_conns)) || Number(form.max_tcp_conns) < 0)) {
      next.max_tcp_conns = "Must be a non-negative integer";
    }
    if (form.max_unique_ips && (isNaN(Number(form.max_unique_ips)) || Number(form.max_unique_ips) < 0)) {
      next.max_unique_ips = "Must be a non-negative integer";
    }
    if (form.data_quota_bytes && (isNaN(Number(form.data_quota_bytes)) || Number(form.data_quota_bytes) < 0)) {
      next.data_quota_bytes = "Must be a non-negative integer";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await browserApi.createUser(
        {
          username: form.username.trim(),
          ...(form.secret ? { secret: form.secret } : {}),
          ...(form.user_ad_tag ? { user_ad_tag: form.user_ad_tag } : {}),
          ...(form.max_tcp_conns ? { max_tcp_conns: Number(form.max_tcp_conns) } : {}),
          ...(form.max_unique_ips ? { max_unique_ips: Number(form.max_unique_ips) } : {}),
          ...(form.data_quota_bytes ? { data_quota_bytes: Number(form.data_quota_bytes) } : {}),
          ...(form.expiration_rfc3339 ? { expiration_rfc3339: form.expiration_rfc3339 } : {}),
        },
        currentRevision
      );
      setCreated(res.data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (created) onCreated();
    setForm(INITIAL);
    setErrors({});
    setApiError(null);
    setCreated(null);
    setCopied(false);
    onClose();
  }

  function copySecret() {
    if (created) {
      navigator.clipboard.writeText(created.secret).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create User"
      description="Add a new proxy user. Secret is generated automatically if not provided."
    >
      {created ? (
        // Success state — show generated secret prominently.
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/25 bg-[var(--color-success)]/8 px-4 py-3 text-sm text-[var(--color-success)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              User <strong>{created.user.username}</strong> created successfully.
            </span>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-muted-foreground)]">
              Secret — copy it now, it will not be shown again.
            </p>
            <div className="flex items-center gap-2 rounded-md bg-[var(--color-secondary)] px-3 py-2">
              <span className="flex-1 font-mono text-sm text-[var(--color-foreground)] break-all">
                {created.secret}
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
          <div className="flex flex-wrap gap-2">
            {created.user.links.tls.map((l, i) => (
              <Badge key={i} variant="default">TLS link available</Badge>
            ))}
            {created.user.links.secure.map((l, i) => (
              <Badge key={i} variant="secondary">Secure link available</Badge>
            ))}
          </div>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username *"
            placeholder="alice"
            autoFocus
            {...field("username")}
          />
          <Input
            id="secret"
            label="Secret (32 hex chars)"
            placeholder="Leave empty to auto-generate"
            {...field("secret")}
          />
          <Input
            id="user_ad_tag"
            label="Ad tag (32 hex chars)"
            placeholder="Optional"
            {...field("user_ad_tag")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="max_tcp_conns"
              label="Max TCP connections"
              type="number"
              min={0}
              placeholder="Unlimited"
              {...field("max_tcp_conns")}
            />
            <Input
              id="max_unique_ips"
              label="Max unique IPs"
              type="number"
              min={0}
              placeholder="Unlimited"
              {...field("max_unique_ips")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="data_quota_bytes"
              label="Data quota (bytes)"
              type="number"
              min={0}
              placeholder="Unlimited"
              {...field("data_quota_bytes")}
            />
            <Input
              id="expiration_rfc3339"
              label="Expiry date"
              type="datetime-local"
              {...field("expiration_rfc3339")}
            />
          </div>

          {apiError && (
            <p className="rounded-md bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]">
              {apiError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}