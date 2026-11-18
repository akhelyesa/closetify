// Browser-only photo processing for the add flow. Fast on every device: no AI here.
// Photos never leave the device until the user saves.
import { drawScaled, fullBounds, loadImage, PhotoError, readPixels } from "@/lib/images/canvas"
import { canvasToWebp } from "@/lib/images/encode"
import { isAcceptedPhoto, UNSUPPORTED_FORMAT_MESSAGE } from "@/lib/images/formats"
import { PHOTO_MAX_EDGE } from "@/lib/images/sizes"
import { hasTransparentBackground, opaqueBounds, padBounds } from "@/lib/images/trim"

export { PhotoError }

export type PreparedPhotos = {
  original: Blob
  cutout: Blob
  thumb: Blob
  /** True when the picked photo already had its background removed (e.g. iPhone "lift subject"). */
  hasCutout: boolean
}

/**
 * Turns a picked photo into the 3 stored WebP files.
 * - Photo with a transparent background → trimmed cutout + thumbnail, has_cutout = true.
 * - Normal photo → cutout + thumbnail from the full photo, has_cutout = false
 *   (the laptop adds a real cutout later, in the background).
 */
export async function preparePhotos(file: File): Promise<PreparedPhotos> {
  if (!isAcceptedPhoto(file)) throw new PhotoError(UNSUPPORTED_FORMAT_MESSAGE)

  const image = await loadImage(file)
  const original = drawScaled(image, fullBounds(image), PHOTO_MAX_EDGE.original)
  const originalBlob = canvasToWebp(original)

  // Check transparency at cutout size: plenty of detail, much less work than full size.
  const working = drawScaled(original, fullBounds(original), PHOTO_MAX_EDGE.cutout)
  const pixels = readPixels(working)
  const bounds = hasTransparentBackground(pixels) ? opaqueBounds(pixels) : null

  const area = bounds ? padBounds(bounds, working.width, working.height) : fullBounds(working)
  const [originalWebp, cutout, thumb] = await Promise.all([
    originalBlob,
    canvasToWebp(drawScaled(working, area, PHOTO_MAX_EDGE.cutout)),
    canvasToWebp(drawScaled(working, area, PHOTO_MAX_EDGE.thumb)),
  ])

  return { original: originalWebp, cutout, thumb, hasCutout: bounds !== null }
}
