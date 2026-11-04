import { Lock } from "lucide-react";
import { EMBLEMS } from "@/components/emblems";

// A KDE Breeze-style folder in any colour, with an optional emblem on the front.
// `open`: lid swings open and the folder is empty (its contents are "taken out" by the hover peek).
export function FolderIcon({
  color = "#ff4f9a",
  icon = "",
  locked = false,
  open = false,
  className = "",
}: {
  color?: string;
  icon?: string;
  locked?: boolean;
  open?: boolean;
  className?: string;
}) {
  const Emblem = EMBLEMS[icon as keyof typeof EMBLEMS];
  return (
    <svg viewBox="0 0 64 52" aria-hidden="true" className={`${open ? "folder-open" : ""} ${className}`}>
      <path d="M4 8a4 4 0 0 1 4-4h14.5l6 6H56a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill={`color-mix(in srgb, ${color} 62%, #000)`} />
      <rect className="folder-page" x="10" y="12" width="44" height="22" rx="2" fill="#f5f5f5" opacity="0.9" />
      <g className="folder-lid">
        <path d="M3 20a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4l-1.5 24a4 4 0 0 1-4 4h-47a4 4 0 0 1-4-4z" fill={color} />
        {Emblem && <Emblem x={23} y={23} size={18} color="rgb(255 255 255 / 0.8)" strokeWidth={2.2} />}
      </g>
      {locked && (
        <g>
          <circle cx="54" cy="44" r="9" fill="#000" />
          <Lock x={48} y={38} size={12} color="#fff" strokeWidth={2.4} />
        </g>
      )}
    </svg>
  );
}

// A text document with a folded corner, like KDE's file icons
export function DocIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 64" aria-hidden="true" className={className}>
      <path d="M6 2h28l14 14v42a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#4fb3f6" />
      <path d="M34 2v10a4 4 0 0 0 4 4h10z" fill="#2b7fc0" />
      <path d="M11 28h30M11 36h30M11 44h20" stroke="#fff" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
