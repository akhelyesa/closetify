// Browser-only photo processing for the add flow. Photos never leave the device here.
import { canvasToWebp } from "@/lib/images/encode"
import { isAcceptedPhoto, UNSUPPORTED_FORMAT_MESSAGE } from "@/lib/images/formats"
import { fitWithin, PHOTO_MAX_EDGE } from "@/lib/images/sizes"
import { coverage, opaqueBounds, padBounds, type Bounds } from "@/lib/images/trim"

/** A problem the user can act on; `message` is safe to show as-is. */
export class PhotoError extends Error {}

export type CutoutPhotos = { cutout: Blob; thumb: Blob }

export type CutoutProgress =
  | { stage: "download"; percent: number }
  | { stage: "processing" }

/** Opens a picked file and makes the 1600px WebP original. Keeps the canvas for later steps. */
export async function prepareOriginal(file: File) {
  if (!isAcceptedPhoto(file)) throw new PhotoError(UNSUPPORTED_FORMAT_MESSAGE)

  const image = await loadImage(file)
  const canvas = drawScaled(image, fullBounds(image), PHOTO_MAX_EDGE.original)
  const blob = await canvasToWebp(canvas)
  return { canvas, blob }
}

/**
 * Removes the background (IMG.LY medium model, in the browser), trims the empty
 * border and makes the cutout + thumbnail. Returns null when nothing usable was found.
 */
export async function prepareCutout(
  original: Blob,
  onProgress: (progress: CutoutProgress) => void,
): Promise<CutoutPhotos | null> {
  const { removeBackground } = await import("@imgly/background-removal")

  const png = await removeBackground(original, {
    model: "isnet_fp16",
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (key.startsWith("fetch:") && total > 0) {
        onProgress({ stage: "download", percent: Math.round((current / total) * 100) })
      } else {
        onProgress({ stage: "processing" })
      }
    },
  })

  const image = await loadImage(png)
  const full = drawScaled(image, fullBounds(image), Number.POSITIVE_INFINITY)
  const context = full.getContext("2d")
  if (!context) throw new Error("Canvas is not available")

  const bounds = opaqueBounds(context.getImageData(0, 0, full.width, full.height))
  // Under 2% of the photo is almost always a failed cutout, not a tiny item.
  if (!bounds || coverage(bounds, full.width, full.height) < 0.02) return null

  const trimmed = padBounds(bounds, full.width, full.height)
  return {
    cutout: await canvasToWebp(drawScaled(full, trimmed, PHOTO_MAX_EDGE.cutout)),
    thumb: await canvasToWebp(drawScaled(full, trimmed, PHOTO_MAX_EDGE.thumb)),
  }
}

/** "Keep background": cutout and thumbnail are made from the original photo. */
export async function prepareKeepBackground(original: HTMLCanvasElement): Promise<CutoutPhotos> {
  const bounds = fullBounds(original)
  return {
    cutout: await canvasToWebp(drawScaled(original, bounds, PHOTO_MAX_EDGE.cutout)),
    thumb: await canvasToWebp(drawScaled(original, bounds, PHOTO_MAX_EDGE.thumb)),
  }
}

// Decoding through <img> applies the photo's EXIF rotation in every current browser.
async function loadImage(blob: Blob) {
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

function fullBounds(source: { width: number; height: number }): Bounds {
  return { x: 0, y: 0, width: source.width, height: source.height }
}

function drawScaled(source: CanvasImageSource, area: Bounds, maxEdge: number) {
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
