import { Lock } from "lucide-react";
import { Cover } from "@/components/Cover";
import { DocIcon, FolderIcon } from "@/components/FolderIcon";
import type { Item } from "@/lib/tree";

// The icon for anything in a folder. `size` is the box width in px; projects show their cover.
export function ItemIcon({ item, size, open = false }: { item: Item; size: number; open?: boolean }) {
  if (item.kind === "folder") return <FolderIcon color={item.color} icon={size >= 40 ? item.icon : ""} locked={item.locked} open={open} className="w-full" />;
  if (item.kind === "note") return <DocIcon className="mx-auto h-full max-h-full w-auto" />;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-surface">
      <Cover project={item} sizes={`${size}px`} small={size < 64} />
      {item.locked && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55">
          <Lock size={Math.max(12, size / 5)} aria-label="Locked" />
        </span>
      )}
    </div>
  );
}
