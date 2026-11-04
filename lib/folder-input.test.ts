import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFolderForm, parseNoteForm } from "./folder-input.ts";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};
const id = "3f1e1841-a2fa-4f01-a101-41032d11a1c6";

test("folder form", () => {
  const r = parseFolderForm(form({ id, parent_id: "", name: " 3D_Projects ", slug: "3d-projects", color: "#FF4F9A", icon: "box", locked: "on" }));
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.deepEqual(r.data, { id, parent_id: null, name: "3D_Projects", slug: "3d-projects", color: "#ff4f9a", icon: "box", locked: true, sort_order: 0 });
  assert.equal(parseFolderForm(form({ id, name: "x", slug: "x", color: "red", icon: "" })).success, false);
  assert.equal(parseFolderForm(form({ id, name: "x", slug: "x", color: "#000000", icon: "evil" })).success, false);
  assert.equal(parseFolderForm(form({ id, name: "x", slug: "x", color: "#000000", icon: "", parent_id: "nope" })).success, false);
});

test("note form", () => {
  const r = parseNoteForm(form({ id, folder_id: id, name: "Aboutme.md", slug: "aboutme-md", body: "# Hi" }));
  assert.ok(r.success);
  assert.equal(r.data.folder_id, id);
  assert.equal(parseNoteForm(form({ id, name: "", slug: "a", body: "" })).success, false);
});
