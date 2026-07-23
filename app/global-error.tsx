"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(1000px 700px at 50% -10%, rgba(16,185,129,0.22), transparent 55%), #eef7f2",
          color: "#0b1f17",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>
            Clean Sheet Sidekick crashed
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#547365", marginBottom: 20 }}>
            A critical error occurred. Please reload to continue.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: 10,
              border: "none",
              background: "#10b981",
              color: "#04120c",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
