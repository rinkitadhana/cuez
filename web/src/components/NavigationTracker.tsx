"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Paths visited inside the app this session, so back buttons know whether
// "back" stays in Cuez or would leave it (e.g. after opening a shared link).
const visited: string[] = []

export const canGoBackInApp = () => visited.length > 1

const NavigationTracker = () => {
  const pathname = usePathname()
  useEffect(() => {
    if (visited[visited.length - 2] === pathname) visited.pop()
    else if (visited[visited.length - 1] !== pathname) visited.push(pathname)
  }, [pathname])
  return null
}

export default NavigationTracker
