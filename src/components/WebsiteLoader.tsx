"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type WebsiteLoaderProps = {
  autoDismiss?: boolean;
};

export default function WebsiteLoader({ autoDismiss = false }: WebsiteLoaderProps) {
  const [phase, setPhase] = useState<"visible" | "leaving" | "hidden">("visible");

  useEffect(() => {
    if (!autoDismiss) return;

    const leaveTimer = window.setTimeout(() => setPhase("leaving"), 650);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 950);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [autoDismiss]);

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading CompareMyTrip"
      className={`cmt-site-loader ${phase === "leaving" ? "cmt-site-loader--leaving" : ""}`}
    >
      <div className="cmt-site-loader__content">
        <Image
          src="/logo.png"
          alt="CompareMyTrip"
          width={1400}
          height={167}
          sizes="190px"
          fetchPriority="high"
          className="cmt-site-loader__logo"
        />

        <div className="cmt-site-loader__track" aria-hidden="true">
          <span className="cmt-site-loader__progress" />
        </div>

        <p className="cmt-site-loader__label">Preparing your journey…</p>
      </div>
    </div>
  );
}
