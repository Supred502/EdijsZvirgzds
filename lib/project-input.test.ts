import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProjectForm, slugify } from "./project-input.ts";

const prefix = "https://x.supabase.co/storage/v1/object/public/media/";

function form(fields: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const one of [v].flat()) f.append(k, one);
  return f;
}

const base = { id: "3f1e1841-a2fa-4f01-a101-41032d11a1c6", title: "My App", slug: "my-app" };

test("valid form becomes clean data", () => {
  const r = parseProjectForm(
    form({ ...base, tech: " React, , Next.js ", published: "on", gallery: [prefix + "a.png"], live_url: "", started_on: "" }),
    prefix,
  );
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.deepEqual(r.data.tech, ["React", "Next.js"]);
  assert.equal(r.data.published, true);
  assert.equal(r.data.featured, false);
  assert.equal(r.data.live_url, null);
  assert.equal(r.data.tagline, null);
  assert.equal(r.data.sort_order, 0);
  assert.equal(r.data.folder_id, null);
  assert.equal(r.data.locked, false);
});

test("rejects bad input", () => {
  assert.equal(parseProjectForm(form({ ...base, slug: "Bad Slug" }), prefix).success, false);
  assert.equal(parseProjectForm(form({ ...base, title: "  " }), prefix).success, false);
  assert.equal(parseProjectForm(form({ ...base, cover_url: "https://evil.com/x.png" }), prefix).success, false);
  assert.equal(parseProjectForm(form({ ...base, live_url: "javascript:alert(1)" }), prefix).success, false);
  assert.equal(parseProjectForm(form({ ...base, id: "nope" }), prefix).success, false);
  assert.equal(parseProjectForm(form({ ...base, folder_id: "not-a-uuid" }), prefix).success, false);
});

test("slugify", () => {
  assert.equal(slugify("Ēdijs's Anime Player!"), "edijs-s-anime-player");
});
