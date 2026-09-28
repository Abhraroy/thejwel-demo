import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#111827",
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        THE JWEL
      </div>
    ),
    {
      ...size,
    }
  );
}
