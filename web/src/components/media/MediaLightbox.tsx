"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import Image from "next/image"

// Full-screen image viewer, like X: dark backdrop, image fit to the screen,
// close with the button, a backdrop click or Escape.
const MediaLightbox = ({
  src,
  alt,
  open,
  onClose,
}: {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          // Stop clicks reaching parent click handlers (e.g. a post card)
          // through the React tree.
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 sm:p-10"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close"
            className="absolute top-3 left-3 p-2 rounded-full bg-black/60 text-white hover:bg-zinc-800 transition-colors duration-200"
          >
            <X className="size-5" />
          </button>
          {!loaded && (
            <Loader2 className="absolute size-8 animate-spin text-zinc-400" />
          )}
          <motion.div
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              // Original file: shown at its real size (no upscaling of small
              // images) and not routed through the optimizer, which can
              // time out on very large uploads.
              unoptimized
              width={0}
              height={0}
              onLoad={() => setLoaded(true)}
              className={`${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200 w-auto h-auto max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-5rem)] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-5rem)] object-contain select-none`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default MediaLightbox
