export const ITEMS_BUCKET = "items"

export type ItemPhotoPaths = {
  original: string
  cutout: string
  thumb: string
}

/** Folder for one item: <user_id>/<item_id>. Deleting an item deletes this folder. */
export function itemFolder(userId: string, itemId: string) {
  return `${userId}/${itemId}`
}

/** File names for a new item. Replaced photos get new names later (cache busting). */
export function itemPhotoPaths(userId: string, itemId: string): ItemPhotoPaths {
  const folder = itemFolder(userId, itemId)
  return {
    original: `${folder}/original.webp`,
    cutout: `${folder}/cutout.webp`,
    thumb: `${folder}/thumb.webp`,
  }
}
