"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBrowserApi } from "@/lib/api/browser";
import type { UserInfo } from "@/types/api";

interface EditUserDialogProps {
  open: boolean;
  user: UserInfo | null;
  onClose: () => void;
  onSaved: () => void;
  currentRevision?: string;
  serverIndex?: number;
}

interface FormState {
  secret: string;
  user_ad_tag: string;
  max_tcp_conns: string;
  max_unique_ips: string;
  expiration_rfc3339: string;
  data_quota_bytes: string;
}

function toFormState(user: UserInfo): FormState {
  return {
    secret: "",
    user_ad_tag: user.user_ad_tag ?? "",
    max_tcp_conns: user.max_tcp_conns !== undefined ? String(user.max_tcp_conns) : "",
    max_unique_ips: user.max_unique_ips !== undefined ? String(user.max_unique_ips) : "",
    expiration_rfc3339: user.expiration_rfc3339
      ? user.expiration_rfc3339.slice(0, 16)
      : "",
    data_quota_bytes: user.data_quota_bytes !== undefined ? String(user.data_quota_bytes) : "",
  };
}

export function EditUserDialog({
  open,
  user,
  onClose,
  onSaved,
  currentRevision,
  serverIndex = 0,
}: EditUserDialogProps) {
  const api = createBrowserApi(serverIndex);
  const [form, setForm] = useState<FormState>({
    secret: "",
    user_ad_tag: "",
    max_tcp_conns: "",
    max_unique_ips: "",
    expiration_rfc3339: "",
    data_quota_bytes: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm(toFormState(user));
  }, [user]);

  if (!user) return null;

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
    // user is guaranteed non-null here: the dialog is only rendered when user !== null
    // and the early return above catches the null case before JSX is produced.
    if (!user || !validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      await api.patchUser(
        user.username,
        {
          ...(form.secret ? { secret: form.secret } : {}),
          ...(form.user_ad_tag ? { user_ad_tag: form.user_ad_tag } : {}),
          ...(form.max_tcp_conns ? { max_tcp_conns: Number(form.max_tcp_conns) } : {}),
          ...(form.max_unique_ips ? { max_unique_ips: Number(form.max_unique_ips) } : {}),
          ...(form.data_quota_bytes ? { data_quota_bytes: Number(form.data_quota_bytes) } : {}),
          ...(form.expiration_rfc3339
            ? { expiration_rfc3339: new Date(form.expiration_rfc3339).toISOString() }
            : {}),
        },
        currentRevision
      );
      onSaved();
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
      title={`Edit user: ${user.username}`}
      description="Only provided fields will be updated."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-secret"
          label="New secret (32 hex chars)"
          placeholder="Leave empty to keep current"
          {...field("secret")}
        />
        <Input
          id="edit-user_ad_tag"
          label="Ad tag (32 hex chars)"
          placeholder="Optional"
          {...field("user_ad_tag")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="edit-max_tcp_conns"
            label="Max TCP connections"
            type="number"
            min={0}
            placeholder="Unlimited"
            {...field("max_tcp_conns")}
          />
          <Input
            id="edit-max_unique_ips"
            label="Max unique IPs"
            type="number"
            min={0}
            placeholder="Unlimited"
            {...field("max_unique_ips")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="edit-data_quota_bytes"
            label="Data quota (bytes)"
            type="number"
            min={0}
            placeholder="Unlimited"
            {...field("data_quota_bytes")}
          />
          <Input
            id="edit-expiration_rfc3339"
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
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}