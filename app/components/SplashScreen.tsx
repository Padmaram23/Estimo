"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    // Hold for 1.8s then fade out
    const fadeTimer = setTimeout(() => setPhase("out"), 1800);
    // Remove after fade completes
    const doneTimer = setTimeout(() => onDone(), 2350);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div
      className={phase === "out" ? "estimo-splash-out" : ""}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#09090b",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Logo mark */}
      <div style={{
        animation: "estimo-logo-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards",
        marginBottom: 20,
      }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#4f46e5" />
          {/* E letter mark */}
          <rect x="16" y="18" width="32" height="5" rx="2.5" fill="white" />
          <rect x="16" y="29.5" width="22" height="5" rx="2.5" fill="white" fillOpacity="0.75" />
          <rect x="16" y="41" width="32" height="5" rx="2.5" fill="white" />
          {/* small cost dot */}
          <circle cx="50" cy="14" r="5" fill="#818cf8" />
          <circle cx="50" cy="14" r="3" fill="#c7d2fe" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{
        animation: "estimo-fade-in 0.5s 0.3s ease both",
        fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em",
        color: "#f4f4f5", fontFamily: "var(--font-geist-sans, sans-serif)",
      }}>
        estimo
      </div>

      {/* Tagline */}
      <div style={{
        animation: "estimo-fade-in 0.5s 0.5s ease both",
        fontSize: 12, color: "#71717a", marginTop: 6, letterSpacing: "0.06em",
        textTransform: "uppercase", fontFamily: "var(--font-geist-sans, sans-serif)",
      }}>
        AI cost estimator
      </div>

      {/* Progress bar */}
      <div style={{
        animation: "estimo-fade-in 0.4s 0.6s ease both",
        marginTop: 40, width: 200, height: 3,
        background: "#27272a", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)",
          backgroundSize: "200% 100%",
          animation: "estimo-bar 1.4s 0.6s ease forwards, estimo-bar-shimmer 1.2s 0.6s linear infinite",
        }} />
      </div>

      {/* Dots */}
      <div style={{
        animation: "estimo-fade-in 0.4s 0.8s ease both",
        display: "flex", gap: 6, marginTop: 16,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "#6366f1",
            animation: `estimo-dot 1.2s ${0.8 + i * 0.18}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
