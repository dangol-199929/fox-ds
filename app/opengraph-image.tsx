import { ImageResponse } from "next/og";

export const alt = "Clean Desk Kit: your desk deserves better.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand card used when pages are shared on social media.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f7f6f2",
          color: "#20211f",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#c8f169", border: "3px solid #20211f" }} />
          clean/desk
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
          Your desk deserves better.
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#5c5e58" }}>
          One simple kit to tame cable chaos. Australian store.
        </div>
      </div>
    ),
    size,
  );
}
