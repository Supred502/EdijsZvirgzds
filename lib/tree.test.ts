import assert from "node:assert/strict";
import { test } from "node:test";
import { contents, descendantIds, folderOptions, hrefOf, latest, resolvePath, type Tree } from "./tree.ts";

const f = (id: string, parent_id: string | null, name: string, extra = {}) => ({
  id, parent_id, name, slug: name.toLowerCase(), color: "#ff4f9a", icon: "", locked: false, sort_order: 0, created_at: "2026-01-01", updated_at: "2026-01-01", ...extra,
});
const tree: Tree = {
  folders: [f("code", null, "Code"), f("pc", "code", "PC", { updated_at: "2026-03-01" }), f("about", null, "About")],
  notes: [{ id: "n1", folder_id: "about", name: "Aboutme.md", slug: "aboutme-md", sort_order: 0, created_at: "2026-01-01", updated_at: "2026-02-01" }],
  projects: [
    { id: "p1", slug: "anime", title: "Anime", tagline: null, cover_url: null, tech: [], folder_id: "pc", sort_order: 0, started_on: null, created_at: "2026-01-01", updated_at: "2026-04-01", featured: true, locked: false, repo_url: null, live_url: null },
    { id: "p2", slug: "secret", title: "Secret", tagline: null, cover_url: null, tech: [], folder_id: "pc", sort_order: 1, started_on: null, created_at: "2026-01-01", updated_at: "2026-01-01", featured: false, locked: true, repo_url: null, live_url: null },
  ],
};

test("resolves folder and note paths", () => {
  assert.equal(resolvePath(tree, ["code", "pc"])?.folder?.id, "pc");
  assert.equal(resolvePath(tree, ["about", "aboutme-md"])?.note?.id, "n1");
  assert.equal(resolvePath(tree, ["code", "nope"]), null);
  assert.equal(resolvePath(tree, ["about", "aboutme-md", "x"]), null);
});

test("links", () => {
  const items = contents(tree, "pc");
  assert.deepEqual(items.map((i) => hrefOf(tree, i)), ["/projects/anime", null]); // locked project has no page
  assert.equal(hrefOf(tree, contents(tree, "about")[0]), "/f/about/aboutme-md");
  assert.equal(hrefOf(tree, contents(tree, "code")[0]), "/f/code/pc");
});

test("tree helpers", () => {
  assert.deepEqual([...descendantIds(tree.folders, "code")], ["pc"]);
  assert.deepEqual(latest(tree, "code").map((i) => i.id), ["p1", "pc", "p2"]);
  assert.deepEqual(folderOptions(tree.folders).map((o) => o.label), ["About", "Code", "Code / PC"]);
  assert.deepEqual(contents(tree, null).map((i) => i.id), ["about", "code"]);
});
