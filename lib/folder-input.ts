import { z } from "zod";

// Validates the admin folder and note forms. Pure, so it can be unit tested.

// Emblems a folder can show (drawn by components/emblems.tsx)
export const ICON_NAMES = [
  "code", "terminal", "globe", "smartphone", "monitor", "coffee", "watch", "brain", "shapes", "user", "graduation-cap",
  "briefcase", "box", "image", "camera", "gamepad", "book", "pen", "palette", "heart", "star", "rocket", "settings",
  "puzzle", "film", "wrench", "cpu", "cloud",
] as const;

const parent = z.union([z.literal("").transform(() => null), z.uuid()]);
const slug = z.string().trim().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Web name: lowercase letters, numbers and dashes only");

export const folderSchema = z.object({
  id: z.uuid(),
  parent_id: parent,
  name: z.string().trim().min(1, "Name is required").max(60),
  slug,
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a colour").transform((c) => c.toLowerCase()),
  icon: z.union([z.literal(""), z.enum(ICON_NAMES)]),
  locked: z.boolean(),
  sort_order: z.coerce.number().int(),
});

export const noteSchema = z.object({
  id: z.uuid(),
  folder_id: parent,
  name: z.string().trim().min(1, "Name is required").max(80),
  slug,
  body: z.string().max(50_000),
  sort_order: z.coerce.number().int(),
});

const str = (form: FormData, k: string) => String(form.get(k) ?? "");

export const parseFolderForm = (form: FormData) =>
  folderSchema.safeParse({
    id: str(form, "id"),
    parent_id: str(form, "parent_id"),
    name: str(form, "name"),
    slug: str(form, "slug"),
    color: str(form, "color"),
    icon: str(form, "icon"),
    locked: form.get("locked") === "on",
    sort_order: str(form, "sort_order") || 0,
  });

export const parseNoteForm = (form: FormData) =>
  noteSchema.safeParse({
    id: str(form, "id"),
    folder_id: str(form, "folder_id"),
    name: str(form, "name"),
    slug: str(form, "slug"),
    body: str(form, "body"),
    sort_order: str(form, "sort_order") || 0,
  });
