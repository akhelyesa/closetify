"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, ImageIcon, LoaderCircle } from "lucide-react"

import { createItem } from "@/app/actions/items"
import {
  EMPTY_ITEM_FORM,
  ItemDetailsForm,
  toDetailsInput,
  type ItemFormValue,
} from "@/components/items/item-details-form"
import { Button } from "@/components/ui/button"
import { uuidV4 } from "@/lib/images/formats"
import { PhotoError, preparePhotos, type PreparedPhotos } from "@/lib/images/process"
import { itemDetailsSchema } from "@/lib/items/schema"
import { uploadItemPhotos } from "@/lib/items/upload"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Stage = "pick" | "preparing" | "review" | "saving"

export function AddItemFlow({ userId, brands }: { userId: string; brands: string[] }) {
  const router = useRouter()
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  // Each picked photo gets a run number, so a slow result from an earlier pick is ignored.
  const run = useRef(0)

  const [stage, setStage] = useState<Stage>("pick")
  const [photos, setPhotos] = useState<PreparedPhotos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormValue>(EMPTY_ITEM_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const previewUrl = useObjectUrl(photos?.cutout ?? null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const thisRun = ++run.current
    setError(null)
    setStage("preparing")

    try {
      const prepared = await preparePhotos(file)
      if (run.current !== thisRun) return
      setPhotos(prepared)
      setStage("review")
    } catch (err) {
      if (run.current !== thisRun) return
      console.error("Preparing photo failed", err)
      setStage(photos ? "review" : "pick")
      setError(err instanceof PhotoError ? err.message : "Couldn't open this photo. Try another one.")
    }
  }

  async function save() {
    setError(null)
    const details = itemDetailsSchema.safeParse(toDetailsInput(form))
    if (!details.success) {
      const errors: Record<string, string> = {}
      for (const issue of details.error.issues) errors[String(issue.path[0])] ??= issue.message
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    if (!photos) return

    setStage("saving")
    const id = uuidV4()
    try {
      await uploadItemPhotos(createClient(), userId, id, photos)
    } catch (err) {
      console.error("Photo upload failed", err)
      setStage("review")
      setError("Couldn't upload the photos. Check your connection and try again.")
      return
    }

    const result = await createItem({ id, hasCutout: photos.hasCutout, details: toDetailsInput(form) })
    if (!result.ok) {
      setStage("review")
      setFieldErrors(result.fieldErrors ?? {})
      setError(result.error)
      return
    }
    router.push("/closet")
  }

  const fileInputs = (
    <>
      <PhotoInput inputRef={cameraInput} capture onFile={handleFile} />
      <PhotoInput inputRef={libraryInput} onFile={handleFile} />
    </>
  )

  if (stage === "pick") {
    return (
      <div className="flex flex-col gap-4">
        {fileInputs}
        <div className="flex flex-col items-center rounded-2xl bg-card px-6 py-12 text-center">
          <p className="font-medium">Add a piece of clothing</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Lay it flat or hang it up, on a plain background.
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Button size="lg" className="h-11" onClick={() => cameraInput.current?.click()}>
              <Camera /> Take photo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11"
              onClick={() => libraryInput.current?.click()}
            >
              <ImageIcon /> Choose from library
            </Button>
          </div>
          <p className="mt-8 max-w-xs text-xs leading-relaxed text-muted-foreground">
            On iPhone, touch and hold the item in Photos, then Share → Save Image. Pick that image
            here and the background is already gone.
          </p>
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </div>
    )
  }

  if (stage === "preparing" && !photos) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-card" aria-busy>
        <span className="sr-only">Preparing photo</span>
        <div className="absolute inset-0 animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-muted to-transparent motion-reduce:animate-none" />
      </div>
    )
  }

  const busy = stage === "saving" || stage === "preparing"

  return (
    <div className="flex flex-col gap-8">
      {fileInputs}
      <section className="flex flex-col gap-3">
        <div className={cn("overflow-hidden rounded-2xl bg-card transition-opacity duration-200", stage === "preparing" && "opacity-50")}>
          <div className="flex aspect-square w-full items-center justify-center p-6">
            {previewUrl ? (
              // Local preview of an object URL; next/image doesn't apply here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
            ) : null}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => libraryInput.current?.click()}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          Use a different photo
        </button>
      </section>

      <ItemDetailsForm value={form} onChange={setForm} brands={brands} errors={fieldErrors} />

      <div className="flex flex-col gap-3">
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button size="lg" className="h-11 w-full" onClick={() => void save()} disabled={busy}>
          {stage === "saving" ? (
            <>
              <LoaderCircle className="animate-spin" /> Saving…
            </>
          ) : (
            "Save item"
          )}
        </Button>
      </div>
    </div>
  )
}

function PhotoInput({
  inputRef,
  capture,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  capture?: boolean
  onFile: (file: File | undefined) => void
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture={capture ? "environment" : undefined}
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        onFile(e.target.files?.[0])
        e.target.value = ""
      }}
    />
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      {children}
    </p>
  )
}

/** An object URL for a blob that is released when the blob changes or the screen closes. */
function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}
