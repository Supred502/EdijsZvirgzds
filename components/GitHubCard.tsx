import type { Repo } from "@/lib/github";

const updated = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function GitHubCard({ repo }: { repo: Repo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-card border border-surface-2 bg-surface p-5 transition hover:border-accent/60"
    >
      <span className="flex items-center gap-2 font-medium">
        <GitHubIcon />
        <span className="group-hover:text-accent">{repo.fullName}</span>
      </span>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-dim">
        <Stat label="Stars" value={`★ ${repo.stars}`} />
        <Stat label="Forks" value={`⑂ ${repo.forks}`} />
        {repo.language && <Stat label="Language" value={repo.language} />}
        <Stat label="Last update" value={updated(repo.pushedAt)} />
      </dl>
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function GitHubIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}
