// AI background removal (IMG.LY, in the browser). Too slow on phones, so it is NOT
// used in the add flow. Step 4b runs it in the background on the laptop for items
// that still have has_cutout = false.
import type { Config as CutoutConfig } from "@imgly/background-removal"

import { canvasToJpeg, drawScaled, fullBounds, loadImage, readPixels } from "@/lib/images/canvas"
import { canvasToWebp } from "@/lib/images/encode"
import { PHOTO_MAX_EDGE } from "@/lib/images/sizes"
import { coverage, opaqueBounds, padBounds } from "@/lib/images/trim"

export type CutoutPhotos = { cutout: Blob; thumb: Blob }

/** Phones and tablets are too slow for in-browser background removal. */
export function canRunAiCutout() {
  if (typeof navigator === "undefined") return false
  const ipadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return !ipadOs && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

let gpuCheck: Promise<boolean> | null = null
function hasWebGpu() {
  gpuCheck ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    if (!gpu) return false
    try {
      return (await gpu.requestAdapter()) !== null
    } catch {
      return false
    }
  })()
  return gpuCheck
}

function cutoutConfig(device: "gpu" | "cpu"): CutoutConfig {
  // Medium model (decision Q5): best quality/speed balance on a laptop.
  return { model: "isnet_fp16", device, output: { format: "image/png" } }
}

/**
 * Removes the background from a stored original photo and makes a trimmed cutout +
 * thumbnail. Uses the GPU (WebGPU) when available, otherwise the CPU.
 * Returns null when nothing usable was found.
 */
export async function aiCutout(original: Blob): Promise<CutoutPhotos | null> {
  const { removeBackground } = await import("@imgly/background-removal")

  // Smaller input = faster: the model works at about this size anyway.
  const image = await loadImage(original)
  const input = await canvasToJpeg(drawScaled(image, fullBounds(image), PHOTO_MAX_EDGE.cutout))

  const device = (await hasWebGpu()) ? "gpu" : "cpu"
  let png: Blob
  try {
    png = await removeBackground(input, cutoutConfig(device))
  } catch (error) {
    if (device !== "gpu") throw error
    png = await removeBackground(input, cutoutConfig("cpu"))
  }

  const result = await loadImage(png)
  const full = drawScaled(result, fullBounds(result), Number.POSITIVE_INFINITY)
  const bounds = opaqueBounds(readPixels(full))
  // Under 2% of the photo is almost always a failed cutout, not a tiny item.
  if (!bounds || coverage(bounds, full.width, full.height) < 0.02) return null

  const trimmed = padBounds(bounds, full.width, full.height)
  return {
    cutout: await canvasToWebp(drawScaled(full, trimmed, PHOTO_MAX_EDGE.cutout)),
    thumb: await canvasToWebp(drawScaled(full, trimmed, PHOTO_MAX_EDGE.thumb)),
  }
}
