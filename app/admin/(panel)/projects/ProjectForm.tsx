"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import Markdown from "react-markdown";
import { slugify } from "@/lib/project-input";
import type { Project } from "@/lib/types";
import { importFromGitHub, saveProject } from "../../actions";
import { DropZone, uploadFile } from "../upload";

export function ProjectForm({ project, id, folders }: { project: Project | null; id: string; folders: { id: string; label: string }[] }) {
  const [state, action, saving] = useActionState(saveProject, null);
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(project));
  const [cover, setCover] = useState(project?.cover_url ?? "");
  const [gallery, setGallery] = useState<string[]>(project?.gallery ?? []);
  const [body, setBody] = useState(project?.body ?? "");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Fills the form from a GitHub repo; everything stays editable before saving
  async function runImport() {
    setImporting(true);
    setImportError("");
    const res = await importFromGitHub(importUrl);
    setImporting(false);
    if ("error" in res) return setImportError(res.error);
    const set = (name: string, value: string) => {
      const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = value;
    };
    set("title", res.title);
    set("tagline", res.tagline);
    set("tech", res.tech.join(", "));
    set("repo_url", res.repo_url);
    set("live_url", res.live_url);
    if (!slugEdited) setSlug(slugify(res.title));
  }

  // shortcut: removed or abandoned images stay in Storage until the project is deleted; add cleanup if space gets tight.
  async function addImages(files: FileList | File[], target: "cover" | "gallery") {
    setUploadError("");
    setUploading(true);
    try {
      const list = target === "cover" ? [...files].slice(0, 1) : [...files];
      const urls = await Promise.all(list.map((f) => uploadFile(f, `projects/${id}`)));
      if (target === "cover") setCover(urls[0] ?? cover);
      else setGallery((g) => [...g, ...urls]);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      // Submit manually so React doesn't clear the form when the server sends back an error
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      ref={formRef}
      className="flex flex-col gap-5"
    >
      {!project && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
          <label htmlFor="import-url" className="text-sm text-text-dim">Import from GitHub (fills the form, you can edit after)</label>
          <div className="flex gap-2">
            <input
              id="import-url"
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runImport())}
              placeholder="https://github.com/you/repo"
              className="input"
            />
            <button type="button" onClick={runImport} disabled={importing || !importUrl} className="btn shrink-0">
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
          {importError && <p role="alert" className="text-sm text-red-400">{importError}</p>}
        </div>
      )}

      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="cover_url" value={cover} />
      {/* order is set by dragging in the project list */}
      <input type="hidden" name="sort_order" value={project?.sort_order ?? 0} />
      {gallery.map((url) => (
        <input key={url} type="hidden" name="gallery" value={url} />
      ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Title
          <input
            name="title"
            required
            defaultValue={project?.title}
            onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
            className="input"
          />
        </label>
        <label className="field">
          Slug (web address: /projects/<b>{slug || "…"}</b>)
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
      </div>

      <label className="field">
        Tagline (one line on the card)
        <input name="tagline" defaultValue={project?.tagline ?? ""} maxLength={200} className="input" />
      </label>

      <label className="field">
        Folder
        <select name="folder_id" defaultValue={project?.folder_id ?? ""} className="input">
          <option value="">Documents (top level)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        Tech (comma separated)
        <input name="tech" defaultValue={project?.tech.join(", ")} placeholder="Next.js, Supabase, Tailwind" className="input" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          GitHub repo URL
          <input name="repo_url" type="url" defaultValue={project?.repo_url ?? ""} placeholder="https://github.com/…" className="input" />
        </label>
        <label className="field">
          Live / download URL
          <input name="live_url" type="url" defaultValue={project?.live_url ?? ""} className="input" />
        </label>
        <label className="field">
          Started on
          <input name="started_on" type="date" defaultValue={project?.started_on ?? ""} className="input" />
        </label>
      </div>

      {/* Cover */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-text-dim">Cover image</legend>
        <DropZone onFiles={(f) => addImages(f, "cover")} label={cover ? "Replace cover" : "Upload cover"} disabled={uploading}>
          {cover && (
            <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-xl bg-surface-2">
              <Image src={cover} alt="Cover preview" fill sizes="448px" className="object-cover" />
            </div>
          )}
        </DropZone>
        {cover && (
          <button type="button" onClick={() => setCover("")} className="btn self-start">Remove cover</button>
        )}
      </fieldset>

      {/* Gallery */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-text-dim">Gallery</legend>
        {gallery.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((url) => (
              <li key={url} className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
                <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setGallery((g) => g.filter((u) => u !== url))}
                  className="absolute right-1 top-1 rounded-md bg-bg/80 px-2 py-0.5 text-sm hover:text-accent"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <DropZone onFiles={(f) => addImages(f, "gallery")} label="Add images" multiple disabled={uploading} />
      </fieldset>
      {uploading && <p className="text-sm text-text-dim">Uploading…</p>}
      {uploadError && <p role="alert" className="text-sm text-red-400">{uploadError}</p>}

      {/* Write-up */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-dim">Write-up (Markdown)</span>
          <button type="button" onClick={() => setPreview((p) => !p)} className="btn">{preview ? "Edit" : "Preview"}</button>
        </div>
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} hidden={preview} className="input font-mono text-sm" />
        {preview && <div className="md min-h-40 rounded-xl bg-surface p-4"><Markdown>{body || "*Nothing yet*"}</Markdown></div>}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={project?.published} className="size-4 accent-accent" />
          Published (visible on the site)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={project?.featured} className="size-4 accent-accent" />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="locked" defaultChecked={project?.locked} className="size-4 accent-accent" />
          Locked (shows with a lock; write-up, links and gallery stay private)
        </label>
      </div>

      {state?.error && <p role="alert" className="whitespace-pre-line text-sm text-red-400">{state.error}</p>}

      <div className="flex gap-3">
        <button disabled={saving || uploading} className="btn btn-primary">{saving ? "Saving…" : "Save"}</button>
        <a href="/admin" className="btn">Cancel</a>
      </div>
    </form>
  );
}
