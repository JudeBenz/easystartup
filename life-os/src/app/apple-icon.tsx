import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c1a3a, #1a3a6b)",
        }}
      >
        <div style={{ fontSize: 280, lineHeight: 1 }}>🖥️</div>
      </div>
    ),
    { ...size },
  );
}
