"use client";

import { useState } from "react";
import SplashScreen from "./SplashScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <SplashScreen onDone={() => setReady(true)} />}
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease" }}>
        {children}
      </div>
    </>
  );
}
