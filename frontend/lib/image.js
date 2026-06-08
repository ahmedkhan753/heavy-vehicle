/**
 * Client-side image compression for uploads.
 * ──────────────────────────────────────────
 * Downscales large photos and re-encodes them to JPEG before upload, so
 * oversized phone/camera shots (often 5–12MB) just work instead of tripping
 * the server's size limit. EXIF orientation is corrected where supported.
 *
 * Browser-only APIs are used strictly inside the functions, which are only
 * ever called from client event handlers — safe to import into client comps.
 */

const MAX_PHOTO_DIM = 1600;
const COMPRESS_TARGET_BYTES = 2 * 1024 * 1024;

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

// Decode a file to something drawable, correcting EXIF orientation when the
// browser supports it (phone photos are frequently rotated otherwise).
async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {}
    try { return await createImageBitmap(file); } catch {}
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
    img.src = url;
  });
}

/**
 * Downscale + re-encode an image so it's comfortably within the upload limit.
 * Returns the original file untouched if it can't be decoded or if compression
 * wouldn't actually make it smaller.
 */
export async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;

  let source;
  try {
    source = await decodeImage(file);
  } catch {
    return file; // e.g. HEIC on a browser that can't decode it — let the size guard handle it
  }

  const sw = source.width || source.naturalWidth;
  const sh = source.height || source.naturalHeight;
  if (!sw || !sh) { source.close?.(); return file; }

  const scale = Math.min(1, MAX_PHOTO_DIM / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // flatten any transparency (JPEG has no alpha)
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  source.close?.();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob && blob.size > COMPRESS_TARGET_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (!blob || blob.size >= file.size) return file; // never upload something bigger
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
