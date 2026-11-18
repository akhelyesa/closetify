"use client"

import { useId } from "react"

import { Chip } from "@/components/items/chip"
import { suggestBrands } from "@/lib/items/brands"
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COLOR_KEYS,
  COLORS,
  MAX_COLORS,
  PATTERN_KEYS,
  PATTERNS,
  type Category,
  type Color,
  type Pattern,
} from "@/lib/items/options"
import type { ItemDetailsInput } from "@/lib/items/schema"
import { cn } from "@/lib/utils"

export type ItemFormValue = {
  category: Category | null
  subcategory: string | null
  colors: Color[]
  pattern: Pattern | null
  name: string
  brand: string
  size: string
  notes: string
}

export const EMPTY_ITEM_FORM: ItemFormValue = {
  category: null,
  subcategory: null,
  colors: [],
  pattern: null,
  name: "",
  brand: "",
  size: "",
  notes: "",
}

/** Form state → what the item schema validates. A missing category fails validation on purpose. */
export function toDetailsInput(value: ItemFormValue): ItemDetailsInput {
  return { ...value, category: value.category as Category }
}

/** Shared by Add and (later) Edit. Controlled: the parent owns the value. */
export function ItemDetailsForm({
  value,
  onChange,
  brands,
  errors = {},
}: {
  value: ItemFormValue
  onChange: (value: ItemFormValue) => void
  brands: readonly string[]
  errors?: Record<string, string>
}) {
  const id = useId()
  const set = (patch: Partial<ItemFormValue>) => onChange({ ...value, ...patch })
  const brandSuggestions = suggestBrands(value.brand, brands)

  function toggleColor(color: Color) {
    if (value.colors.includes(color)) {
      set({ colors: value.colors.filter((c) => c !== color) })
    } else if (value.colors.length < MAX_COLORS) {
      set({ colors: [...value.colors, color] })
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <Field label="Category" required error={errors.category}>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((key) => (
            <Chip
              key={key}
              selected={value.category === key}
              onClick={() =>
                set({
                  category: key,
                  // A type from another category no longer fits.
                  subcategory: value.category === key ? value.subcategory : null,
                })
              }
            >
              {CATEGORIES[key].label}
            </Chip>
          ))}
        </div>
      </Field>

      {value.category ? (
        <Field label="Type" error={errors.subcategory}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES[value.category].subcategories.map((sub) => (
              <Chip
                key={sub}
                selected={value.subcategory === sub}
                onClick={() => set({ subcategory: value.subcategory === sub ? null : sub })}
              >
                {sub}
              </Chip>
            ))}
          </div>
        </Field>
      ) : null}

      <Field
        label="Colors"
        hint={value.colors.length > 0 ? colorSummary(value.colors) : "Tap the main color first."}
        error={errors.colors}
      >
        <div className="grid grid-cols-6 gap-3 sm:grid-cols-9">
          {COLOR_KEYS.map((key) => {
            const order = value.colors.indexOf(key)
            const selected = order !== -1
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={COLORS[key].label}
                title={COLORS[key].label}
                onClick={() => toggleColor(key)}
                className={cn(
                  "relative size-10 justify-self-center rounded-full border border-black/10 transition-shadow duration-150 outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: COLORS[key].hex }}
              >
                {selected ? (
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                    {order + 1}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Pattern" error={errors.pattern}>
        <div className="flex flex-wrap gap-2">
          {PATTERN_KEYS.map((key) => (
            <Chip
              key={key}
              selected={value.pattern === key}
              onClick={() => set({ pattern: value.pattern === key ? null : key })}
            >
              {PATTERNS[key]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Name" htmlFor={`${id}-name`} error={errors.name}>
        <TextInput
          id={`${id}-name`}
          value={value.name}
          onChange={(name) => set({ name })}
          placeholder="Green plaid shirt"
          maxLength={120}
        />
      </Field>

      <Field label="Brand" htmlFor={`${id}-brand`} error={errors.brand}>
        <TextInput
          id={`${id}-brand`}
          value={value.brand}
          onChange={(brand) => set({ brand })}
          placeholder="Zara"
          maxLength={80}
          autoComplete="off"
        />
        {brandSuggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {brandSuggestions.map((brand) => (
              <Chip key={brand} selected={false} onClick={() => set({ brand })}>
                {brand}
              </Chip>
            ))}
          </div>
        ) : null}
      </Field>

      <Field label="Size" htmlFor={`${id}-size`} error={errors.size}>
        <TextInput
          id={`${id}-size`}
          value={value.size}
          onChange={(size) => set({ size })}
          placeholder="M, 32/32, EU 43"
          maxLength={40}
        />
      </Field>

      <Field label="Notes" htmlFor={`${id}-notes`} error={errors.notes}>
        <textarea
          id={`${id}-notes`}
          value={value.notes}
          onChange={(event) => set({ notes: event.target.value })}
          maxLength={1000}
          rows={3}
          className={inputClass}
        />
      </Field>
    </div>
  )
}

function colorSummary(colors: readonly Color[]) {
  const [main, ...rest] = colors.map((c) => COLORS[c].label)
  return rest.length > 0 ? `Main: ${main} · Also: ${rest.join(", ")}` : `Main: ${main}`
}

const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function TextInput({
  onChange,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange"> & { onChange: (value: string) => void }) {
  return <input type="text" onChange={(e) => onChange(e.target.value)} className={inputClass} {...props} />
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  const LabelTag = htmlFor ? "label" : "p"
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <LabelTag htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required ? null : <span className="font-normal text-muted-foreground"> · optional</span>}
        </LabelTag>
        {hint ? <span className="truncate text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
