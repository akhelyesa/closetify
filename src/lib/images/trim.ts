export type Bounds = { x: number; y: number; width: number; height: number }

type RgbaPixels = { data: ArrayLike<number>; width: number; height: number }

/**
 * The smallest box around every pixel that isn't (nearly) transparent.
 * Returns null when the whole image is transparent: the cutout found nothing.
 */
export function opaqueBounds({ data, width, height }: RgbaPixels, minAlpha = 16): Bounds | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) >= minAlpha) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Adds breathing room around the clothing (a share of its longest side), kept inside the image. */
export function padBounds(
  bounds: Bounds,
  imageWidth: number,
  imageHeight: number,
  ratio = 0.04,
): Bounds {
  const pad = Math.round(Math.max(bounds.width, bounds.height) * ratio)
  const x = Math.max(0, bounds.x - pad)
  const y = Math.max(0, bounds.y - pad)
  return {
    x,
    y,
    width: Math.min(imageWidth, bounds.x + bounds.width + pad) - x,
    height: Math.min(imageHeight, bounds.y + bounds.height + pad) - y,
  }
}

/** Share of the image covered by the clothing. A tiny share usually means a bad cutout. */
export function coverage(bounds: Bounds, imageWidth: number, imageHeight: number) {
  return (bounds.width * bounds.height) / (imageWidth * imageHeight)
}
