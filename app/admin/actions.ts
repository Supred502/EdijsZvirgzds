"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/github";
import { parseFolderForm, parseNoteForm } from "@/lib/folder-input";
import { parseProfileForm } from "@/lib/profile-input";
import { parseProjectForm } from "@/lib/project-input";
import { createClient } from "@/lib/supabase/server";
import { descendantIds } from "@/lib/tree";

export type FormState = { error: string } | null;

const MEDIA_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Wrong email or password." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveProject(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const parsed = parseProjectForm(form, MEDIA_PREFIX);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") };

  const { error } = await supabase.from("projects").upsert(parsed.data);
  if (error) return { error: error.code === "23505" ? "Another project already uses this slug." : error.message };

  updateTag("projects");
  redirect("/admin");
}

const flagInput = z.object({ id: z.uuid(), field: z.enum(["published", "featured"]), value: z.boolean() });

export async function setFlag(id: string, field: "published" | "featured", value: boolean) {
  const supabase = await requireUser();
  const input = flagInput.parse({ id, field, value });
  const { error } = await supabase.from("projects").update({ [input.field]: input.value }).eq("id", input.id);
  if (error) throw error;
  updateTag("projects");
}

export async function deleteProject(id: string) {
  const supabase = await requireUser();
  z.uuid().parse(id);

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;

  // Then remove its uploaded images (they all live in projects/<id>/); the row is gone, so leftovers are harmless
  const folder = `projects/${id}`;
  const { data: files } = await supabase.storage.from("media").list(folder, { limit: 1000 });
  if (files?.length) await supabase.storage.from("media").remove(files.map((f) => `${folder}/${f.name}`));
  updateTag("projects");
}

export async function reorderProjects(ids: string[]) {
  const supabase = await requireUser();
  const list = z.array(z.uuid()).max(500).parse(ids);
  // shortcut: one update per project; fine for a portfolio-sized list
  const results = await Promise.all(list.map((id, i) => supabase.from("projects").update({ sort_order: i }).eq("id", id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  updateTag("projects");
}

type ImportResult = { error: string } | { title: string; tagline: string; tech: string[]; repo_url: string; live_url: string };

export async function importFromGitHub(url: string): Promise<ImportResult> {
  await requireUser();
  const repo = await getRepo(String(url));
  if (!repo) return { error: "Couldn't load that repo. Check the link and that the repo is public." };
  const name = repo.fullName.split("/")[1];
  return {
    title: name.replace(/[_-]+/g, " ").trim(),
    tagline: repo.description ?? "",
    tech: repo.language ? [repo.language] : [],
    repo_url: repo.url,
    live_url: repo.homepage ?? "",
  };
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const parsed = parseProfileForm(form, MEDIA_PREFIX);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") };

  const { error } = await supabase.from("profile").update(parsed.data).eq("id", 1);
  if (error) return { error: error.message };
  updateTag("profile");
  return { error: "" }; // empty error = saved
}

// Folders and documents share URLs (/f/code/<slug>), so a name must be free in the other table too
async function nameTaken(supabase: Awaited<ReturnType<typeof requireUser>>, table: "folders" | "notes", parent: string | null, slug: string) {
  const col = table === "folders" ? "parent_id" : "folder_id";
  const q = supabase.from(table).select("id").eq("slug", slug);
  const { data } = await (parent ? q.eq(col, parent) : q.is(col, null)).limit(1);
  return !!data?.length;
}
const TAKEN = "That folder already has something with this web name.";

const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");

export async function saveFolder(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const parsed = parseFolderForm(form);
  if (!parsed.success) return { error: issues(parsed.error) };
  const folder = parsed.data;

  if (folder.parent_id) {
    const { data: all, error } = await supabase.from("folders").select("id, parent_id");
    if (error) return { error: error.message };
    if (folder.parent_id === folder.id || descendantIds(all, folder.id).has(folder.parent_id)) return { error: "A folder can't go inside itself." };
  }

  if (await nameTaken(supabase, "notes", folder.parent_id, folder.slug)) return { error: TAKEN };
  const { error } = await supabase.from("folders").upsert(folder);
  if (error) return { error: error.code === "23505" ? TAKEN : error.message };
  updateTag("projects");
  redirect("/admin");
}

// Only empty folders can be deleted (the database refuses otherwise), so nothing is lost by accident
export async function deleteFolder(id: string): Promise<FormState> {
  const supabase = await requireUser();
  z.uuid().parse(id);
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) return { error: error.code === "23503" ? "This folder isn't empty. Move or delete what's inside first." : error.message };
  updateTag("projects");
  redirect("/admin");
}

export async function saveNote(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const parsed = parseNoteForm(form);
  if (!parsed.success) return { error: issues(parsed.error) };
  if (await nameTaken(supabase, "folders", parsed.data.folder_id, parsed.data.slug)) return { error: TAKEN };
  const { error } = await supabase.from("notes").upsert(parsed.data);
  if (error) return { error: error.code === "23505" ? TAKEN : error.message };
  updateTag("projects");
  redirect("/admin");
}

export async function deleteNote(id: string): Promise<FormState> {
  const supabase = await requireUser();
  z.uuid().parse(id);
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  updateTag("projects");
  redirect("/admin");
}
