"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

// The current path. Vercel prerenders the home page as "/index", which made the server and browser disagree.
export function usePath() {
  const p = usePathname();
  return p === "/index" ? "/" : p;
}

// Which item is selected (single click), remembered per page so it clears when you move on.
type Selection = { path: string; key: string } | null;
let current: Selection = null;
const listeners = new Set<() => void>();

export function select(path: string, key: string | null) {
  current = key ? { path, key } : null;
  listeners.forEach((l) => l());
}

export function useSelected(pathname: string): string | null {
  const s = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => current,
    () => null,
  );
  return s?.path === pathname ? s.key : null;
}
