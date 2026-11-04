import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProfileForm } from "./profile-input.ts";

const prefix = "https://x.supabase.co/storage/v1/object/public/media/";
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};

test("valid profile keeps only filled socials", () => {
  const r = parseProfileForm(form({ name: " Edijs ", github: "https://github.com/x", email: "me@x.com", linkedin: "" }), prefix);
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.equal(r.data.name, "Edijs");
  assert.deepEqual(r.data.socials, { github: "https://github.com/x", email: "me@x.com" });
  assert.equal(r.data.avatar_url, null);
});

test("rejects bad links and foreign files", () => {
  assert.equal(parseProfileForm(form({ github: "javascript:alert(1)" }), prefix).success, false);
  assert.equal(parseProfileForm(form({ email: "nope" }), prefix).success, false);
  assert.equal(parseProfileForm(form({ avatar_url: "https://evil.com/a.png" }), prefix).success, false);
});
