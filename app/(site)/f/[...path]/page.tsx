import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import Markdown from "react-markdown";
import { DocIcon, FolderIcon } from "@/components/FolderIcon";
import { FolderView } from "@/components/FolderView";
import { Slide } from "@/components/Slide";
import { getNote, getTree } from "@/lib/data";
import { repoFilesFor } from "@/lib/github";
import { contents, folderHref, formatDate, plural, resolvePath } from "@/lib/tree";

// /f/code/pc → a folder, /f/about-me/aboutme-md → a document

export async function generateStaticParams() {
  const tree = await getTree();
  const paths = [
    ...tree.folders.map((f) => folderHref(tree, f.id).split("/").slice(2)),
    ...tree.notes.map((n) => [...(n.folder_id ? folderHref(tree, n.folder_id).split("/").slice(2) : []), n.slug]),
  ];
  // shortcut: Cache Components needs at least one param at build time; "_" just 404s.
  return paths.length ? paths.map((path) => ({ path })) : [{ path: ["_"] }];
}

export async function generateMetadata({ params }: PageProps<"/f/[...path]">): Promise<Metadata> {
  const r = resolvePath(await getTree(), (await params).path);
  const name = r?.note?.name ?? r?.folder?.name;
  return name ? { title: name } : {};
}

export default function Page(props: PageProps<"/f/[...path]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-10 h-64 max-w-5xl animate-pulse rounded-card bg-surface" />}>
      <Slide>
        <Contents params={props.params} />
      </Slide>
    </Suspense>
  );
}

async function Contents({ params }: Pick<PageProps<"/f/[...path]">, "params">) {
  const tree = await getTree();
  const r = resolvePath(tree, (await params).path);
  if (!r) notFound();
  if (r.note) return <Document id={r.note.id} />;
  const folder = r.folder!;
  const items = contents(tree, folder.id);
  const repos = await repoFilesFor(items.flatMap((i) => (i.kind === "project" ? [i] : [])));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <header className="flex items-center gap-4 py-8">
        <ViewTransition name={`folder-${folder.id}`} share="morph" default="none">
          <span className="block w-14 shrink-0">
            <FolderIcon color={folder.color} icon={folder.icon} locked={folder.locked} className="w-full" />
          </span>
        </ViewTransition>
        <div>
          <h1 className="font-display text-3xl font-bold">{folder.name}</h1>
          <p className="text-sm text-text-dim">{folder.locked ? "Locked" : plural(items.length, "item")}</p>
        </div>
      </header>
      {folder.locked ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-text-dim">
          <Lock size={32} aria-hidden="true" />
          <p>This folder is private for now.</p>
        </div>
      ) : (
        <FolderView tree={tree} items={items} repos={repos} empty="This folder is empty." />
      )}
    </div>
  );
}

async function Document({ id }: { id: string }) {
  const note = await getNote(id);
  if (!note) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <header className="flex items-center gap-4 border-b border-line py-8">
        <DocIcon className="h-14 w-auto shrink-0" />
        <div>
          <h1 className="font-display text-3xl font-bold">{note.name}</h1>
          <p className="text-sm text-text-dim">Modified {formatDate(note.updated_at)}</p>
        </div>
      </header>
      {note.body ? (
        <div className="md mt-8 max-w-[70ch]">
          <Markdown>{note.body}</Markdown>
        </div>
      ) : (
        <p className="mt-8 text-text-dim">This document is empty.</p>
      )}
    </article>
  );
}
