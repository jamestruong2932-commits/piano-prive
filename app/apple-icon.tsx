import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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
          background: "linear-gradient(160deg, #1f3d2e 0%, #142a1f 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontFamily: "serif",
              color: "#d9c08b",
              lineHeight: 1,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <div style={{ width: 10, height: 16, background: "#f6f1e4", borderRadius: 2 }} />
            <div style={{ width: 10, height: 16, background: "#f6f1e4", borderRadius: 2 }} />
            <div style={{ width: 10, height: 22, background: "#f6f1e4", borderRadius: 2 }} />
            <div style={{ width: 10, height: 16, background: "#f6f1e4", borderRadius: 2 }} />
            <div style={{ width: 10, height: 16, background: "#f6f1e4", borderRadius: 2 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
