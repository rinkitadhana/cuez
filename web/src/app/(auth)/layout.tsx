"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGetMe } from "@/hooks/useAuth"
import LoadingScreen from "@/components/LoadingScreen"

// Login/signup/forgot-password are for logged-out visitors only.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: me, isPending } = useGetMe()
  const router = useRouter()
  const isLoggedIn = !!me?.user

  useEffect(() => {
    if (isLoggedIn) router.replace("/home")
  }, [isLoggedIn, router])

  if (isPending || isLoggedIn) return <LoadingScreen />
  return <>{children}</>
}
