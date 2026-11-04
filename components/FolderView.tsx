"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { select, useSelected } from "@/components/selection";
import { useViewMode } from "@/components/view-mode";
import { contents, formatDate, hrefOf, type Item, keyOf, nameOf, plural, type Tree, typeOf } from "@/lib/tree";
import { FileText } from "lucide-react";
import { FolderIcon } from "@/components/FolderIcon";
import type { RepoEntry } from "@/lib/github";

const EASE = [0.22, 1, 0.36, 1] as const;

// The contents of one folder, as icons or as a details list.
// Click selects (details show in the info panel), double-click or Enter opens.
// `morph`: icons/names grow into the page they open. Off where the same item could appear twice on a page.
export function FolderView({
  tree,
  items,
  empty,
  repos = {},
  morph = true,
}: {
  tree: Tree;
  items: Item[];
  empty: string;
  repos?: Record<string, RepoEntry[]>; // project id → top of its GitHub repo, shown in the hover peek
  morph?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const selected = useSelected(pathname);
  const mode = useViewMode();

  const open = (item: Item) => {
    const href = hrefOf(tree, item);
    if (href) router.push(href, { transitionTypes: ["nav-forward"] });
  };

  if (items.length === 0) return <p className="py-10 text-center text-sm text-text-dim">{empty}</p>;

  return (
    <div onClick={(e) => e.target === e.currentTarget && select(pathname, null)}>
      <p className="sr-only">Click an item to see its details. Double-click it or press Enter to open it.</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          onClick={(e) => e.target === e.currentTarget && select(pathname, null)}
          className={mode === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1" : "flex flex-col"}
        >
          {mode === "list" && (
            <li aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_7rem] gap-4 border-b border-line px-3 pb-2 text-xs text-text-dim md:grid-cols-[minmax(0,1fr)_9rem_7rem]">
              <span>Name</span>
              <span className="hidden md:block">Type</span>
              <span>Modified</span>
            </li>
          )}
          {items.map((item, i) => (
            <motion.li
              key={keyOf(item)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 14) * 0.03 }}
              className="relative"
            >
              {mode === "grid" ? (
                <Tile item={item} tree={tree} selected={selected === keyOf(item)} morph={morph} open={open} repo={repos[item.id]} />
              ) : (
                <Row item={item} tree={tree} selected={selected === keyOf(item)} morph={morph} open={open} />
              )}
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

type ItemProps = { item: Item; tree: Tree; selected: boolean; morph: boolean; open: (i: Item) => void; repo?: RepoEntry[] };

// A link (so middle-click / new tab still work) where a plain click only selects
function ItemLink({ item, tree, open, className, children }: Omit<ItemProps, "selected" | "morph"> & { className: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const href = hrefOf(tree, item);
  const props = {
    className,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      select(pathname, keyOf(item));
    },
    onDoubleClick: () => open(item),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" || !href) return; // locked: let the button's own click select it
      e.preventDefault();
      open(item);
    },
  };
  return href ? (
    <Link href={href} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

function Highlight({ selected }: { selected: boolean }) {
  if (!selected) return <span className="absolute inset-0 rounded-md transition-colors group-hover:bg-surface" />;
  // slides from the previously selected item
  return <motion.span layoutId="selection" transition={{ duration: 0.3, ease: EASE }} className="absolute inset-0 rounded-md border border-accent/70 bg-accent/10" />;
}

function Icon({ item, size, open, morph }: { item: Item; size: number; open?: boolean; morph: boolean }) {
  const icon = <ItemIcon item={item} size={size} open={open} />;
  if (!morph || item.kind === "note") return icon;
  return (
    <ViewTransition name={item.kind === "folder" ? `folder-${item.id}` : `cover-${item.id}`} share="morph" default="none">
      <span className="block w-full">{icon}</span>
    </ViewTransition>
  );
}

function Name({ item, morph, className }: { item: Item; morph: boolean; className: string }) {
  const name = <span className={className}>{nameOf(item)}</span>;
  if (!morph || item.kind === "note") return name;
  return (
    <ViewTransition name={`title-${item.id}`} share="morph" default="none">
      {name}
    </ViewTransition>
  );
}

type Slot = { key: string; name: string; icon: React.ReactNode; href: string | null; external?: boolean };
type PeekData = { title: string; subtitle: string; color: string; slots: Slot[] };

// What hovering shows: a folder's contents, or the top of a project's GitHub repo
function peekFor(item: Item, tree: Tree, repo: RepoEntry[] | undefined): PeekData | null {
  if (item.kind === "folder") {
    const kids = item.locked ? [] : contents(tree, item.id);
    return {
      title: item.name,
      subtitle: item.locked ? "Locked. What's inside is private for now." : kids.length ? `Contains ${plural(kids.length, "item")}` : "Empty",
      color: item.color,
      slots: kids.map((k) => ({ key: keyOf(k), name: nameOf(k), icon: <ItemIcon item={k} size={40} />, href: hrefOf(tree, k) })),
    };
  }
  if (item.kind === "project" && repo?.length) {
    return {
      title: item.title,
      subtitle: `${plural(repo.length, "item")} in the repository`,
      color: REPO_COLOR,
      slots: repo.map((e) => ({
        key: e.name,
        name: e.name,
        icon: e.dir ? <FolderIcon color={REPO_COLOR} className="w-full" /> : <FileText size={22} className="text-white/80" />,
        href: e.url,
        external: true,
      })),
    };
  }
  return null;
}

const REPO_COLOR = "#6b7a8c";

function Tile({ item, tree, selected, morph, open, repo }: ItemProps) {
  const [peek, setPeek] = useState<{ below: boolean; dx: number } | null>(null);
  const [lidOpen, setLidOpen] = useState(false);
  const timer = useRef(0);
  const data = peekFor(item, tree, repo);

  useEffect(
    () => () => {
      // also runs when the page is kept in the background after navigating away, so the peek is closed on return
      clearTimeout(timer.current);
      setPeek(null);
      setLidOpen(false);
    },
    [],
  );
  useEffect(() => {
    if (!peek) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPeek(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peek]);

  // Hovering (mouse only) lifts the contents out into a floating box above the item
  function enter(e: React.PointerEvent<HTMLDivElement>) {
    if (!data || e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    if (peek) return; // moving between the item and its box
    const el = e.currentTarget;
    timer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const n = Math.min(Math.max(data.slots.length, 1), 12);
      const cols = Math.min(n, 6);
      const w = Math.max(cols * 60 + 24, 180);
      const h = 60 + Math.ceil(n / 6) * 68;
      const center = r.left + r.width / 2;
      const left = Math.min(Math.max(center - w / 2, 8), window.innerWidth - w - 8);
      setPeek({ below: r.top < h + 70, dx: left - (center - w / 2) });
      setLidOpen(true);
    }, 140);
  }
  function leave() {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(null), 120); // grace period to reach the box
  }
  const openItem = (i: Item) => {
    setPeek(null);
    open(i);
  };

  return (
    <div className="relative" onPointerEnter={enter} onPointerLeave={leave}>
      <ItemLink item={item} tree={tree} open={openItem} className="group relative flex w-full flex-col items-center gap-1.5 rounded-md p-2 pb-2.5 text-center">
        <Highlight selected={selected} />
        <span className="relative flex h-20 w-24 items-end justify-center">
          <Icon item={item} size={96} open={lidOpen && item.kind === "folder"} morph={morph} />
        </span>
        <Name item={item} morph={morph} className={`relative line-clamp-2 break-all font-display text-sm ${selected ? "text-accent" : ""}`} />
      </ItemLink>
      <AnimatePresence onExitComplete={() => setLidOpen(false)}>
        {peek && data && <Peek key="peek" data={data} {...peek} onOpen={() => setPeek(null)} />}
      </AnimatePresence>
    </div>
  );
}

const box: Variants = {
  hidden: { opacity: 0, scale: 0.94, transition: { when: "afterChildren", staggerChildren: 0.015, staggerDirection: -1, duration: 0.12 } },
  shown: { opacity: 1, scale: 1, transition: { when: "beforeChildren", staggerChildren: 0.03, duration: 0.14 } },
};
// each item starts inside the folder and flies up into its slot (and back on the way out)
const slot: Variants = {
  hidden: (below: boolean) => ({ opacity: 0, scale: 0.3, y: below ? -64 : 64, transition: { duration: 0.15, ease: "easeIn" } }),
  shown: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 28 } },
};

// The floating "shulker box" peek, tinted with the folder's own colour. Its items can be clicked.
function Peek({ data, below, dx, onOpen }: { data: PeekData; below: boolean; dx: number; onOpen: () => void }) {
  const shown = data.slots.slice(0, data.slots.length > 12 ? 11 : 12);
  const extra = data.slots.length - shown.length;
  const cols = Math.min(Math.max(data.slots.length, 1), 6);
  const slotClass = "flex h-16 flex-col items-center justify-center gap-1 rounded border border-black/50 bg-black/50 p-1 shadow-[inset_0_2px_0_rgb(0_0_0/0.45)]";
  return (
    <motion.div
      variants={box}
      initial="hidden"
      animate="shown"
      exit="hidden"
      style={{
        x: "-50%",
        marginLeft: dx,
        transformOrigin: below ? "50% 0%" : "50% 100%",
        borderColor: data.color,
        background: `color-mix(in srgb, ${data.color} 20%, #050505)`,
        boxShadow: "0 18px 50px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.08)",
      }}
      className={`absolute left-1/2 z-40 w-max rounded-lg border-2 p-2.5 ${below ? "top-[calc(100%-6px)]" : "bottom-[calc(100%-6px)]"}`}
    >
      <p className="px-0.5 font-display text-sm font-medium text-white">{data.title}</p>
      <p className="px-0.5 pb-2 text-xs" style={{ color: `color-mix(in srgb, ${data.color} 55%, #fff)` }}>
        {data.subtitle}
      </p>
      {shown.length > 0 && (
        <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 3.5rem)` }}>
          {shown.map((s) => {
            const inner = (
              <>
                <motion.span variants={slot} custom={below} className="flex h-8 w-10 items-end justify-center">
                  {s.icon}
                </motion.span>
                <span className="w-full truncate text-center text-[10px] leading-tight text-white/80">{s.name}</span>
              </>
            );
            const linkClass = `${slotClass} transition-colors hover:border-white/50 hover:bg-white/10`;
            return (
              <li key={s.key} title={s.name}>
                {!s.href ? (
                  <div className={slotClass}>{inner}</div>
                ) : s.external ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" tabIndex={-1} onClick={onOpen} className={linkClass}>
                    {inner}
                  </a>
                ) : (
                  <Link href={s.href} transitionTypes={["nav-forward"]} tabIndex={-1} onClick={onOpen} className={linkClass}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
          {extra > 0 && <li className={`${slotClass} text-xs text-white/80`}>+{extra}</li>}
        </ul>
      )}
    </motion.div>
  );
}

function Row({ item, tree, selected, morph, open }: ItemProps) {
  return (
    <ItemLink
      item={item}
      tree={tree}
      open={open}
      className="group relative grid w-full grid-cols-[minmax(0,1fr)_7rem] items-center gap-4 rounded-md px-3 py-1.5 text-left text-sm md:grid-cols-[minmax(0,1fr)_9rem_7rem]"
    >
      <Highlight selected={selected} />
      <span className="relative flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-10 shrink-0 items-center justify-center">
          <Icon item={item} size={40} morph={morph} />
        </span>
        <Name item={item} morph={morph} className={`truncate ${selected ? "text-accent" : ""}`} />
      </span>
      <span className="relative hidden text-text-dim md:block">{typeOf(item)}</span>
      <span className="relative tabular-nums text-text-dim">{formatDate(item.updated_at)}</span>
    </ItemLink>
  );
}
