import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { signOut } from "@/app/actions/auth"
import { PageHeader } from "@/components/app-shell/page-header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Profile · Closetify" }

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" />
      <section className="rounded-2xl bg-card p-6">
        {/* Reading the session is request-time data, so it streams in behind Suspense. */}
        <Suspense
          fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}
        >
          <SignedInAs />
        </Suspense>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline" size="lg">
            Sign out
          </Button>
        </form>
      </section>
    </>
  )
}

async function SignedInAs() {
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
    <div>
      <p className="text-sm text-muted-foreground">Signed in as</p>
      <p className="mt-0.5 truncate font-medium">{profile?.email ?? "Unknown"}</p>
    </div>
  )
}
