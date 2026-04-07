// Formatting utilities for display values used across dashboard components.

// Formats uptime seconds into a human-readable string (e.g. "3d 2h 15m").
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Formats a byte count into a compact human-readable string (e.g. "1.2 GB").
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Formats a Unix epoch seconds timestamp as a locale date-time string.
export function formatEpoch(epochSecs: number): string {
  return new Date(epochSecs * 1000).toLocaleString();
}

// Formats a percentage value to one decimal place with a % suffix.
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Formats a latency value in milliseconds to one decimal place.
export function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "—";
  return `${ms.toFixed(1)} ms`;
}

// Formats a large integer with locale-aware thousand separators.
// Treats null/undefined as 0 to guard against backend fields that may be
// absent even though the TypeScript type marks them as required.
export function formatNum(n: number | null | undefined): string {
  if (n == null) return "0";
  return n.toLocaleString();
}