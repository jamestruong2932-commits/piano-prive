import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "linear-gradient(160deg, #1f3d2e 0%, #142a1f 100%)",
          borderRadius: 96,
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
              fontSize: 260,
              fontFamily: "serif",
              color: "#d9c08b",
              lineHeight: 1,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <div style={{ width: 26, height: 44, background: "#f6f1e4", borderRadius: 4 }} />
            <div style={{ width: 26, height: 44, background: "#f6f1e4", borderRadius: 4 }} />
            <div style={{ width: 26, height: 60, background: "#f6f1e4", borderRadius: 4 }} />
            <div style={{ width: 26, height: 44, background: "#f6f1e4", borderRadius: 4 }} />
            <div style={{ width: 26, height: 44, background: "#f6f1e4", borderRadius: 4 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
