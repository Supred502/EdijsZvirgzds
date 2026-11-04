import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import Markdown from "react-markdown";
import { Cover } from "@/components/Cover";
import { Gallery } from "@/components/Gallery";
import { GitHubCard } from "@/components/GitHubCard";
import { getProject, getProjects } from "@/lib/data";
import { getRepo, getRepoFiles } from "@/lib/github";
import { RepoFiles } from "@/components/RepoFiles";

export async function generateStaticParams() {
  const projects = await getProjects();
  // shortcut: Cache Components needs at least one param at build time; "_" just 404s. Fine as is.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  const description = project.tagline ?? undefined;
  const images = [project.cover_url ?? "/opengraph-image"]; // no cover → the site-wide picture
  return { title: project.title, description, openGraph: { siteName: "Edijs Zvirgzds", title: project.title, description, images } };
}

export default function ProjectPage(props: PageProps<"/projects/[slug]">) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="slide-down" default="none">
          <div className="mx-auto mt-6 h-[60vh] max-w-4xl animate-pulse rounded-card bg-surface" />
        </ViewTransition>
      }
    >
      {/* slides in from the right when opened from a card, fades up on a direct visit */}
      <ViewTransition
        enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "slide-up" }}
        exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        default="none"
      >
        <ProjectDetails params={props.params} />
      </ViewTransition>
    </Suspense>
  );
}

async function ProjectDetails({ params }: Pick<PageProps<"/projects/[slug]">, "params">) {
  const project = await getProject((await params).slug);
  if (!project) notFound();
  const [repo, files] = project.repo_url ? await Promise.all([getRepo(project.repo_url), getRepoFiles(project.repo_url)]) : [null, []];

  return (
    <article className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
      <ViewTransition name={`cover-${project.id}`} share="morph" default="none">
        <div className="relative aspect-[16/9] overflow-hidden rounded-card border border-line bg-surface">
          <Cover project={project} sizes="(min-width: 896px) 896px, 100vw" priority big />
        </div>
      </ViewTransition>

      <header className="mt-8 flex flex-col gap-4">
        <ViewTransition name={`title-${project.id}`} share="morph" default="none">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{project.title}</h1>
        </ViewTransition>
        {project.tagline && <p className="text-lg text-text-dim">{project.tagline}</p>}
        {project.tech.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <li key={t} className="rounded-md border border-line bg-surface px-2 py-0.5 text-sm text-text-dim">{t}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Open
            </a>
          )}
          {project.repo_url && !repo && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="btn btn-lg">
              GitHub
            </a>
          )}
        </div>
        {repo && <GitHubCard repo={repo} />}
      </header>

      {project.repo_url && files.length > 0 && <RepoFiles files={files} repoUrl={project.repo_url} />}

      {project.body && (
        <div className="md mt-10 max-w-[70ch]">
          <Markdown>{project.body}</Markdown>
        </div>
      )}

      {project.gallery.length > 0 && (
        <section aria-label="Gallery" className="mt-12">
          <Gallery images={project.gallery} title={project.title} />
        </section>
      )}
    </article>
  );
}
