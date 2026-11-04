"use client";

import { startTransition, useActionState, useState } from "react";
import Markdown from "react-markdown";
import { slugify } from "@/lib/project-input";
import type { Note } from "@/lib/types";
import { saveNote } from "../../actions";
import { DeleteButton } from "../DeleteButton";

export function NoteForm({ note, id, folders }: { note: Note | null; id: string; folders: { id: string; label: string }[] }) {
  const [state, action, saving] = useActionState(saveNote, null);
  const [slug, setSlug] = useState(note?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(note));
  const [body, setBody] = useState(note?.body ?? "");
  const [preview, setPreview] = useState(false);

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
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Name (e.g. Aboutme.md)
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={note?.name}
            onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
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
          <select name="folder_id" defaultValue={note?.folder_id ?? ""} className="input">
            <option value="">Documents (top level)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Order (lower comes first)
          <input name="sort_order" type="number" defaultValue={note?.sort_order ?? 0} className="input" />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">Text (Markdown)</span>
          <button type="button" onClick={() => setPreview((p) => !p)} className="btn">{preview ? "Edit" : "Preview"}</button>
        </div>
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={18} hidden={preview} className="input font-mono text-sm" />
        {preview && <div className="md min-h-40 rounded-xl bg-surface p-4"><Markdown>{body || "*Nothing yet*"}</Markdown></div>}
      </div>

      {state?.error && <p role="alert" className="whitespace-pre-line text-sm text-red-400">{state.error}</p>}

      <div className="flex gap-3">
        <button disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save"}</button>
        <a href="/admin" className="btn">Cancel</a>
        {note && <span className="ml-auto"><DeleteButton id={note.id} title={note.name} kind="note" /></span>}
      </div>
    </form>
  );
}
