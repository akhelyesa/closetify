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
import {
  PhotoError,
  prepareCutout,
  prepareKeepBackground,
  prepareOriginal,
  type CutoutPhotos,
  type CutoutProgress,
} from "@/lib/images/process"
import { itemDetailsSchema } from "@/lib/items/schema"
import { uploadItemPhotos } from "@/lib/items/upload"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Stage =
  | { kind: "pick" }
  | { kind: "processing"; progress: CutoutProgress | null }
  | { kind: "review" }
  | { kind: "saving" }

export function AddItemFlow({ userId, brands }: { userId: string; brands: string[] }) {
  const router = useRouter()
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const originalCanvas = useRef<HTMLCanvasElement | null>(null)

  const [stage, setStage] = useState<Stage>({ kind: "pick" })
  const [original, setOriginal] = useState<Blob | null>(null)
  const [cutout, setCutout] = useState<CutoutPhotos | null>(null)
  const [kept, setKept] = useState<CutoutPhotos | null>(null)
  const [useCutout, setUseCutout] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormValue>(EMPTY_ITEM_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const chosen = useCutout && cutout ? cutout : kept
  const originalUrl = useObjectUrl(original)
  const previewUrl = useObjectUrl(chosen?.cutout ?? null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    reset()
    setStage({ kind: "processing", progress: null })

    let prepared: Awaited<ReturnType<typeof prepareOriginal>>
    try {
      prepared = await prepareOriginal(file)
    } catch (err) {
      setStage({ kind: "pick" })
      setError(err instanceof PhotoError ? err.message : "Couldn't open this photo. Try another one.")
      return
    }

    originalCanvas.current = prepared.canvas
    setOriginal(prepared.blob)

    let result: CutoutPhotos | null = null
    try {
      result = await prepareCutout(prepared.blob, (progress) =>
        setStage({ kind: "processing", progress }),
      )
    } catch (err) {
      console.error("Background removal failed", err)
    }

    if (result) {
      setCutout(result)
      setUseCutout(true)
    } else {
      // Never block the user on a bad cutout: keep the photo as it is.
      setKept(await prepareKeepBackground(prepared.canvas))
      setUseCutout(false)
      setNotice("Couldn't separate the item from the background, so the full photo is kept.")
    }
    setStage({ kind: "review" })
  }

  async function keepBackground() {
    if (!originalCanvas.current) return
    if (!kept) setKept(await prepareKeepBackground(originalCanvas.current))
    setUseCutout(false)
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
    if (!original || !chosen) return

    setStage({ kind: "saving" })
    const id = uuidV4()
    try {
      await uploadItemPhotos(createClient(), userId, id, {
        original,
        cutout: chosen.cutout,
        thumb: chosen.thumb,
      })
    } catch (err) {
      console.error("Photo upload failed", err)
      setStage({ kind: "review" })
      setError("Couldn't upload the photos. Check your connection and try again.")
      return
    }

    const result = await createItem({
      id,
      hasCutout: chosen === cutout,
      details: toDetailsInput(form),
    })
    if (!result.ok) {
      setStage({ kind: "review" })
      setFieldErrors(result.fieldErrors ?? {})
      setError(result.error)
      return
    }
    router.push("/closet")
  }

  function reset() {
    originalCanvas.current = null
    setOriginal(null)
    setCutout(null)
    setKept(null)
    setUseCutout(true)
    setNotice(null)
    setError(null)
  }

  const fileInputs = (
    <>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </>
  )

  if (stage.kind === "pick") {
    return (
      <div className="flex flex-col gap-4">
        {fileInputs}
        <div className="flex flex-col items-center rounded-2xl bg-card px-6 py-12 text-center">
          <p className="font-medium">Add a piece of clothing</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Lay it flat or hang it up, on a plain background if you can.
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
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </div>
    )
  }

  if (stage.kind === "processing") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <PhotoFrame src={originalUrl} alt="" className="opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <LoaderCircle aria-hidden className="size-6 animate-spin" />
          <p className="text-sm font-medium" aria-live="polite">
            {stage.progress?.stage === "download"
              ? `Downloading the background remover (one-time) ${stage.progress.percent}%`
              : original
                ? "Removing the background…"
                : "Opening photo…"}
          </p>
        </div>
      </div>
    )
  }

  const saving = stage.kind === "saving"

  return (
    <div className="flex flex-col gap-8">
      {fileInputs}
      <section className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-2xl bg-card">
          <PhotoFrame src={previewUrl ?? originalUrl} alt="Preview" />
        </div>

        {cutout ? (
          <div className="flex gap-2" role="group" aria-label="Photo style">
            <SegmentButton active={useCutout} onClick={() => setUseCutout(true)} disabled={saving}>
              Cutout
            </SegmentButton>
            <SegmentButton active={!useCutout} onClick={() => void keepBackground()} disabled={saving}>
              Keep background
            </SegmentButton>
          </div>
        ) : null}

        {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

        <button
          type="button"
          disabled={saving}
          onClick={() => libraryInput.current?.click()}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Use a different photo
        </button>
      </section>

      <ItemDetailsForm value={form} onChange={setForm} brands={brands} errors={fieldErrors} />

      <div className="flex flex-col gap-3">
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button size="lg" className="h-11 w-full" onClick={() => void save()} disabled={saving}>
          {saving ? (
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

function PhotoFrame({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-card p-6">
      {src ? (
        // Local preview of an object URL; next/image doesn't apply here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={cn("max-h-full max-w-full object-contain", className)} />
      ) : null}
    </div>
  )
}

function SegmentButton({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-10 flex-1 rounded-lg border text-sm font-medium transition-colors duration-150 disabled:opacity-50",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
        className,
      )}
      {...props}
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
