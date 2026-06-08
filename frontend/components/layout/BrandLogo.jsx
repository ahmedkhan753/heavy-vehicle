"use client";

import { useState } from "react";

/**
 * BrandLogo
 * ─────────
 * Renders the HeavyWheels logo image from /public/heavywheels-logo.png.
 * If that file isn't present yet, it falls back to a styled "HEAVYWHEELS"
 * wordmark so the header/footer never show a broken image.
 *
 * To use your real logo: save it as  frontend/public/heavywheels-logo.png
 */
export default function BrandLogo({ className = "h-9 w-auto md:h-10" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-xl font-black tracking-tight md:text-2xl">
        <span className="text-[var(--hw-text-primary)]">HEAVY</span>
        <span className="text-[var(--hw-orange)]">WHEELS</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/heavywheels-logo.png"
      alt="HeavyWheels"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
