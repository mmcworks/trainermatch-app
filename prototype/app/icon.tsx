import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
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
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          borderRadius: "8px",
          position: "relative"
        }}
      >
        {/* Bar */}
        <div
          style={{
            position: "absolute",
            width: "18px",
            height: "3px",
            backgroundColor: "#ffffff",
            borderRadius: "1.5px"
          }}
        />
        {/* Left inner plate */}
        <div
          style={{
            position: "absolute",
            left: "6px",
            width: "3px",
            height: "14px",
            backgroundColor: "#ffffff",
            borderRadius: "1.5px"
          }}
        />
        {/* Left outer plate */}
        <div
          style={{
            position: "absolute",
            left: "2px",
            width: "3px",
            height: "10px",
            backgroundColor: "#10b981",
            borderRadius: "1.5px"
          }}
        />
        {/* Right inner plate */}
        <div
          style={{
            position: "absolute",
            right: "6px",
            width: "3px",
            height: "14px",
            backgroundColor: "#ffffff",
            borderRadius: "1.5px"
          }}
        />
        {/* Right outer plate */}
        <div
          style={{
            position: "absolute",
            right: "2px",
            width: "3px",
            height: "10px",
            backgroundColor: "#10b981",
            borderRadius: "1.5px"
          }}
        />
        {/* Top active dot */}
        <div
          style={{
            position: "absolute",
            top: "3px",
            width: "3.5px",
            height: "3.5px",
            backgroundColor: "#34d399",
            borderRadius: "50%"
          }}
        />
      </div>
    ),
    { ...size }
  );
}
