import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { descendantIds, folderOptions } from "@/lib/tree";
import type { Folder } from "@/lib/types";
import { FolderForm } from "../FolderForm";

async function EditFolder({ params }: PageProps<"/admin/folders/[id]">) {
  const supabase = await requireUser();
  const { id } = await params;
  const { data } = await supabase.from("folders").select("*");
  const all = (data ?? []) as Folder[];
  const folder = all.find((f) => f.id === id);
  if (!folder) notFound();
  // a folder can't be moved into itself or anything inside it
  const blocked = descendantIds(all, id).add(id);

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Edit folder: {folder.name}</h1>
      <FolderForm folder={folder} id={folder.id} parents={folderOptions(all).filter((o) => !blocked.has(o.id))} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page(props: PageProps<"/admin/folders/[id]">) {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <EditFolder {...props} />
    </Suspense>
  );
}
