import { WEBP_QUALITY } from "@/lib/images/sizes"

/**
 * Canvas → WebP. Uses the browser's encoder when it really produces WebP (Chrome, Android).
 * iPhone Safari silently returns PNG instead, so then we encode with libwebp (WebAssembly),
 * which is only downloaded when needed. Everything stored stays WebP.
 */
export async function canvasToWebp(canvas: HTMLCanvasElement, quality = WEBP_QUALITY) {
  const native = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  )
  if (native && native.type === "image/webp") return native

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available")
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)

  const { encode } = await import("@jsquash/webp")
  const buffer = await encode(pixels, { quality: Math.round(quality * 100) })
  return new Blob([buffer], { type: "image/webp" })
}
