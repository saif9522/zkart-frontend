/**
 * Shrinks photos in the browser BEFORE upload — a 2 MB phone/PNG photo becomes
 * ~150-300 KB, so uploads (browser → server → Hostinger) are many times faster
 * and customers' pages load faster too. Looks the same on screen.
 *
 * Skipped: non-images, GIF (animation), SVG, files already small, and any case
 * where the "compressed" file would come out bigger than the original.
 */
const SKIP_TYPES = ['image/gif', 'image/svg+xml']
const SMALL_ENOUGH = 250 * 1024

// KYC documents keep more detail so the text stays readable.
const DOC_FIELD = /(aadhaar|pan|licen|document|proof|cheque|certificate|registration|kyc|gst|fssai)/i

export async function compressImage(file: File, fieldName = ''): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.includes(file.type) || file.size <= SMALL_ENOUGH) return file
  const isDoc = DOC_FIELD.test(fieldName)
  const maxSide = isDoc ? 2200 : 1600
  const quality = isDoc ? 0.88 : 0.82

  try {
    const bitmap = await loadBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    let blob = await toBlob(canvas, ctx, bitmap, w, h, 'image/webp', quality)
    // Safari can't encode WebP (returns PNG) → use JPEG on a white background instead.
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, ctx, bitmap, w, h, 'image/jpeg', quality, true)
    if ('close' in bitmap) (bitmap as ImageBitmap).close()
    if (!blob || blob.size >= file.size) return file

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() })
  } catch {
    return file // never block an upload because compression failed
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    } catch {
      /* fall back to <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  src: ImageBitmap | HTMLImageElement,
  w: number,
  h: number,
  type: string,
  quality: number,
  whiteBackground = false
): Promise<Blob | null> {
  ctx.clearRect(0, 0, w, h)
  if (whiteBackground) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Returns a copy of the FormData with every image file compressed. */
export async function compressFormData(form: FormData): Promise<FormData> {
  const entries = Array.from(form.entries())
  if (!entries.some(([, v]) => v instanceof File && v.type.startsWith('image/'))) return form
  const out = new FormData()
  for (const [key, value] of entries) {
    if (value instanceof File) out.append(key, await compressImage(value, key), undefined)
    else out.append(key, value)
  }
  return out
}
