"use client";

/**
 * PhotoUploader — multi-image picker shared by the post-ad and post-part forms.
 * Accumulates photos in state so the seller can add across several picks,
 * preview them, drop the wrong ones, and pick the cover. Supports the device
 * camera (capture="environment" → rear camera on phones) and compresses every
 * image client-side before it's handed back, so oversized shots never error.
 *
 * Controlled: the parent owns `photos` (array of { id, file, url }) and reads
 * `photos.map(p => p.file)` at submit time. `onBusyChange` lets the parent
 * disable its submit button while compression runs.
 */

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import { compressImage } from "@/lib/image";

// Keep in sync with the backend: MAX_IMAGES_PER_AD (15) and
// MAX_IMAGE_SIZE_BYTES (8MB) in backend/src/config/env.js.
const MAX_PHOTOS = 15;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function PhotoUploader({ photos, setPhotos, onError, onBusyChange }) {
  const { t } = useLanguage();
  const [processing, setProcessing] = useState(false);

  // Revoke preview object URLs on unmount so we don't leak blobs. The ref is
  // kept in sync via effect (writing a ref during render is disallowed).
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function setBusy(value) {
    setProcessing(value);
    onBusyChange?.(value);
  }

  async function addPhotos(event) {
    const incoming = Array.from(event.target.files || []);
    event.target.value = ""; // reset so re-picking the same file (or adding more) fires onChange
    if (!incoming.length) return;
    onError?.("");

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      onError?.(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setBusy(true);
    const accepted = [];
    let warn = "";
    for (const file of incoming) {
      if (accepted.length >= room) {
        warn = `You can upload up to ${MAX_PHOTOS} photos.`;
        break;
      }
      if (!file.type.startsWith("image/")) continue;

      // Shrink client-side so oversized phone/camera photos just work
      // instead of erroring out. Falls back to the original on any failure.
      let prepared = file;
      try { prepared = await compressImage(file); } catch { prepared = file; }

      if (prepared.size > MAX_PHOTO_BYTES) {
        warn = `"${file.name}" is too large even after optimizing and was skipped.`;
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file: prepared,
        url: URL.createObjectURL(prepared),
      });
    }

    if (warn) onError?.(warn);
    if (accepted.length) setPhotos((prev) => [...prev, ...accepted]);
    setBusy(false);
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function makeCover(id) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  }

  const tileClass = `flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] text-center text-[var(--hw-text-muted)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)] ${processing ? "pointer-events-none opacity-50" : "cursor-pointer"}`;

  return (
    <div className="text-sm font-bold text-[var(--hw-text-secondary)]">
      <span>{t("form.images")}<span className="text-[var(--hw-red)]" aria-hidden="true"> *</span></span>
      <span className="ml-2 font-normal text-[var(--hw-text-muted)]">
        {photos.length}/{MAX_PHOTOS} — {t("form.imagesHint")}
      </span>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            {index === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded bg-[var(--hw-orange)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)]">
                {t("form.coverPhoto")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(photo.id)}
                className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100 hover:bg-[var(--hw-orange)]"
              >
                {t("form.makeCover")}
              </button>
            )}
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              aria-label={t("form.removePhoto")}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-base font-black leading-none text-white hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <>
            <label className={tileClass}>
              <span className="text-2xl leading-none">＋</span>
              <span className="text-xs font-bold">{t("form.addPhotos")}</span>
              <input type="file" accept="image/*" multiple disabled={processing} onChange={addPhotos} className="hidden" />
            </label>
            <label className={tileClass}>
              <CameraIcon />
              <span className="text-xs font-bold">{t("form.takePhoto")}</span>
              <input type="file" accept="image/*" capture="environment" disabled={processing} onChange={addPhotos} className="hidden" />
            </label>
          </>
        ) : null}
      </div>
      {processing ? (
        <p className="mt-2 text-xs font-bold text-[var(--hw-orange)] animate-pulse">{t("form.optimizing")}</p>
      ) : null}
    </div>
  );
}
