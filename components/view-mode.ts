"use client";

import { useSyncExternalStore } from "react";

// Icons vs details view, shared by the path bar toggle and the file lists, remembered in localStorage.
type Mode = "grid" | "list";
let memory: Mode = "grid"; // used when storage is blocked (private windows)
const listeners = new Set<() => void>();

function read(): Mode {
  try {
    return localStorage.getItem("view-mode") === "list" ? "list" : "grid";
  } catch {
    return memory;
  }
}

export function setViewMode(mode: Mode) {
  memory = mode;
  try {
    localStorage.setItem("view-mode", mode);
  } catch {}
  listeners.forEach((l) => l());
}

export function useViewMode(): Mode {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    read,
    () => "grid",
  );
}
