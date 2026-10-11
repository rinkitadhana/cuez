"use client"
import { useState } from "react"
import SafeImage from "./SafeImage"
import MediaLightbox from "./MediaLightbox"
import LazyVideo from "../LazyVideo"

// Post image/video, sized like X: full width, natural aspect ratio, capped
// height (feed crops tall images; the post page shows them whole).
const PostMedia = ({
  img,
  video,
  variant = "feed",
}: {
  img?: string
  video?: string
  variant?: "feed" | "detail"
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!img && !video) return null

  const frame =
    "w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"

  if (img) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsLightboxOpen(true)
          }}
          className={`block ${frame} ${loaded ? "" : "min-h-56 animate-pulse"}`}
        >
          <SafeImage
            src={img}
            alt="Post image"
            width={0}
            height={0}
            sizes="(max-width: 768px) 100vw, 600px"
            onLoad={() => setLoaded(true)}
            className={`w-full h-auto ${
              variant === "feed"
                ? "max-h-[510px] object-cover"
                : "max-h-[80vh] object-contain"
            } hover:brightness-95 transition-[filter] duration-200`}
          />
        </button>
        <MediaLightbox
          src={img}
          alt="Post image"
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      </>
    )
  }

  return (
    // Keep play/seek clicks from opening the post.
    <div onClick={(e) => e.stopPropagation()} className={`${frame} bg-black`}>
      <LazyVideo
        src={video!}
        className={`block w-full ${
          variant === "feed" ? "max-h-[510px]" : "max-h-[80vh]"
        } bg-black`}
      />
    </div>
  )
}

export default PostMedia
