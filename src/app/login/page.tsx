import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f7f6f3] px-6 py-16">
      <section className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Closetify</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Sign in to see your closet.
        </p>
        <AuthForm mode="sign-in" />
      </section>
    </main>
  )
}
