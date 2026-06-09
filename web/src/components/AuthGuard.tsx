"use client"

import { useGetMe } from "@/hooks/useAuth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import LoadingScreen from "./LoadingScreen"

const authRoutes = ["/login", "/signup", "/forgot-password"]

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading } = useGetMe()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace("/login")
    }
    // Reset the guard if auth state changes (e.g. user logs in).
    if (user) hasRedirected.current = false
  }, [isLoading, user, isAuthRoute, router])

  // Still resolving auth, or we know there's no user and are redirecting:
  // hold on the loader instead of flashing the protected page.
  if (!isAuthRoute && (isLoading || !user)) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

export default AuthGuard
