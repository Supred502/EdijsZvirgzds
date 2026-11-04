"use client";

import Image from "next/image";
import { startTransition, useActionState, useState } from "react";
import { SOCIALS } from "@/lib/profile-input";
import type { Profile } from "@/lib/types";
import { saveProfile } from "../../actions";
import { DropZone, uploadFile } from "../upload";

const SOCIAL_LABELS: Record<(typeof SOCIALS)[number], string> = {
  github: "GitHub URL",
  linkedin: "LinkedIn URL",
  email: "Email",
  website: "Other website URL",
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, saving] = useActionState(saveProfile, null);
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [cv, setCv] = useState(profile.cv_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // shortcut: replaced avatars/CVs stay in Storage; they're small, clean up by hand if ever needed.
  async function upload(files: FileList, kind: "avatar" | "cv") {
    setUploadError("");
    setUploading(true);
    try {
      const url = await uploadFile(files[0], "profile", kind === "cv" ? "pdf" : "image");
      if (kind === "cv") setCv(url);
      else setAvatar(url);
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
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="avatar_url" value={avatar} />
      <input type="hidden" name="cv_url" value={cv} />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Name
          <input name="name" defaultValue={profile.name ?? ""} className="input" />
        </label>
        <label className="field">
          Headline (one line under your name)
          <input name="headline" defaultValue={profile.headline ?? ""} maxLength={160} placeholder="Developer who builds…" className="input" />
        </label>
      </div>

      <p className="text-sm text-text-dim">Your longer &ldquo;about me&rdquo; text is the Aboutme.md document in Folders &amp; documents.</p>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-2 text-sm text-text-dim">Links (leave empty to hide)</legend>
        {SOCIALS.map((key) => (
          <label key={key} className="field">
            {SOCIAL_LABELS[key]}
            <input name={key} type={key === "email" ? "email" : "url"} defaultValue={profile.socials[key] ?? ""} className="input" />
          </label>
        ))}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm text-text-dim">Photo</legend>
          <DropZone onFiles={(f) => upload(f, "avatar")} label={avatar ? "Replace photo" : "Upload photo"} disabled={uploading}>
            {avatar && <Image src={avatar} alt="Your photo" width={96} height={96} className="size-24 rounded-full object-cover" />}
          </DropZone>
          {avatar && <button type="button" onClick={() => setAvatar("")} className="btn self-start">Remove photo</button>}
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm text-text-dim">CV (PDF)</legend>
          <DropZone onFiles={(f) => upload(f, "cv")} label={cv ? "Replace CV" : "Upload CV"} accept="application/pdf" disabled={uploading}>
            {cv && <a href={cv} target="_blank" rel="noopener noreferrer" className="text-accent underline" onClick={(e) => e.stopPropagation()}>Current CV</a>}
          </DropZone>
          {cv && <button type="button" onClick={() => setCv("")} className="btn self-start">Remove CV</button>}
        </fieldset>
      </div>
      {uploading && <p className="text-sm text-text-dim">Uploading…</p>}
      {uploadError && <p role="alert" className="text-sm text-red-400">{uploadError}</p>}

      {state?.error && <p role="alert" className="whitespace-pre-line text-sm text-red-400">{state.error}</p>}
      {state && !state.error && !saving && <p role="status" className="text-sm text-accent">Saved. The site is updated.</p>}

      <div>
        <button disabled={saving || uploading} className="btn btn-primary">{saving ? "Saving…" : "Save profile"}</button>
      </div>
    </form>
  );
}
