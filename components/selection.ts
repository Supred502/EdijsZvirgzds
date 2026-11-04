"use client";

import { useSyncExternalStore } from "react";

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
