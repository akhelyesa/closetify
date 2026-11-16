"use server"

import { redirect } from "next/navigation"
import * as z from "zod"

import { createClient } from "@/lib/supabase/server"

const credentialsSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
})

export type AuthFormState = {
  error?: string
  fieldErrors?: {
    email?: string
    password?: string
  }
}

function readCredentials(formData: FormData): {
  data?: { email: string; password: string }
  state?: AuthFormState
} {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const fieldErrors: NonNullable<AuthFormState["fieldErrors"]> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if ((field === "email" || field === "password") && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return { state: { fieldErrors } }
  }

  return { data: parsed.data }
}

async function profileExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  return !error && Boolean(data)
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData)
  if (credentials.state || !credentials.data) return credentials.state ?? {}

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(credentials.data)

  if (error) return { error: error.message }

  if (!data.session || !data.user) {
    return {
      error:
        "Email confirmation is still required in Supabase. Turn off Confirm email, then try again.",
    }
  }

  if (!(await profileExists(supabase, data.user.id))) {
    return {
      error:
        "Your account was created, but no profile row exists yet. Apply the profiles migration, then sign in.",
    }
  }

  redirect("/closet")
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData)
  if (credentials.state || !credentials.data) return credentials.state ?? {}

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(credentials.data)

  if (error) return { error: error.message }

  redirect("/closet")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
