"use client"
import Image, { ImageProps } from "next/image"
import { useState } from "react"

// next/image that falls back to the original file if the optimizer can't
// handle it (e.g. very large uploads).
const SafeImage = (props: ImageProps) => {
  const [failed, setFailed] = useState(false)
  return (
    <Image
      {...props}
      alt={props.alt}
      unoptimized={failed || props.unoptimized}
      onError={(e) => {
        if (!failed) setFailed(true)
        props.onError?.(e)
      }}
    />
  )
}

export default SafeImage
