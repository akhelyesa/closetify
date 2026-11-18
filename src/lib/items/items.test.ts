import { describe, expect, it } from "vitest"

import { fitWithin, PHOTO_MAX_EDGE } from "@/lib/images/sizes"
import { canonicalBrand, suggestBrands, uniqueBrands } from "@/lib/items/brands"
import { CATEGORIES, COLOR_KEYS, isSubcategoryOf } from "@/lib/items/options"
import { itemFolder, itemPhotoPaths } from "@/lib/items/paths"
import { itemDetailsSchema, newItemSchema } from "@/lib/items/schema"

const USER = "11111111-1111-4111-8111-111111111111"
const ITEM = "22222222-2222-4222-8222-222222222222"

describe("options", () => {
  it("has the 5 agreed categories", () => {
    expect(Object.values(CATEGORIES).map((c) => c.label)).toEqual([
      "Tops",
      "Bottoms",
      "Outerwear",
      "Shoes",
      "Accessories",
    ])
  })

  it("has 17 colors including cream", () => {
    expect(COLOR_KEYS).toHaveLength(17)
    expect(COLOR_KEYS).toContain("cream")
  })

  it("knows which subcategory belongs to which category", () => {
    expect(isSubcategoryOf("outerwear", "Overshirt")).toBe(true)
    expect(isSubcategoryOf("tops", "Overshirt")).toBe(false)
  })
})

describe("photo paths", () => {
  it("puts every photo in the item's own folder", () => {
    expect(itemFolder(USER, ITEM)).toBe(`${USER}/${ITEM}`)
    expect(itemPhotoPaths(USER, ITEM)).toEqual({
      original: `${USER}/${ITEM}/original.webp`,
      cutout: `${USER}/${ITEM}/cutout.webp`,
      thumb: `${USER}/${ITEM}/thumb.webp`,
    })
  })
})

describe("fitWithin", () => {
  it("scales a landscape photo down to the longest edge", () => {
    expect(fitWithin(4032, 3024, PHOTO_MAX_EDGE.original)).toEqual({ width: 1600, height: 1200 })
  })

  it("scales a portrait photo down to the longest edge", () => {
    expect(fitWithin(3024, 4032, PHOTO_MAX_EDGE.thumb)).toEqual({ width: 300, height: 400 })
  })

  it("never scales a small photo up", () => {
    expect(fitWithin(300, 200, PHOTO_MAX_EDGE.cutout)).toEqual({ width: 300, height: 200 })
  })

  it("rejects an image with no size", () => {
    expect(() => fitWithin(0, 100, 400)).toThrow()
  })
})

describe("brands", () => {
  const brands = uniqueBrands(["Zara", "ZARA", " zara ", "Bershka", null, "", "Polo Ralph Lauren"])

  it("keeps one entry per brand, ignoring case, using the newest casing", () => {
    expect(brands).toEqual(["Zara", "Bershka", "Polo Ralph Lauren"])
  })

  it("suggests brands that start with what was typed, any case", () => {
    expect(suggestBrands("za", brands)).toEqual(["Zara"])
    expect(suggestBrands("POLO", brands)).toEqual(["Polo Ralph Lauren"])
  })

  it("doesn't suggest the brand that's already fully typed", () => {
    expect(suggestBrands("zara", brands)).toEqual([])
  })

  it("reuses the existing casing for a known brand", () => {
    expect(canonicalBrand("zARA ", brands)).toBe("Zara")
    expect(canonicalBrand("Arket", brands)).toBe("Arket")
    expect(canonicalBrand("   ", brands)).toBeNull()
  })
})

describe("itemDetailsSchema", () => {
  it("accepts category alone and leaves everything else unset", () => {
    const result = itemDetailsSchema.parse({ category: "tops" })
    expect(result).toEqual({
      category: "tops",
      subcategory: null,
      colors: [],
      pattern: null,
      name: null,
      brand: null,
      size: null,
      notes: null,
    })
  })

  it("turns blank text into null instead of an empty value", () => {
    const result = itemDetailsSchema.parse({ category: "tops", name: "   ", brand: " Zara " })
    expect(result.name).toBeNull()
    expect(result.brand).toBe("Zara")
  })

  it("requires a category", () => {
    expect(itemDetailsSchema.safeParse({}).success).toBe(false)
  })

  it("rejects a subcategory from another category", () => {
    const result = itemDetailsSchema.safeParse({ category: "bottoms", subcategory: "Hoodie" })
    expect(result.success).toBe(false)
  })

  it("rejects unknown and repeated colors", () => {
    expect(itemDetailsSchema.safeParse({ category: "tops", colors: ["teal"] }).success).toBe(false)
    expect(
      itemDetailsSchema.safeParse({ category: "tops", colors: ["navy", "navy"] }).success,
    ).toBe(false)
  })

  it("keeps the main color first", () => {
    const result = itemDetailsSchema.parse({ category: "tops", colors: ["green", "cream"] })
    expect(result.colors).toEqual(["green", "cream"])
  })

  it("rejects denim as a pattern (it's a material)", () => {
    expect(itemDetailsSchema.safeParse({ category: "tops", pattern: "denim" }).success).toBe(false)
  })
})

describe("newItemSchema", () => {
  it("needs a real uuid for the item id", () => {
    const details = { category: "shoes" }
    expect(newItemSchema.safeParse({ id: ITEM, hasCutout: true, details }).success).toBe(true)
    expect(newItemSchema.safeParse({ id: "abc", hasCutout: true, details }).success).toBe(false)
  })
})
