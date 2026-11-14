import { Suspense } from "react"
import { redirect } from "next/navigation"

import { signOut } from "@/app/actions/auth"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f7f6f3] px-6 py-16">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        }
      >
        <SignedInHome />
      </Suspense>
    </main>
  )
}

async function SignedInHome() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  return (
    <section className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight">Closetify</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {profile?.email ?? "Signed in, profile missing"}
      </p>
      <form action={signOut} className="mt-8">
        <button type="submit" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Sign out
        </button>
      </form>
    </section>
  )
}
