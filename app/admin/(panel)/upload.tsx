import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // same limit as the storage bucket

// Uploads straight from the browser to Storage at <folder>/<random>.<ext>; storage rules allow only the owner.
export async function uploadFile(file: File, folder: string, accept: "image" | "pdf" = "image"): Promise<string> {
  const ok = accept === "pdf" ? file.type === "application/pdf" : file.type.startsWith("image/");
  if (!ok) throw new Error(`${file.name} is not ${accept === "pdf" ? "a PDF" : "an image"}.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 5 MB.`);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const storage = createClient().storage.from("media");
  const { error } = await storage.upload(path, file, { contentType: file.type });
  if (error) throw new Error(`${file.name}: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}

export function DropZone({
  onFiles,
  label,
  multiple = false,
  accept = "image/*",
  disabled,
  children,
}: {
  onFiles: (files: FileList) => void;
  label: string;
  multiple?: boolean;
  accept?: string;
  disabled: boolean;
  children?: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-5 text-sm text-text-dim transition ${
        over ? "border-accent bg-surface-2" : "border-surface-2 hover:border-text-dim"
      }`}
    >
      {children}
      <span>{label} — click or drop {multiple ? "files" : "a file"} here</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = ""; // allow picking the same file again
        }}
      />
    </label>
  );
}
