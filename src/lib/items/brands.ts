const normalize = (brand: string) => brand.trim().toLocaleLowerCase()

/**
 * One entry per brand, ignoring case. Keeps the casing used most recently,
 * so `brands` should be ordered newest first.
 */
export function uniqueBrands(brands: readonly (string | null | undefined)[]) {
  const seen = new Map<string, string>()
  for (const brand of brands) {
    const trimmed = brand?.trim()
    if (!trimmed) continue
    const key = normalize(trimmed)
    if (!seen.has(key)) seen.set(key, trimmed)
  }
  return [...seen.values()]
}

/** Brands that start with what the user typed, case-insensitive. Exact matches are left out. */
export function suggestBrands(query: string, brands: readonly string[], limit = 5) {
  const q = normalize(query)
  if (!q) return []
  return brands
    .filter((brand) => {
      const b = normalize(brand)
      return b.startsWith(q) && b !== q
    })
    .slice(0, limit)
}

/**
 * If the typed brand matches one the user already has (ignoring case),
 * use the existing casing so "zara" doesn't become a second "Zara".
 */
export function canonicalBrand(input: string, brands: readonly string[]) {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = brands.find((brand) => normalize(brand) === normalize(trimmed))
  return match ?? trimmed
}
