import { z } from "zod";

// Validates the admin project form. Pure (no Next/Supabase imports) so it can be unit tested.

const empty = z.literal("").transform(() => null);
const text = (max: number) => z.string().trim().max(max).transform((s) => s || null);

export function projectSchema(storagePrefix: string) {
  // Images must live in our own bucket (also keeps next/image happy)
  const image = z.string().startsWith(storagePrefix, "Images must be uploaded here");
  return z.object({
    id: z.uuid(),
    title: z.string().trim().min(1, "Title is required").max(120),
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes only"),
    tagline: text(200),
    body: text(50_000),
    cover_url: z.union([empty, image]),
    gallery: z.array(image).max(30),
    tech: z.array(z.string().trim().min(1).max(40)).max(20),
    folder_id: z.union([empty, z.uuid()]),
    locked: z.boolean(),
    repo_url: z.union([empty, z.url({ protocol: /^https?$/ })]),
    live_url: z.union([empty, z.url({ protocol: /^https?$/ })]),
    featured: z.boolean(),
    published: z.boolean(),
    sort_order: z.coerce.number().int(),
    started_on: z.union([empty, z.iso.date()]),
  });
}

export function parseProjectForm(form: FormData, storagePrefix: string) {
  const str = (k: string) => String(form.get(k) ?? "");
  return projectSchema(storagePrefix).safeParse({
    id: str("id"),
    title: str("title"),
    slug: str("slug"),
    tagline: str("tagline"),
    body: str("body"),
    cover_url: str("cover_url"),
    gallery: form.getAll("gallery").map(String),
    folder_id: str("folder_id"),
    locked: form.get("locked") === "on",
    tech: str("tech").split(",").map((t) => t.trim()).filter(Boolean),
    repo_url: str("repo_url").trim(),
    live_url: str("live_url").trim(),
    featured: form.get("featured") === "on",
    published: form.get("published") === "on",
    sort_order: str("sort_order") || 0,
    started_on: str("started_on"),
  });
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // ā → a, š → s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
