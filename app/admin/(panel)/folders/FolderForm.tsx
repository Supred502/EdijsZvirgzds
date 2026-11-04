"use client";

import { startTransition, useActionState, useState } from "react";
import { EMBLEMS } from "@/components/emblems";
import { FolderIcon } from "@/components/FolderIcon";
import { ICON_NAMES } from "@/lib/folder-input";
import { slugify } from "@/lib/project-input";
import type { Folder } from "@/lib/types";
import { saveFolder } from "../../actions";
import { DeleteButton } from "../DeleteButton";

// KDE-like folder colours
const SWATCHES = ["#ff4f9a", "#ff2d6f", "#da4453", "#f7941d", "#fdbc4b", "#9bc53d", "#2ecc71", "#1abc9c", "#3daee9", "#2980b9", "#9b59b6", "#7f8c8d", "#2e2e2e"];

export function FolderForm({ folder, id, parents }: { folder: Folder | null; id: string; parents: { id: string; label: string }[] }) {
  const [state, action, saving] = useActionState(saveFolder, null);
  const [name, setName] = useState(folder?.name ?? "");
  const [slug, setSlug] = useState(folder?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(folder));
  const [color, setColor] = useState(folder?.color ?? "#ff4f9a");
  const [icon, setIcon] = useState(folder?.icon ?? "");
  const [locked, setLocked] = useState(folder?.locked ?? false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="id" value={id} />

      <div className="flex items-center gap-5 rounded-xl bg-surface p-4">
        <FolderIcon color={color} icon={icon} locked={locked} className="w-24 shrink-0" />
        <div>
          <p className="font-display text-lg font-bold">{name || "New folder"}</p>
          <p className="text-sm text-text-dim">Preview</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Name (shown as is, e.g. 3D_Projects)
          <input
            name="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            className="input"
          />
        </label>
        <label className="field">
          Web name (in the address)
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value);
            }}
            className="input"
          />
        </label>
        <label className="field">
          Inside
          <select name="parent_id" defaultValue={folder?.parent_id ?? ""} className="input">
            <option value="">Documents (top level)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Order (lower comes first)
          <input name="sort_order" type="number" defaultValue={folder?.sort_order ?? 0} className="input" />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-text-dim">Colour</legend>
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={`size-7 rounded-full border-2 ${color === c ? "border-white" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
          <label className="flex items-center gap-2 text-sm text-text-dim">
            <input type="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-8 cursor-pointer rounded bg-transparent" />
            Custom
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-text-dim">Icon on the folder</legend>
        <input type="hidden" name="icon" value={icon} />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setIcon("")} aria-pressed={icon === ""} className={`btn btn-lg ${icon === "" ? "btn-on" : ""}`}>
            None
          </button>
          {ICON_NAMES.map((n) => {
            const Emblem = EMBLEMS[n];
            return (
              <button key={n} type="button" onClick={() => setIcon(n)} aria-pressed={icon === n} aria-label={n} title={n} className={`btn size-9 p-0 ${icon === n ? "btn-on" : ""}`}>
                <Emblem size={18} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="locked" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="size-4 accent-accent" />
        Locked (visitors see the folder, but not what&apos;s inside)
      </label>

      {state?.error && <p role="alert" className="whitespace-pre-line text-sm text-red-400">{state.error}</p>}

      <div className="flex gap-3">
        <button disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save"}</button>
        <a href="/admin" className="btn">Cancel</a>
        {folder && <span className="ml-auto"><DeleteButton id={folder.id} title={folder.name} kind="folder" /></span>}
      </div>
    </form>
  );
}
