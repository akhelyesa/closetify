import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

const AUTH_PATHS = new Set(["/login", "/signup"])

function withSession(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }

  return to
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([header, value]) => {
          supabaseResponse.headers.set(header, value)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims?.sub)
  const isAuthPage = AUTH_PATHS.has(request.nextUrl.pathname)

  if (!isSignedIn && !isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return withSession(supabaseResponse, NextResponse.redirect(redirectUrl))
  }

  if (isSignedIn && isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/closet"
    return withSession(supabaseResponse, NextResponse.redirect(redirectUrl))
  }

  return supabaseResponse
}
