import Image from "next/image";
import type { Project } from "@/lib/types";

// Project cover image, or the pink-glow initial when there is none. Fills its (relative) parent.
export function Cover({ project, sizes, priority = false, big = false, small = false }: { project: Pick<Project, "cover_url" | "title">; sizes: string; priority?: boolean; big?: boolean; small?: boolean }) {
  if (project.cover_url) {
    return <Image src={project.cover_url} alt="" fill priority={priority} sizes={sizes} className="object-cover transition duration-500 group-hover:scale-105" />;
  }
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--color-accent)_25%,transparent),transparent_60%)]">
      <span className={`font-display font-bold text-text-dim ${big ? "text-9xl" : small ? "text-base" : "text-4xl"}`}>{project.title[0]}</span>
    </div>
  );
}
