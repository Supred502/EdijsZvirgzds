import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { folderOptions } from "@/lib/tree";
import type { Project } from "@/lib/types";
import { ProjectForm } from "../ProjectForm";

async function EditProject({ params }: PageProps<"/admin/projects/[id]">) {
  const supabase = await requireUser();
  const { id } = await params;
  const [{ data }, { data: folders }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("folders").select("*"),
  ]);
  if (!data) notFound();

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Edit: {data.title}</h1>
      <ProjectForm project={data as Project} id={data.id} folders={folderOptions(folders ?? [])} />
    </>
  );
}

// Suspense lives in each page (not the shared layout) so client navigations between admin pages show it too
export default function Page(props: PageProps<"/admin/projects/[id]">) {
  return (
    <Suspense fallback={<p className="text-text-dim">Loading…</p>}>
      <EditProject {...props} />
    </Suspense>
  );
}
