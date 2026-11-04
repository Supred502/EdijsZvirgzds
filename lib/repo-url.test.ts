// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRepoUrl } from "./repo-url.ts";

test("parseRepoUrl", () => {
  assert.equal(parseRepoUrl("https://github.com/Supred502/Anime_Player"), "Supred502/Anime_Player");
  assert.equal(parseRepoUrl("github.com/a/b.git"), "a/b");
  assert.equal(parseRepoUrl("https://www.github.com/a/b/tree/main?x=1"), "a/b");
  assert.equal(parseRepoUrl(" https://github.com/a/my.repo/ "), "a/my.repo");
  assert.equal(parseRepoUrl("https://gitlab.com/a/b"), null);
  assert.equal(parseRepoUrl("https://github.com/a"), null);
});
