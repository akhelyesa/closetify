const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ACCEPTED_EXTENSION = /\.(jpe?g|png|webp)$/i

export const UNSUPPORTED_FORMAT_MESSAGE =
  "This photo format isn't supported, try a JPG or PNG."

/** JPEG, PNG and WebP are accepted. HEIC and everything else is not (no conversion in M1). */
export function isAcceptedPhoto(file: { type: string; name: string }) {
  if (ACCEPTED_TYPES.has(file.type)) return true
  // Some browsers leave the type empty; fall back to the file name.
  return file.type === "" && ACCEPTED_EXTENSION.test(file.name)
}

/** Random v4 UUID. Works on plain http too (phone testing over the local network), unlike crypto.randomUUID. */
export function uuidV4() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
