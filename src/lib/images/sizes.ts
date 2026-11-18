/** Longest edge in pixels for each stored photo. */
export const PHOTO_MAX_EDGE = {
  original: 1600,
  cutout: 1024,
  thumb: 400,
} as const

export const WEBP_QUALITY = 0.8

/** Uploaded photos never change under the same name, so browsers may cache them for a year. */
export const PHOTO_CACHE_SECONDS = 60 * 60 * 24 * 365

/**
 * Scales width × height down so the longest edge is at most `maxEdge`,
 * keeping the aspect ratio. Never scales up.
 */
export function fitWithin(width: number, height: number, maxEdge: number) {
  if (width <= 0 || height <= 0) {
    throw new Error("Image has no size")
  }

  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }

  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
