"use client"
import { useEffect, useRef, useState } from "react"
import { getScrollParent } from "./LoadMore"

// <video> that doesn't download anything until it's close to the viewport.
const LazyVideo = ({
  src,
  className,
}: {
  src: string
  className?: string
}) => {
  const ref = useRef<HTMLVideoElement>(null)
  const [isNear, setIsNear] = useState(false)

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

  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      src={isNear ? src : undefined}
      className={className}
    />
  )
}

export default LazyVideo
