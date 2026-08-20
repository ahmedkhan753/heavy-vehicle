"use client";

import { useEffect, useRef, useState } from "react";
import { adApi } from "@/lib/api";

/**
 * AdBanner — renders paid banner placements.
 *
 * Deliberately a client component that fetches at runtime rather than being
 * baked into the server render: the pages it sits on use `revalidate`, so a
 * server-rendered banner would be frozen into the cached HTML and every
 * visitor would see the same ad with no impression counted.
 *
 * Renders NOTHING when there are no live ads — an empty bordered slot on a
 * young site looks broken and wastes vertical space on a phone.
 *
 * `placement`: "header" | "home-mid" | "listing"
 */
export default function AdBanner({ placement = "home-mid", limit = 3, className = "" }) {
  const [ads, setAds] = useState([]);
  const seen = useRef(new Set());

  useEffect(() => {
    let active = true;
    adApi
      .serve(placement, limit)
      .then((res) => { if (active) setAds(res?.data || []); })
      .catch(() => { if (active) setAds([]); });
    return () => { active = false; };
  }, [placement, limit]);

  // Count one impression per ad per mount.
  useEffect(() => {
    ads.forEach((ad) => {
      if (seen.current.has(ad._id)) return;
      seen.current.add(ad._id);
      adApi.impression(ad._id).catch(() => {});
    });
  }, [ads]);

  if (!ads.length) return null;

  const isHeader = placement === "header";

  return (
    <div
      className={
        isHeader
          ? `w-full border-b border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] ${className}`
          : className
      }
    >
      <div className={isHeader ? "hw-container flex justify-center py-2" : ""}>
        <div
          className={
            isHeader
              ? "w-full max-w-[970px]"
              : `grid gap-2.5 sm:gap-4 ${ads.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`
          }
        >
          {ads.map((ad) => (
            <AdSlot key={ad._id} ad={ad} isHeader={isHeader} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdSlot({ ad, isHeader }) {
  const src = ad.mobileImage?.url || ad.image?.url;
  const desktopSrc = ad.image?.url || src;
  if (!desktopSrc) return null;

  return (
    <a
      href={adApi.clickUrl(ad._id)}
      target="_blank"
      // noopener/noreferrer: these point at third-party sites we don't control.
      rel="noopener noreferrer sponsored"
      aria-label={ad.title || ad.advertiserName || "Advertisement"}
      className="group relative block overflow-hidden rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-card)]"
    >
      {/* Plain <img>, not next/image: creatives are arbitrary third-party
          dimensions and next/image would need every advertiser host in
          next.config remotePatterns. */}
      <picture>
        {ad.mobileImage?.url ? (
          <source media="(min-width: 640px)" srcSet={desktopSrc} />
        ) : null}
        <img
          src={ad.mobileImage?.url || desktopSrc}
          alt={ad.title || ad.advertiserName || ""}
          loading={isHeader ? "eager" : "lazy"}
          className={isHeader ? "h-auto w-full object-contain" : "h-auto w-full object-cover"}
        />
      </picture>

      <span className="pointer-events-none absolute right-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90">
        Ad
      </span>
    </a>
  );
}
