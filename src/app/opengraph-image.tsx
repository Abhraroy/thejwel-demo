import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1f2937 0%, #4b5563 100%)",
          color: "#ffffff",
          fontSize: 68,
          fontWeight: 700,
        }}
      >
        <div>THE JWEL</div>
        <div style={{ fontSize: 30, marginTop: 16 }}>Beyond The Jewellery</div>
      </div>
    ),
    {
      ...size,
    }
  );
}
