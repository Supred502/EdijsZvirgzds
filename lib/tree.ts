import type { Folder, Note, Project } from "./types.ts";

// The public "file system": folders, notes (without their text) and projects, as the site sees them.
// Pure helpers so they can run on server and client and be unit tested.

export type NoteMeta = Omit<Note, "body">;
export type ProjectMeta = Pick<
  Project,
  "id" | "slug" | "title" | "tagline" | "cover_url" | "tech" | "folder_id" | "sort_order" | "started_on" | "created_at" | "updated_at" | "featured" | "locked" | "repo_url" | "live_url"
>;
export type Tree = { folders: Folder[]; notes: NoteMeta[]; projects: ProjectMeta[] };

export type Item = ({ kind: "folder" } & Folder) | ({ kind: "note" } & NoteMeta) | ({ kind: "project" } & ProjectMeta);

export const keyOf = (i: Item) => `${i.kind}:${i.id}`;
export const nameOf = (i: Item) => (i.kind === "project" ? i.title : i.name);
const parentOf = (i: Item) => (i.kind === "folder" ? i.parent_id : i.folder_id);

export function allItems(t: Tree): Item[] {
  return [
    ...t.folders.map((f) => ({ kind: "folder" as const, ...f })),
    ...t.notes.map((n) => ({ kind: "note" as const, ...n })),
    ...t.projects.map((p) => ({ kind: "project" as const, ...p })),
  ];
}

// What's directly inside a folder (null = Documents): folders first, then notes, then projects
export function contents(t: Tree, folderId: string | null): Item[] {
  const rank = { folder: 0, note: 1, project: 2 };
  return allItems(t)
    .filter((i) => parentOf(i) === folderId)
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.sort_order - b.sort_order || nameOf(a).localeCompare(nameOf(b)));
}

// Folders from the top down to this one (empty for Documents)
export function folderPath(folders: Pick<Folder, "id" | "parent_id">[], id: string | null) {
  const path: typeof folders = [];
  const seen = new Set<string>();
  for (let f = folders.find((x) => x.id === id); f && !seen.has(f.id); f = folders.find((x) => x.id === f!.parent_id)) {
    seen.add(f.id);
    path.unshift(f);
  }
  return path;
}

export function folderHref(t: Tree, id: string | null) {
  return id ? `/f/${(folderPath(t.folders, id) as Folder[]).map((f) => f.slug).join("/")}` : "/";
}

// Where an item opens; null for locked projects (no page)
export function hrefOf(t: Tree, i: Item): string | null {
  if (i.kind === "folder") return folderHref(t, i.id);
  if (i.kind === "note") return `${i.folder_id ? folderHref(t, i.folder_id) : "/f"}/${i.slug}`;
  return i.locked ? null : `/projects/${i.slug}`;
}

// /f/code/pc → that folder; /f/about-me/aboutme-md → that note
export function resolvePath(t: Tree, segments: string[]): { folder: Folder | null; note?: NoteMeta } | null {
  let folder: Folder | null = null;
  for (const [i, seg] of segments.entries()) {
    const next = t.folders.find((f) => f.parent_id === (folder?.id ?? null) && f.slug === seg);
    if (next) {
      folder = next;
      continue;
    }
    const note = i === segments.length - 1 ? t.notes.find((n) => n.folder_id === (folder?.id ?? null) && n.slug === seg) : undefined;
    return note ? { folder, note } : null;
  }
  return folder ? { folder } : null;
}

// Every id below a folder (used to stop a folder being moved inside itself)
export function descendantIds(folders: Pick<Folder, "id" | "parent_id">[], id: string) {
  const out = new Set<string>();
  const walk = (pid: string) => folders.filter((f) => f.parent_id === pid && !out.has(f.id)).forEach((f) => (out.add(f.id), walk(f.id)));
  walk(id);
  return out;
}

// Everything somewhere inside a folder, newest change first
export function latest(t: Tree, folderId: string | null): Item[] {
  const inside = folderId ? descendantIds(t.folders, folderId) : null;
  return allItems(t)
    .filter((i) => i.id !== folderId && (!inside || (parentOf(i) !== null && (parentOf(i) === folderId || inside.has(parentOf(i)!)))))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

// Folder choices for admin dropdowns: "Code / PC", in tree order
export function folderOptions(folders: Folder[]) {
  const out: { id: string; label: string }[] = [];
  const walk = (pid: string | null, prefix: string) =>
    folders
      .filter((f) => f.parent_id === pid)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .forEach((f) => {
        out.push({ id: f.id, label: prefix + f.name });
        walk(f.id, `${prefix}${f.name} / `);
      });
  walk(null, "");
  return out;
}

export function typeOf(i: Item) {
  if (i.kind === "folder") return i.locked ? "Locked folder" : "Folder";
  if (i.kind === "note") return "Document";
  return i.locked ? "Private project" : "Project";
}

// Dates in UTC so server and browser print the same thing
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
