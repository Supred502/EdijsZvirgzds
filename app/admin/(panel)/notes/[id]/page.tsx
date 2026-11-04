import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { folderOptions } from "@/lib/tree";
import type { Note } from "@/lib/types";
import { NoteForm } from "../NoteForm";

async function EditNote({ params }: PageProps<"/admin/notes/[id]">) {
  const supabase = await requireUser();
  const { id } = await params;
  const [{ data: note }, { data: folders }] = await Promise.all([
    supabase.from("notes").select("*").eq("id", id).maybeSingle(),
    supabase.from("folders").select("*"),
  ]);
  if (!note) notFound();

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Edit: {note.name}</h1>
      <NoteForm note={note as Note} id={note.id} folders={folderOptions(folders ?? [])} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page(props: PageProps<"/admin/notes/[id]">) {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <EditNote {...props} />
    </Suspense>
  );
}
