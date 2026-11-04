import { cacheLife } from "next/cache";
import { parseRepoUrl } from "@/lib/repo-url";

export type Repo = {
  fullName: string;
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string;
};

// Never throws: if GitHub is down or rate-limited the page just hides the card.
export async function getRepo(url: string): Promise<Repo | null> {
  "use cache";
  const name = parseRepoUrl(url);
  if (!name) {
    cacheLife("hours");
    return null;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${name}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const r = await res.json();
    cacheLife("hours");
    return {
      fullName: r.full_name,
      url: r.html_url,
      description: r.description,
      homepage: r.homepage || null,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      topics: r.topics ?? [],
      pushedAt: r.pushed_at,
    };
  } catch (e) {
    console.warn(`getRepo(${name}) failed:`, e);
    cacheLife("minutes"); // retry soon instead of hiding the card for an hour
    return null;
  }
}

export type RepoEntry = { name: string; dir: boolean; url: string };

// Names of the files and folders at the top of a repo (no file contents). Never throws: [] on failure.
export async function getRepoFiles(url: string): Promise<RepoEntry[]> {
  "use cache";
  const name = parseRepoUrl(url);
  if (!name) {
    cacheLife("hours");
    return [];
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${name}/contents`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const list: { name: string; type: string; html_url: string }[] = await res.json();
    cacheLife("hours");
    return list
      .map((e) => ({ name: e.name, dir: e.type === "dir", url: e.html_url }))
      .sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
  } catch (e) {
    console.warn(`getRepoFiles(${name}) failed:`, e);
    cacheLife("minutes");
    return [];
  }
}

// Repo listings for the hover peek, keyed by project id
export async function repoFilesFor(projects: { id: string; repo_url: string | null }[]): Promise<Record<string, RepoEntry[]>> {
  const withRepo = projects.filter((p) => p.repo_url);
  return Object.fromEntries(await Promise.all(withRepo.map(async (p) => [p.id, await getRepoFiles(p.repo_url!)])));
}
