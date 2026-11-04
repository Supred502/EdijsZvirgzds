"use client";

import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { reorderProjects, setFlag } from "../actions";
import { DeleteButton } from "./DeleteButton";

// Drag by the handle (or use ↑/↓) to change the order the site shows projects in. Saves on drop.
export function ProjectList({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState(projects);
  const latest = useRef(projects);
  const [error, setError] = useState("");

  function update(next: Project[]) {
    latest.current = next;
    setItems(next);
  }

  function save() {
    setError("");
    reorderProjects(latest.current.map((p) => p.id)).catch(() => setError("Couldn't save the new order. Refresh and try again."));
  }

  function move(index: number, by: -1 | 1) {
    const next = [...latest.current];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    update(next);
    save();
  }

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-red-400">{error}</p>}
      <Reorder.Group as="ul" axis="y" values={items} onReorder={update} className="flex flex-col gap-2">
        {items.map((p, i) => (
          <Row key={p.id} project={p} onDrop={save}>
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.title} up`} className="px-1 text-xs text-text-dim hover:text-accent disabled:opacity-30">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${p.title} down`} className="px-1 text-xs text-text-dim hover:text-accent disabled:opacity-30">▼</button>
            </div>
          </Row>
        ))}
      </Reorder.Group>
    </>
  );
}

function Row({ project: p, onDrop, children }: { project: Project; onDrop: () => void; children: React.ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={p}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
    >
      <span
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none select-none px-1 text-lg text-text-dim active:cursor-grabbing"
        aria-hidden="true"
        title="Drag to reorder"
      >
        ⠿
      </span>
      {children}
      <div className="min-w-0 flex-1">
        <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-accent">{p.title}</Link>
        <p className="truncate text-sm text-text-dim">/{p.slug}</p>
      </div>
      <form action={setFlag.bind(null, p.id, "published", !p.published)}>
        <button className={`btn w-24 ${p.published ? "btn-on" : ""}`} aria-pressed={p.published}>
          {p.published ? "Published" : "Draft"}
        </button>
      </form>
      <form action={setFlag.bind(null, p.id, "featured", !p.featured)}>
        <button className={`btn w-24 ${p.featured ? "btn-on" : ""}`} aria-pressed={p.featured}>
          {p.featured ? "★ Featured" : "☆ Feature"}
        </button>
      </form>
      <Link href={`/admin/projects/${p.id}`} className="btn w-20">Edit</Link>
      <DeleteButton id={p.id} title={p.title} />
    </Reorder.Item>
  );
}
