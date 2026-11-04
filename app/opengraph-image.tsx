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
          <path d="M2 8a4 4 0 0 1 4-4h16l6 6h30a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#9c3060" />
          <rect x="2" y="16" width="60" height="34" rx="4" fill="#ff4f9a" />
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
