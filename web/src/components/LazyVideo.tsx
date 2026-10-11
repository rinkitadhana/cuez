"use client"
import { useEffect, useRef, useState } from "react"
import { VideoOff } from "lucide-react"
import { getScrollParent } from "./LoadMore"

// <video> that doesn't download anything until it's close to the viewport,
// and shows a placeholder instead of a dead player if the file is missing.
const LazyVideo = ({ src, className }: { src: string; className?: string }) => {
  const ref = useRef<HTMLVideoElement>(null)
  const [isNear, setIsNear] = useState(false)
  const [broken, setBroken] = useState(false)

  useEffect(() => setBroken(false), [src])

  useEffect(() => {
    const el = ref.current
    if (!el || isNear) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNear(true)
      },
      { root: getScrollParent(el), rootMargin: "300px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isNear])

  if (broken) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-zinc-900 text-zinc-500">
        <VideoOff className="size-8" />
        <span className="text-sm">Video unavailable</span>
      </div>
    )
  }

  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      src={isNear ? src : undefined}
      onError={() => setBroken(true)}
      className={className}
    />
  )
}

export default LazyVideo
