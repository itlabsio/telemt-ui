"use client";

import { Fragment, useState } from "react";
import {
  Copy,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Wifi,
} from "lucide-react";
import type { UserInfo } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { formatBytes, formatNum } from "@/lib/fmt";

interface UserTableProps {
  users: UserInfo[];
  readOnly: boolean;
  onEdit: (user: UserInfo) => void;
  onDelete: (user: UserInfo) => void;
}

export function UserTable({ users, readOnly, onEdit, onDelete }: UserTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(username: string) {
    setExpanded((prev) => (prev === username ? null : username));
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => undefined);
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
        <Wifi className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-sm">No users configured</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6" />
          <TableHead>Username</TableHead>
          <TableHead>Connections</TableHead>
          <TableHead>Active IPs</TableHead>
          <TableHead>Traffic</TableHead>
          <TableHead>Limits</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <Fragment key={user.username}>
            <TableRow
              className="cursor-pointer"
              onClick={() => toggle(user.username)}
            >
              {/* Expand toggle */}
              <TableCell className="pl-4">
                {expanded === user.username ? (
                  <ChevronUp className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                )}
              </TableCell>

              <TableCell>
                <span className="font-mono text-sm font-medium text-[var(--color-foreground)]">
                  {user.username}
                </span>
              </TableCell>

              <TableCell>
                <span className="tabular-nums text-sm">
                  {formatNum(user.current_connections)}
                </span>
                {user.max_tcp_conns !== undefined && (
                  <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">
                    / {formatNum(user.max_tcp_conns)}
                  </span>
                )}
              </TableCell>

              <TableCell>
                <span className="tabular-nums text-sm">{user.active_unique_ips}</span>
                {user.max_unique_ips !== undefined && (
                  <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">
                    / {user.max_unique_ips}
                  </span>
                )}
              </TableCell>

              <TableCell className="tabular-nums text-sm">
                {formatBytes(user.total_octets)}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.data_quota_bytes !== undefined && (
                    <Badge variant="outline">
                      {formatBytes(user.data_quota_bytes)} quota
                    </Badge>
                  )}
                  {user.user_ad_tag && <Badge variant="secondary">ad-tag</Badge>}
                </div>
              </TableCell>

              <TableCell className="text-xs text-[var(--color-muted-foreground)]">
                {user.expiration_rfc3339
                  ? new Date(user.expiration_rfc3339).toLocaleDateString()
                  : "—"}
              </TableCell>

              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  {!readOnly && (
                    <>
                      <Tooltip content="Edit user">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete user">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(user)}
                          className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>

            {/* Expanded detail row */}
            {expanded === user.username && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="bg-[var(--color-secondary)]/30 px-6 py-4">
                  <div className="space-y-4">
                    {/* Proxy links */}
                    {(user.links.tls.length > 0 ||
                      user.links.secure.length > 0 ||
                      user.links.classic.length > 0) && (
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-foreground)]">
                            <LinkIcon className="h-3 w-3" />
                            Proxy links
                          </p>
                          <div className="space-y-1">
                            {[
                              ...user.links.tls.map((l) => ({ mode: "TLS", link: l })),
                              ...user.links.secure.map((l) => ({ mode: "Secure", link: l })),
                              ...user.links.classic.map((l) => ({ mode: "Classic", link: l })),
                            ].map(({ mode, link }, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 rounded-md bg-[var(--color-background)] px-3 py-1.5"
                              >
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {mode}
                                </Badge>
                                <span className="flex-1 truncate font-mono text-xs text-[var(--color-muted-foreground)]">
                                  {link}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => copyText(link)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Active IPs */}
                    {user.active_unique_ips_list.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-[var(--color-foreground)]">
                          Active source IPs ({user.active_unique_ips_list.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.active_unique_ips_list.map((ip) => (
                            <span
                              key={ip}
                              className="rounded bg-[var(--color-background)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted-foreground)]"
                            >
                              {ip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ad tag */}
                    {user.user_ad_tag && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-muted-foreground)]">Ad tag:</span>
                        <span className="font-mono text-xs text-[var(--color-foreground)]">
                          {user.user_ad_tag}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyText(user.user_ad_tag!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}