import { Suspense } from "react";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { folderOptions } from "@/lib/tree";
import { ProjectForm } from "../ProjectForm";

async function NewProject() {
  const supabase = await requireUser();
  const { data: folders } = await supabase.from("folders").select("*");
  // id is made up front so images can be uploaded into projects/<id>/ before the first save
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">New project</h1>
      <ProjectForm project={null} id={randomUUID()} folders={folderOptions(folders ?? [])} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page() {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <NewProject />
    </Suspense>
  );
}
