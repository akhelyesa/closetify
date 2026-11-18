import { describe, expect, it } from "vitest"

import { isAcceptedPhoto, uuidV4 } from "@/lib/images/formats"
import { coverage, opaqueBounds, padBounds } from "@/lib/images/trim"

/** Builds a fake RGBA image where only the given pixels are opaque. */
function pixels(width: number, height: number, opaque: [number, number][]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = 255
  return { data, width, height }
}

describe("isAcceptedPhoto", () => {
  it("accepts JPEG, PNG and WebP", () => {
    expect(isAcceptedPhoto({ type: "image/jpeg", name: "a.jpg" })).toBe(true)
    expect(isAcceptedPhoto({ type: "image/png", name: "a.png" })).toBe(true)
    expect(isAcceptedPhoto({ type: "image/webp", name: "a.webp" })).toBe(true)
  })

  it("rejects HEIC and other formats", () => {
    expect(isAcceptedPhoto({ type: "image/heic", name: "IMG_1.HEIC" })).toBe(false)
    expect(isAcceptedPhoto({ type: "image/gif", name: "a.gif" })).toBe(false)
  })

  it("falls back to the file name when the type is missing", () => {
    expect(isAcceptedPhoto({ type: "", name: "photo.JPEG" })).toBe(true)
    expect(isAcceptedPhoto({ type: "", name: "photo.heic" })).toBe(false)
  })
})

describe("uuidV4", () => {
  it("makes valid, different v4 UUIDs", () => {
    const a = uuidV4()
    const b = uuidV4()
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(a).not.toBe(b)
  })
})

describe("opaqueBounds", () => {
  it("finds the box around the visible pixels", () => {
    expect(opaqueBounds(pixels(10, 10, [[2, 3], [6, 8]]))).toEqual({
      x: 2,
      y: 3,
      width: 5,
      height: 6,
    })
  })

  it("returns null for a fully transparent image (failed cutout)", () => {
    expect(opaqueBounds(pixels(10, 10, []))).toBeNull()
  })

  it("ignores nearly invisible pixels", () => {
    const image = pixels(10, 10, [[5, 5]])
    image.data[(0 * 10 + 0) * 4 + 3] = 5
    expect(opaqueBounds(image)).toEqual({ x: 5, y: 5, width: 1, height: 1 })
  })
})

describe("padBounds", () => {
  it("adds room around the item", () => {
    expect(padBounds({ x: 100, y: 100, width: 200, height: 100 }, 1000, 1000)).toEqual({
      x: 92,
      y: 92,
      width: 216,
      height: 116,
    })
  })

  it("never goes outside the image", () => {
    expect(padBounds({ x: 0, y: 0, width: 1000, height: 500 }, 1000, 500)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 500,
    })
  })
})

describe("coverage", () => {
  it("is the share of the image the item covers", () => {
    expect(coverage({ x: 0, y: 0, width: 50, height: 50 }, 100, 100)).toBe(0.25)
  })
})
