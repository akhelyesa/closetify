// Browser-only canvas helpers shared by photo processing.
import { fitWithin } from "@/lib/images/sizes"
import type { Bounds } from "@/lib/images/trim"

/** A problem the user can act on; `message` is safe to show as-is. */
export class PhotoError extends Error {}

// Decoding through <img> applies the photo's EXIF rotation in every current browser.
export async function loadImage(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.src = url
  try {
    await image.decode()
    return image
  } catch {
    throw new PhotoError("Couldn't open this photo. Try a JPG or PNG.")
  } finally {
    // The decoded pixels stay available for drawing after the URL is released.
    URL.revokeObjectURL(url)
  }
}

export function fullBounds(source: { width: number; height: number }): Bounds {
  return { x: 0, y: 0, width: source.width, height: source.height }
}

export function drawScaled(source: CanvasImageSource, area: Bounds, maxEdge: number) {
  const { width, height } = fitWithin(area.width, area.height, maxEdge)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available")
  context.imageSmoothingQuality = "high"
  context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, width, height)
  return canvas
}

export function readPixels(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available")
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/** JPEG is encoded natively everywhere (including iPhone), so it's the fast choice for model input. */
export async function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.9) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  if (!blob) throw new Error("Couldn't encode the photo")
  return blob
}
