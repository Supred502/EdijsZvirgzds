import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DocIcon, FolderIcon } from "@/components/FolderIcon";
import type { Folder, Note, Project } from "@/lib/types";
import { ProjectList } from "./ProjectList";

async function AdminProjects() {
  const supabase = await requireUser();
  const [{ data, error }, folders, notes] = await Promise.all([
    supabase.from("projects").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("folders").select("*").order("sort_order").order("name"),
    supabase.from("notes").select("id, folder_id, name, sort_order").order("sort_order").order("name"),
  ]);
  for (const e of [error, folders.error, notes.error]) if (e) throw e;
  const projects = data as Project[];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Folders &amp; documents</h1>
        <div className="flex gap-2">
          <Link href="/admin/notes/new" className="btn">New document</Link>
          <Link href="/admin/folders/new" className="btn btn-primary">New folder</Link>
        </div>
      </div>
      <FileTree folders={folders.data as Folder[]} notes={notes.data as Pick<Note, "id" | "folder_id" | "name">[]} projects={projects} />

      <div className="mb-6 mt-12 flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">Projects</h2>
        <Link href="/admin/projects/new" className="btn btn-primary">New project</Link>
      </div>

      {projects.length === 0 && <p className="text-text-dim">No projects yet.</p>}

      {/* key: remount with fresh rows after a toggle or delete re-renders this page */}
      <ProjectList key={projects.map((p) => `${p.id}${p.published}${p.featured}`).join()} projects={projects} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page() {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <AdminProjects />
    </Suspense>
  );
}

// Folders as an indented tree with their documents; projects are only counted here (edited below)
function FileTree({ folders, notes, projects }: { folders: Folder[]; notes: Pick<Note, "id" | "folder_id" | "name">[]; projects: Project[] }) {
  const row = "flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface";
  const level = (parent: string | null, depth: number): React.ReactNode => (
    <>
      {folders
        .filter((f) => f.parent_id === parent)
        .map((f) => {
          const count = projects.filter((p) => p.folder_id === f.id).length;
          return (
            <li key={f.id}>
              <Link href={`/admin/folders/${f.id}`} className={row} style={{ paddingLeft: 8 + depth * 22 }}>
                <FolderIcon color={f.color} icon={f.icon} locked={f.locked} className="w-7 shrink-0" />
                <span>{f.name}</span>
                <span className="text-xs text-text-dim">{[f.locked && "locked", count && `${count} project${count === 1 ? "" : "s"}`].filter(Boolean).join(", ")}</span>
              </Link>
              <ul>{level(f.id, depth + 1)}</ul>
            </li>
          );
        })}
      {notes
        .filter((n) => n.folder_id === parent)
        .map((n) => (
          <li key={n.id}>
            <Link href={`/admin/notes/${n.id}`} className={row} style={{ paddingLeft: 8 + depth * 22 }}>
              <span className="flex w-7 shrink-0 justify-center"><DocIcon className="h-6 w-auto" /></span>
              <span>{n.name}</span>
            </Link>
          </li>
        ))}
    </>
  );
  if (!folders.length && !notes.length) return <p className="text-text-dim">No folders yet.</p>;
  return <ul className="rounded-xl bg-surface/50 p-2">{level(null, 0)}</ul>;
}
