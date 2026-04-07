"use client";

// Hook that reads/writes the active backend server index from the URL
// search parameter ?srv=<n>.
// Using the URL keeps the selection shareable and SSR-friendly.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export const SERVER_PARAM = "srv";

export function useServerIndex(): [number, (index: number) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get(SERVER_PARAM);
  const serverIndex = raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0;

  const setServerIndex = useCallback(
    (index: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (index === 0) {
        params.delete(SERVER_PARAM);
      } else {
        params.set(SERVER_PARAM, String(index));
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [router, pathname, searchParams]
  );

  return [serverIndex, setServerIndex];
}