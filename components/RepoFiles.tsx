import { FileText } from "lucide-react";
import { FolderIcon } from "@/components/FolderIcon";
import type { RepoEntry } from "@/lib/github";

// The top level of a project's GitHub repo, names only; each opens on GitHub
export function RepoFiles({ files, repoUrl }: { files: RepoEntry[]; repoUrl: string }) {
  return (
    <section aria-labelledby="repo-files" className="mt-10">
      <h2 id="repo-files" className="mb-3 flex items-center gap-3 text-sm text-text-dim">
        In the repository
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-accent">
          Open on GitHub
        </a>
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1">
        {files.map((f) => (
          <li key={f.name}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-text-dim transition-colors hover:bg-surface hover:text-text"
            >
              {f.dir ? <FolderIcon color="#6b7a8c" className="w-5 shrink-0" /> : <FileText size={18} className="shrink-0" aria-hidden="true" />}
              <span className="truncate">{f.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
