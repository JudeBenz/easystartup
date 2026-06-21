import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C5A39",
        }}
      >
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 108,
            fontWeight: 700,
            color: "#F1F4F0",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          E
        </span>
      </div>
    ),
    { ...size }
  );
}
