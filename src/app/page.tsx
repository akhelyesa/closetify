import { redirect } from "next/navigation"

// Closet is the home screen until Today is built (M3).
export default function HomePage() {
  redirect("/closet")
}
