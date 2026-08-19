"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const SWIPE_THRESHOLD_PX = 40;

/**
 * VehicleGallery — used by both vehicle and part detail pages.
 *
 * Layout mirrors what buyers expect from a classifieds app: one large image
 * with a couple of stacked previews beside it and a "+N more" tile that jumps
 * straight into the fullscreen viewer. That's much shorter than a big image
 * plus a full-width thumbnail strip, which matters most on a phone where the
 * gallery competes with the price and seller buttons for the first screen.
 *
 * Navigation works three ways so nothing is a dead end on touch: swipe, the
 * arrow buttons, and the preview tiles.
 */
export default function VehicleGallery({ images, title, fallbackImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef(null);

  const displayImages = images && images.length > 0
    ? images
    : [{ url: fallbackImage, publicId: "fallback" }];

  const total = displayImages.length;
  const hasMany = total > 1;

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % total);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);

  const handleNext = (e) => { e.stopPropagation(); goNext(); };
  const handlePrev = (e) => { e.stopPropagation(); goPrev(); };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const openLightbox = () => { setZoomed(false); setIsLightboxOpen(true); };
  const closeLightbox = () => { setIsLightboxOpen(false); setZoomed(false); };

  // Two preview tiles sit beside the main image. They show the images that
  // come *after* the current one so the strip stays useful as you page along.
  const previews = hasMany
    ? [1, 2].map((offset) => (currentIndex + offset) % total).filter((idx) => idx !== currentIndex)
    : [];
  const hiddenCount = total - 1 - previews.length;

  return (
    <>
      <div className="flex gap-1.5 sm:gap-2">
        {/* Main image */}
        <div className="group relative min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
          <div
            className="relative aspect-[4/3] w-full cursor-pointer touch-pan-y bg-black/5 sm:aspect-[16/10]"
            onClick={openLightbox}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={displayImages[currentIndex].url || fallbackImage}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              priority
              sizes="(max-width: 640px) 74vw, (max-width: 1024px) 70vw, 50vw"
              className="object-cover"
            />
          </div>

          {hasMany ? (
            <>
              <button
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute start-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-90 transition hover:bg-black/80 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg className="h-4 w-4 rtl:rotate-180 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                onClick={handleNext}
                aria-label="Next image"
                className="absolute end-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-90 transition hover:bg-black/80 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg className="h-4 w-4 rtl:rotate-180 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <span className="pointer-events-none absolute bottom-1.5 start-1.5 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white sm:bottom-2.5 sm:start-2.5 sm:text-xs">
                {currentIndex + 1} / {total}
              </span>
            </>
          ) : null}
        </div>

        {/* Stacked previews */}
        {previews.length ? (
          <div className="flex w-[24%] max-w-[120px] shrink-0 flex-col gap-1.5 sm:gap-2">
            {previews.map((idx, position) => {
              const isLastTile = position === previews.length - 1;
              const showMore = isLastTile && hiddenCount > 0;
              return (
                <button
                  key={displayImages[idx].publicId || displayImages[idx].url || idx}
                  onClick={() => (showMore ? openLightbox() : setCurrentIndex(idx))}
                  aria-label={showMore ? `View all ${total} images` : `Show image ${idx + 1}`}
                  className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:border-[var(--hw-orange)]"
                >
                  <Image
                    src={displayImages[idx].url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {showMore ? (
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                      <span className="text-sm font-black leading-none sm:text-base">+{hiddenCount}</span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">More</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
      {isLightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeLightbox}>
          <button
            className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>

          <div
            className="relative h-full max-h-[85vh] w-full max-w-5xl overflow-hidden"
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={displayImages[currentIndex].url || fallbackImage}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              sizes="100vw"
              className={`object-contain transition-transform duration-200 ${zoomed ? "scale-[2] cursor-zoom-out" : "cursor-zoom-in"}`}
            />

            {hasMany ? (
              <>
                <button
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute start-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80 sm:start-4"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute end-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80 sm:end-4"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </>
            ) : null}
          </div>

          {hasMany ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-xs font-medium text-white/90">
              {currentIndex + 1} / {total}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
