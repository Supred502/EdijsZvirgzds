import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { folderOptions } from "@/lib/tree";
import { FolderForm } from "../FolderForm";

async function NewFolder() {
  const supabase = await requireUser();
  const { data } = await supabase.from("folders").select("*");
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">New folder</h1>
      <FolderForm folder={null} id={randomUUID()} parents={folderOptions(data ?? [])} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page() {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <NewFolder />
    </Suspense>
  );
}
