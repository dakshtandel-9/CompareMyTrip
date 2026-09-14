"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <head><title>Page unavailable | CompareMyTrip</title></head>
      <body style={{ margin: 0, color: "#17212b", background: "#faf9f6", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box" }}>
          <div role="alert" style={{ maxWidth: "480px", textAlign: "center" }}>
            <p style={{ fontWeight: 700 }}>CompareMyTrip</p>
            <h1>We couldn’t load the site</h1>
            <p style={{ lineHeight: 1.7 }}>Please try again or reload the page to reconnect.</p>
            <button type="button" onClick={retry} style={{ minHeight: "44px", padding: "10px 24px", border: "1px solid #dcae16", borderRadius: "10px", background: "#ffcc33", color: "#17212b", font: "inherit", fontWeight: 600, cursor: "pointer" }}>
              Try again
            </button>
            {/* Recover even when the root client bundle or session initialization fails. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <p><a href="/" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", color: "inherit" }}>Return to homepage</a></p>
          </div>
        </main>
      </body>
    </html>
  );
}
