"use client"
import Image, { ImageProps } from "next/image"
import { useEffect, useState } from "react"

export type ImageKind = "avatar" | "cover" | "post"

const FALLBACKS: Record<ImageKind, string> = {
  avatar: "/img/fallback/avatar.svg",
  cover: "/img/fallback/cover.svg",
  post: "/img/fallback/image.svg",
}

// next/image that never shows the browser's broken-image icon:
// 1. try the optimized image
// 2. if the optimizer fails, try the original file
// 3. if that fails too (missing/broken file), show a placeholder for its kind
const SafeImage = ({
  kind = "post",
  src,
  ...props
}: Omit<ImageProps, "src"> & {
  src?: ImageProps["src"] | null
  kind?: ImageKind
}) => {
  const [stage, setStage] = useState<"optimized" | "original" | "fallback">(
    "optimized"
  )

  // A new src gets a fresh attempt.
  useEffect(() => setStage("optimized"), [src])

  const isRemote = typeof src === "string" && /^https?:\/\//.test(src)
  const showFallback = !src || stage === "fallback"

  return (
    <Image
      {...props}
      alt={props.alt}
      src={showFallback ? FALLBACKS[kind] : src}
      unoptimized={showFallback || stage === "original" || props.unoptimized}
      onError={(e) => {
        if (showFallback) return
        setStage(
          stage === "optimized" && isRemote && !props.unoptimized
            ? "original"
            : "fallback"
        )
        props.onError?.(e)
      }}
    />
  )
}

export default SafeImage
