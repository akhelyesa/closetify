import * as z from "zod"

import {
  CATEGORY_KEYS,
  COLOR_KEYS,
  isSubcategoryOf,
  MAX_COLORS,
  PATTERN_KEYS,
} from "@/lib/items/options"

/** Trims text; empty text becomes null (an unset field, never an invented value). */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null))

/** Details from the add/edit form. Photo + category are the only required parts. */
export const itemDetailsSchema = z
  .object({
    category: z.enum(CATEGORY_KEYS, { error: "Pick a category." }),
    subcategory: optionalText(40),
    colors: z
      .array(z.enum(COLOR_KEYS))
      .max(MAX_COLORS, { error: `Pick up to ${MAX_COLORS} colors.` })
      .refine((colors) => new Set(colors).size === colors.length, {
        error: "Each color can only be picked once.",
      })
      .default([]),
    pattern: z.enum(PATTERN_KEYS).nullish().transform((value) => value ?? null),
    name: optionalText(120),
    brand: optionalText(80),
    size: optionalText(40),
    notes: optionalText(1000),
  })
  .refine(
    (item) => !item.subcategory || isSubcategoryOf(item.category, item.subcategory),
    { error: "That type doesn't belong to this category.", path: ["subcategory"] },
  )

/** A new item: the id is generated in the browser so the photos could be uploaded first. */
export const newItemSchema = z.object({
  id: z.uuid(),
  hasCutout: z.boolean(),
  details: itemDetailsSchema,
})

export type ItemDetailsInput = z.input<typeof itemDetailsSchema>
export type ItemDetails = z.output<typeof itemDetailsSchema>
export type NewItemInput = z.input<typeof newItemSchema>
