"use client";

import { ChevronLeft, ChevronRight, House, LayoutGrid, List, Mail, PanelLeft, Settings, Search as SearchIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FolderIcon } from "@/components/FolderIcon";
import { ItemIcon } from "@/components/ItemIcon";
import { select, usePath, useSelected } from "@/components/selection";
import { setViewMode, useViewMode } from "@/components/view-mode";
import { createClient } from "@/lib/supabase/client";
import {
  allItems, contents, folderHref, folderPath, formatDate, hrefOf, type Item, keyOf, latest, nameOf, plural, resolvePath, type Tree, typeOf,
} from "@/lib/tree";

// The file-manager "window" around every public page: Places sidebar, path bar, status bar, info panel.
// Each part reads the URL, so the layout wraps each one in its own Suspense.

export type Me = { name: string; avatar: string | null };

const EASE = [0.22, 1, 0.36, 1] as const;
const noop = () => () => {};

// Where the visitor is, worked out from the URL
function useHere(tree: Tree) {
  const pathname = usePath();
  const [section, ...rest] = pathname.split("/").filter(Boolean);
  if (section === "f") {
    const r = resolvePath(tree, rest);
    return { pathname, folder: r?.folder ?? null, note: r?.note };
  }
  if (section === "projects") {
    const project = tree.projects.find((p) => p.slug === rest[0]);
    return { pathname, folder: tree.folders.find((f) => f.id === project?.folder_id) ?? null, project };
  }
  return { pathname, folder: null };
}

// The thing whose page this is (null = Documents)
function currentItem(here: ReturnType<typeof useHere>): Item | null {
  if (here.note) return { kind: "note", ...here.note };
  if ("project" in here && here.project) return { kind: "project", ...here.project };
  if (here.folder) return { kind: "folder", ...here.folder };
  return null;
}

/* ---------- Places sidebar ---------- */

export function Places({ tree, me }: { tree: Tree; me: Me }) {
  return <PlacesList tree={tree} me={me} id="side" />;
}

function PlacesList({ tree, me, id, onNavigate }: { tree: Tree; me: Me; id: string; onNavigate?: () => void }) {
  const here = useHere(tree);
  const inFolder = folderHref(tree, here.folder?.id ?? null); // the folder you're in (or the project/document's folder)
  const openIds = new Set(folderPath(tree.folders, here.folder?.id ?? null).map((f) => f.id));
  const pinned = tree.projects.filter((p) => p.featured && !p.locked);
  const recent = tree.folders
    .map((f) => ({ f, modified: [f.updated_at, latest(tree, f.id)[0]?.updated_at ?? ""].sort().at(-1)! }))
    .sort((a, b) => b.modified.localeCompare(a.modified))
    .slice(0, 5);

  // `section`: each sidebar section has its own pink highlight that slides between its items
  const item = (section: string, active: string, href: string, label: string, icon: React.ReactNode, depth = 0) => (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active === href ? "page" : undefined}
      style={{ paddingLeft: 10 + depth * 14 }}
      className={`relative flex items-center gap-2.5 rounded-md py-1.5 pr-2.5 text-sm transition-colors ${active === href ? "text-accent" : "text-text-dim hover:bg-surface hover:text-text"}`}
    >
      {active === href && (
        <motion.span layoutId={`${id}-${section}`} transition={{ duration: 0.35, ease: EASE }} className="absolute inset-0 rounded-md bg-accent/15" />
      )}
      <span className="relative flex w-4 justify-center">{icon}</span>
      <span className="relative flex-1 truncate">{label}</span>
    </Link>
  );
  const heading = (text: string) => <h2 className="px-2.5 pb-1.5 text-xs text-text-dim">{text}</h2>;

  // Folder tree; the folders above where you are fold open
  const folders = (parent: string | null, depth: number): React.ReactNode => {
    const list = contents(tree, parent).filter((i) => i.kind === "folder");
    if (list.length === 0) return null;
    return (
      <motion.ul
        initial={depth ? { height: 0, opacity: 0 } : false}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-0.5 overflow-hidden"
      >
        {list.map((f) => (
          <li key={f.id}>
            {item("tree", inFolder, folderHref(tree, f.id), f.name, <FolderIcon color={f.color} locked={f.locked} className="w-4" />, depth)}
            {openIds.has(f.id) && folders(f.id, depth + 1)}
          </li>
        ))}
      </motion.ul>
    );
  };

  return (
    <nav aria-label="Places" className="flex flex-col gap-6 p-3">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface">
        {me.avatar ? (
          <Image src={me.avatar} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-accent font-display font-bold text-on-accent">{me.name[0]}</span>
        )}
        <span className="truncate font-display font-medium">{me.name}</span>
      </Link>
      <div>
        {heading("Places")}
        <ul className="flex flex-col gap-0.5">
          <li>{item("places", here.pathname, "/", "Documents", <House size={16} />)}</li>
          <li>{item("places", here.pathname, "/#contact", "Contact", <Mail size={16} />)}</li>
        </ul>
      </div>
      {pinned.length > 0 && (
        <div>
          {heading("Pinned")}
          <ul className="flex flex-col gap-0.5">
            {pinned.map((p) => (
              <li key={p.id}>
                {item("pinned", here.pathname, `/projects/${p.slug}`, p.title, <span className="block w-4"><ItemIcon item={{ kind: "project", ...p }} size={16} /></span>)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        {heading("Folders")}
        {folders(null, 0)}
      </div>
      {recent.length > 0 && (
        <div>
          {heading("Recent")}
          <ul className="flex flex-col gap-0.5">
            {recent.map(({ f }) => (
              <li key={f.id}>{item("recent", inFolder, folderHref(tree, f.id), f.name, <FolderIcon color={f.color} locked={f.locked} className="w-4" />)}</li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

/* ---------- Path bar ---------- */

export function PathBar({ tree, me }: { tree: Tree; me: Me }) {
  const router = useRouter();
  const here = useHere(tree);
  const mode = useViewMode();
  const [drawer, setDrawer] = useState(false);
  const focusFirstLink = useCallback((el: HTMLElement | null) => el?.querySelector("a")?.focus(), []); // keyboard users land in the menu
  const mounted = useSyncExternalStore(noop, () => true, () => false); // document.body exists only in the browser

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const crumbs = [{ href: "/", label: "Documents" }];
  for (const f of folderPath(tree.folders, here.folder?.id ?? null) as Tree["folders"]) crumbs.push({ href: folderHref(tree, f.id), label: f.name });
  if (here.note) crumbs.push({ href: here.pathname, label: here.note.name });
  if ("project" in here && here.project) crumbs.push({ href: here.pathname, label: here.project.title });

  const iconBtn = "btn size-8 justify-center p-0 text-text-dim hover:text-text";

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-line bg-bg/85 px-3 py-2.5 backdrop-blur sm:flex-nowrap sm:px-4">
      <button type="button" onClick={() => setDrawer(true)} aria-label="Open places" className={`${iconBtn} md:hidden`}>
        <PanelLeft size={16} />
      </button>
      <button type="button" onClick={() => router.back()} aria-label="Back" className={iconBtn}>
        <ChevronLeft size={16} />
      </button>
      <button type="button" onClick={() => router.forward()} aria-label="Forward" className={iconBtn}>
        <ChevronRight size={16} />
      </button>

      <nav aria-label="Path" className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-line bg-[#0a0a0a] px-2">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          <AnimatePresence mode="popLayout" initial={false}>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <motion.li
                  key={c.href}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className={`flex items-center gap-1 ${last ? "min-w-0" : "shrink-0"}`}
                >
                  {i > 0 && <ChevronRight size={14} className="text-text-dim/60" aria-hidden="true" />}
                  <Link
                    href={c.href}
                    transitionTypes={["nav-back"]}
                    aria-current={last ? "page" : undefined}
                    className={`flex items-center gap-1.5 truncate rounded px-1 hover:bg-accent/15 hover:text-accent ${last ? "text-text" : "text-text-dim"}`}
                  >
                    {i === 0 && <House size={14} aria-hidden="true" />}
                    {c.label}
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </nav>

      <div role="group" aria-label="View" className="flex">
        {(["grid", "list"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setViewMode(m)}
            aria-pressed={mode === m}
            aria-label={m === "grid" ? "Icons view" : "Details view"}
            className={`${iconBtn} ${m === "grid" ? "rounded-r-none" : "-ml-px rounded-l-none"} ${mode === m ? "btn-on" : ""}`}
          >
            {m === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
          </button>
        ))}
      </div>

      <Search tree={tree} />
      <AdminLink className={iconBtn} />

      {/* Portal: the header's backdrop-blur would otherwise trap these "fixed" layers inside the header */}
      {mounted && createPortal(<AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-30 bg-black/70 md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              role="dialog"
              aria-modal="true"
              aria-label="Places"
              ref={focusFirstLink}
              className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-bg md:hidden"
            >
              <PlacesList tree={tree} me={me} id="drawer" onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>, document.body)}
    </header>
  );
}

function Search({ tree }: { tree: Tree }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const term = q.trim().toLowerCase();
  const hits = term
    ? allItems(tree)
        .filter((i) => hrefOf(tree, i) && [nameOf(i), i.kind === "project" ? [i.tagline, ...i.tech].join(" ") : ""].join(" ").toLowerCase().includes(term))
        .slice(0, 8)
    : [];
  const close = () => {
    setQ("");
    setOpen(false);
  };

  return (
    <div className="relative order-last w-full sm:order-none sm:w-56" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <SearchIcon size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && hits[0]) {
            router.push(hrefOf(tree, hits[0])!);
            close();
          }
        }}
        placeholder="Search"
        aria-label="Search folders, documents and projects"
        className="input h-8 w-full py-0 pl-8 text-sm"
      />
      <AnimatePresence>
        {open && term && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-30 w-full min-w-64 overflow-hidden rounded-md border border-line bg-[#0a0a0a] py-1 shadow-2xl"
          >
            {hits.length === 0 && <li className="px-3 py-2 text-sm text-text-dim">Nothing matches “{q.trim()}”</li>}
            {hits.map((i) => (
              <li key={keyOf(i)}>
                <Link href={hrefOf(tree, i)!} onClick={close} className="flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-accent/15 hover:text-accent focus-visible:bg-accent/15">
                  <span className="flex h-5 w-6 shrink-0 items-center justify-center">
                    <ItemIcon item={i} size={24} />
                  </span>
                  <span className="flex-1 truncate">{nameOf(i)}</span>
                  <span className="shrink-0 text-xs text-text-dim">{typeOf(i)}</span>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Status bar ---------- */

export function StatusBar({ tree, me }: { tree: Tree; me: Me }) {
  const here = useHere(tree);
  const selectedKey = useSelected(here.pathname);
  const selected = selectedKey && allItems(tree).find((i) => keyOf(i) === selectedKey);
  const current = currentItem(here);

  let text: string;
  if (selected) text = `“${nameOf(selected)}” selected`;
  else if (current && current.kind !== "folder") text = nameOf(current);
  else {
    const inside = contents(tree, here.folder?.id ?? null);
    const folders = inside.filter((i) => i.kind === "folder").length;
    text = `${plural(folders, "folder")}, ${plural(inside.length - folders, "file")}`;
  }

  return (
    <footer className="sticky bottom-0 z-10 flex h-8 items-center justify-between gap-4 border-t border-line bg-bg/85 px-4 text-xs text-text-dim backdrop-blur">
      <span aria-live="polite">{text}</span>
      <span>{me.name}</span>
    </footer>
  );
}

/* ---------- Info panel ---------- */

// Details of the selected item (or of the folder you're in), like Dolphin's Information panel.
// A column on wide screens; a sheet that slides up when you select something on smaller ones.
export function InfoPanel({ tree }: { tree: Tree }) {
  const here = useHere(tree);
  const selectedKey = useSelected(here.pathname);
  const selected = allItems(tree).find((i) => keyOf(i) === selectedKey) ?? null;
  const item = selected ?? currentItem(here);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(here.pathname, null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, here.pathname]);

  return (
    <>
      <aside aria-label="Information" className="sticky top-0 hidden h-dvh w-72 shrink-0 overflow-y-auto border-l border-line xl:block">
        <AnimatePresence mode="wait" initial={false}>
          <Info key={item ? keyOf(item) : "documents"} tree={tree} item={item} canOpen={Boolean(selected)} />
        </AnimatePresence>
      </aside>
      <AnimatePresence>
        {selected && (
          <motion.aside
            aria-label="Information"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-30 max-h-[75dvh] overflow-y-auto rounded-t-xl border-t border-line bg-bg shadow-[0_-20px_60px_rgb(0_0_0/0.8)] md:inset-x-auto md:right-3 md:bottom-11 md:w-80 md:rounded-xl md:border xl:hidden"
          >
            <button type="button" onClick={() => select(here.pathname, null)} aria-label="Close" className="btn absolute right-3 top-3 z-10 size-8 p-0">
              <X size={16} />
            </button>
            <Info tree={tree} item={selected} canOpen />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function Info({ tree, item, canOpen }: { tree: Tree; item: Item | null; canOpen: boolean }) {
  const isFolder = !item || item.kind === "folder";
  const folderId = item?.kind === "folder" ? item.id : null;
  const inside = isFolder && !(item?.kind === "folder" && item.locked) ? contents(tree, folderId) : [];
  const recent = isFolder ? latest(tree, folderId).slice(0, 5) : [];
  const modified = [item?.updated_at, recent[0]?.updated_at].filter(Boolean).sort().at(-1);
  const href = item && canOpen ? hrefOf(tree, item) : null;

  const rows: [string, string][] = [["Type", item ? typeOf(item) : "Folder"]];
  if (isFolder) rows.push(["Size", item?.kind === "folder" && item.locked ? "Private" : plural(inside.length, "item")]);
  if (item?.kind === "project" && item.tech.length) rows.push(["Tech", item.tech.join(", ")]);
  if (modified) rows.push(["Modified", formatDate(modified)]);
  if (item?.kind === "project" && item.started_on) rows.push(["Started", formatDate(item.started_on)]);
  else if (item) rows.push(["Created", formatDate(item.created_at)]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
      transition={{ duration: 0.25, ease: EASE }}
      className="flex flex-col gap-4 p-5"
    >
      <div className="mx-auto flex h-28 w-36 items-end justify-center pt-2">
        {item ? <ItemIcon item={item} size={144} /> : <FolderIcon className="w-full" />}
      </div>
      <div className="text-center">
        <h2 className="break-words font-display text-lg font-bold">{item ? nameOf(item) : "Documents"}</h2>
        {item?.kind === "project" && item.tagline && <p className="mt-1 text-sm text-text-dim">{item.tagline}</p>}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-line pt-4 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-right text-text-dim">{k}:</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {item && item.kind !== "note" && item.locked && (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-text-dim">
          {item.kind === "folder" ? "This folder is private for now." : "I'm still working on this one. It's private for now."}
        </p>
      )}
      {(href || (item?.kind === "project" && item.repo_url)) && (
        <div className="flex flex-wrap gap-2">
          {href && (
            <Link href={href} transitionTypes={["nav-forward"]} className="btn btn-primary btn-lg flex-1">
              Open
            </Link>
          )}
          {item?.kind === "project" && item.repo_url && (
            <a href={item.repo_url} target="_blank" rel="noopener noreferrer" className="btn btn-lg flex-1">
              GitHub
            </a>
          )}
        </div>
      )}
      {recent.length > 0 && (
        <section className="border-t border-line pt-4">
          <h3 className="pb-2 text-xs text-text-dim">Latest updates</h3>
          <ul className="flex flex-col">
            {recent.map((r) => {
              const to = hrefOf(tree, r);
              const body = (
                <>
                  <span className="flex h-5 w-6 shrink-0 items-center justify-center">
                    <ItemIcon item={r} size={24} />
                  </span>
                  <span className="flex-1 truncate">{nameOf(r)}</span>
                  <span className="shrink-0 text-xs tabular-nums text-text-dim">{formatDate(r.updated_at)}</span>
                </>
              );
              return (
                <li key={keyOf(r)}>
                  {to ? (
                    <Link href={to} transitionTypes={["nav-forward"]} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface hover:text-accent">
                      {body}
                    </Link>
                  ) : (
                    <span className="-mx-2 flex items-center gap-2.5 px-2 py-1.5 text-sm text-text-dim">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </motion.div>
  );
}

// Shortcut to the admin, only for a fully signed-in owner (password + 2FA). Cosmetic: /admin checks on its own.
function AdminLink({ className }: { className: string }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    createClient().auth.getClaims().then(({ data }) => setAdmin(data?.claims.aal === "aal2"), () => {});
  }, []);
  if (!admin) return null;
  return (
    <Link href="/admin" aria-label="Admin" title="Admin" className={className}>
      <Settings size={16} />
    </Link>
  );
}
