// Fixed lists for item fields. They live in code (not the database),
// so adding a value is a one-line change here, no migration needed.

export const CATEGORIES = {
  tops: {
    label: "Tops",
    subcategories: [
      "T-shirt",
      "Shirt",
      "Polo",
      "Long sleeve",
      "Sweater",
      "Hoodie",
      "Sweatshirt",
      "Tank top",
    ],
  },
  bottoms: {
    label: "Bottoms",
    subcategories: ["Jeans", "Trousers", "Chinos", "Shorts", "Joggers", "Skirt"],
  },
  outerwear: {
    label: "Outerwear",
    subcategories: ["Jacket", "Coat", "Overshirt", "Blazer", "Puffer", "Vest"],
  },
  shoes: {
    label: "Shoes",
    subcategories: [
      "Sneakers",
      "Boots",
      "Loafers",
      "Dress shoes",
      "Sandals",
      "Sport shoes",
    ],
  },
  accessories: {
    label: "Accessories",
    subcategories: [
      "Hat/Cap",
      "Belt",
      "Bag",
      "Scarf",
      "Watch",
      "Jewelry",
      "Sunglasses",
    ],
  },
} as const satisfies Record<string, { label: string; subcategories: readonly string[] }>

export type Category = keyof typeof CATEGORIES
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[]

export function isSubcategoryOf(category: Category, subcategory: string) {
  return (CATEGORIES[category].subcategories as readonly string[]).includes(subcategory)
}

// Swatch hex values are only for the color picker; the stored value is the key.
export const COLORS = {
  black: { label: "Black", hex: "#111111" },
  white: { label: "White", hex: "#ffffff" },
  cream: { label: "Cream", hex: "#f1e9d6" },
  grey: { label: "Grey", hex: "#9a9a9a" },
  navy: { label: "Navy", hex: "#1f2a44" },
  blue: { label: "Blue", hex: "#2f5fb3" },
  light_blue: { label: "Light blue", hex: "#a9c6e8" },
  brown: { label: "Brown", hex: "#6b4a2f" },
  beige: { label: "Beige", hex: "#d6c4a1" },
  green: { label: "Green", hex: "#2f6b3f" },
  olive: { label: "Olive", hex: "#6b6b2f" },
  red: { label: "Red", hex: "#c0392b" },
  burgundy: { label: "Burgundy", hex: "#6d1f2c" },
  pink: { label: "Pink", hex: "#e8a5b8" },
  yellow: { label: "Yellow", hex: "#e8c547" },
  orange: { label: "Orange", hex: "#e07b2e" },
  purple: { label: "Purple", hex: "#6b4c9a" },
} as const

export type Color = keyof typeof COLORS
export const COLOR_KEYS = Object.keys(COLORS) as Color[]
export const MAX_COLORS = 6

export const PATTERNS = {
  solid: "Solid",
  stripes: "Stripes",
  check: "Check/plaid",
  print: "Print",
  texture: "Texture",
} as const

export type Pattern = keyof typeof PATTERNS
export const PATTERN_KEYS = Object.keys(PATTERNS) as Pattern[]

// Matches the check constraint in the items migration.
export const STATUSES = {
  clean: "Clean",
  in_wash: "In the wash",
  lent: "Lent out",
  archived: "Archived",
} as const

export type Status = keyof typeof STATUSES
export const STATUS_KEYS = Object.keys(STATUSES) as Status[]
