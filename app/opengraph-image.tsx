import { ImageResponse } from "next/og";

// The picture shown when the site is shared (Discord, WhatsApp, X…); projects with a cover use that instead
export const alt = "Edijs Zvirgzds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", gap: 64, padding: 96 }}>
        <svg width="300" height="244" viewBox="0 0 64 52">
          <path d="M4 8a4 4 0 0 1 4-4h14.5l6 6H56a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#9e3160" />
          <rect x="10" y="12" width="44" height="22" rx="2" fill="#f5f5f5" />
          <path d="M3 20a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4l-1.5 24a4 4 0 0 1-4 4h-47a4 4 0 0 1-4-4z" fill="#ff4f9a" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ color: "#fff", fontSize: 84, fontWeight: 700 }}>Edijs Zvirgzds</div>
          <div style={{ color: "#a3a3a3", fontSize: 40 }}>Projects and work</div>
        </div>
      </div>
    ),
    size,
  );
}
