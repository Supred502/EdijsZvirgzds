import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { folderOptions } from "@/lib/tree";
import { NoteForm } from "../NoteForm";

async function NewNote() {
  const supabase = await requireUser();
  const { data } = await supabase.from("folders").select("*");
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">New document</h1>
      <NoteForm note={null} id={randomUUID()} folders={folderOptions(data ?? [])} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page() {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <NewNote />
    </Suspense>
  );
}
