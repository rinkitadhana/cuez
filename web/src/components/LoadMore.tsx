"use client"
import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"

export const getScrollParent = (el: HTMLElement | null): HTMLElement | null => {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === "auto" || overflowY === "scroll") return node
  }
  return null
}

// Invisible sentinel at the end of a list: fetches the next page once it
// scrolls near view, and shows a spinner while that page loads.
const LoadMore = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage()
      },
      { root: getScrollParent(el), rootMargin: "600px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!hasNextPage) return null

  return (
    <div ref={ref} className="flex justify-center py-6">
      {isFetchingNextPage && (
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      )}
    </div>
  )
}

export default LoadMore
