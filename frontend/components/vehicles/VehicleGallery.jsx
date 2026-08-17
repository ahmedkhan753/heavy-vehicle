"use client";

import { useState } from "react";
import Image from "next/image";

export default function VehicleGallery({ images, title, fallbackImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Use either the provided images array or a mock array with the fallback image
  const displayImages = images && images.length > 0 
    ? images 
    : [{ url: fallbackImage, publicId: "fallback" }];

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);

  return (
    <>
      {/* Main Gallery Container */}
      <div className="overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] group relative">
        <div className="relative aspect-[16/9] w-full cursor-pointer bg-black/5" onClick={openLightbox}>
          <Image
            src={displayImages[currentIndex].url || fallbackImage}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
          />
        </div>

        {/* Navigation Arrows (only show if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 flex items-center justify-center"
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 flex items-center justify-center"
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
        
        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 border-t border-[var(--hw-border-subtle)] p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--hw-border-strong)] scrollbar-track-transparent">
            {displayImages.map((item, idx) => (
              <button
                key={item.publicId || item.url || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`relative h-20 min-w-28 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  idx === currentIndex ? "border-[var(--hw-orange)]" : "border-transparent hover:border-[var(--hw-border-strong)]"
                }`}
              >
                <Image
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeLightbox}>
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          
          <div 
            className="relative h-full max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()} 
          >
            <Image
              src={displayImages[currentIndex].url || fallbackImage}
              alt={`${title} - Lightbox`}
              fill
              className="object-contain"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 flex items-center justify-center transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 flex items-center justify-center transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>
          
          {/* Lightbox text/counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-white/90 text-sm font-medium">
              {currentIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
