import { useRouter } from "next/navigation"
import { canGoBackInApp } from "@/components/NavigationTracker"

// Back if there's somewhere in the app to go back to; otherwise a fallback
// page instead of leaving the site.
export const useGoBack = (fallback = "/home") => {
  const router = useRouter()
  return () => (canGoBackInApp() ? router.back() : router.replace(fallback))
}
