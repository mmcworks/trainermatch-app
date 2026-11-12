import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          borderRadius: "40px",
          position: "relative"
        }}
      >
        {/* Accent dot */}
        <div
          style={{
            position: "absolute",
            top: "46px",
            width: "18px",
            height: "18px",
            borderRadius: "9px",
            backgroundColor: "#34d399"
          }}
        />

        {/* Central Bar */}
        <div
          style={{
            position: "absolute",
            width: "90px",
            height: "12px",
            backgroundColor: "#ffffff",
            borderRadius: "6px"
          }}
        />

        {/* Left inner plate */}
        <div
          style={{
            position: "absolute",
            left: "36px",
            width: "14px",
            height: "64px",
            backgroundColor: "#ffffff",
            borderRadius: "7px"
          }}
        />

        {/* Left outer plate (green accent) */}
        <div
          style={{
            position: "absolute",
            left: "18px",
            width: "14px",
            height: "46px",
            backgroundColor: "#10b981",
            borderRadius: "7px"
          }}
        />

        {/* Right inner plate */}
        <div
          style={{
            position: "absolute",
            right: "36px",
            width: "14px",
            height: "64px",
            backgroundColor: "#ffffff",
            borderRadius: "7px"
          }}
        />

        {/* Right outer plate (green accent) */}
        <div
          style={{
            position: "absolute",
            right: "18px",
            width: "14px",
            height: "46px",
            backgroundColor: "#10b981",
            borderRadius: "7px"
          }}
        />
      </div>
    ),
    {
      ...size
    }
  );
}
