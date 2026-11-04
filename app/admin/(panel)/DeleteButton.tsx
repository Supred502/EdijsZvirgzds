"use client";

import { useTransition } from "react";
import { deleteFolder, deleteNote, deleteProject, type FormState } from "../actions";

const ACTIONS = { project: deleteProject, folder: deleteFolder, note: deleteNote };
const WARN = { project: " and its images", folder: "", note: "" };

export function DeleteButton({ id, title, kind = "project" }: { id: string; title: string; kind?: keyof typeof ACTIONS }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-danger w-20"
      onClick={() => {
        if (!confirm(`Delete "${title}"${WARN[kind]}? This can't be undone.`)) return;
        start(async () => {
          const res = (await ACTIONS[kind](id)) as FormState | undefined;
          if (res?.error) alert(res.error);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
