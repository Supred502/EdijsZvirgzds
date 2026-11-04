import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "@/lib/supabase/public";
import type { Tree } from "@/lib/tree";
import type { Note, Profile, Project } from "@/lib/types";

// Cached for hours; the admin clears the "projects"/"profile" tags on save so changes show at once.
// Row level security decides what visitors get (drafts, locked items and locked folders' contents never arrive).

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfile(): Promise<Profile | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("profile");
  const { data, error } = await supabase.from("profile").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

// All folders, notes (without text) and projects: the site's whole "file system"
export async function getTree(): Promise<Tree> {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const [folders, notes, projects, locked] = await Promise.all([
    supabase.from("folders").select("*"),
    supabase.from("notes").select("id, folder_id, name, slug, sort_order, created_at, updated_at"),
    supabase
      .from("projects")
      .select("id, slug, title, tagline, cover_url, tech, folder_id, sort_order, started_on, created_at, updated_at, featured, locked, repo_url, live_url")
      .eq("published", true),
    supabase.from("locked_projects").select("*"),
  ]);
  for (const r of [folders, notes, projects, locked]) if (r.error) throw r.error;
  return {
    folders: folders.data!,
    notes: notes.data!,
    projects: [...projects.data!, ...locked.data!.map((p) => ({ ...p, featured: false, locked: true, repo_url: null, live_url: null }))],
  };
}

export async function getNote(id: string): Promise<Note | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("projects");
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
