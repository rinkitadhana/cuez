"use client"

import { useGetMe } from "@/hooks/useAuth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import LoadingScreen from "./LoadingScreen"
import LoginPrompt from "./LoginPrompt"
import useLoginPromptStore from "@/store/LoginPromptStore"

// Pages that only make sense for a logged-in user. Everything else (home,
// post pages, profiles, search) is browsable by guests.
const protectedRoutes = [
  "/bookmarks",
  "/chat",
  "/jobs",
  "/more",
  "/notifications",
  "/projects",
  "/settings",
]

export const isProtectedRoute = (pathname: string) =>
  pathname === "/post" ||
  protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: me, isPending } = useGetMe()
  const router = useRouter()
  const pathname = usePathname()
  const { show } = useLoginPromptStore()

  const isGuest = !isPending && !me?.user
  const isBlocked = isGuest && isProtectedRoute(pathname)

  useEffect(() => {
    if (isBlocked) {
      router.replace("/home")
      show("page")
    }
  }, [isBlocked, router, show])

  if (isPending || isBlocked) {
    return <LoadingScreen />
  }

  return (
    <>
      {children}
      <LoginPrompt />
    </>
  )
}

export default AuthGuard
