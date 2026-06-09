import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "../config/r2"

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
}

const parseDataUri = (
  dataUri: string
): { contentType: string; buffer: Buffer } => {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/)
  if (!match) {
    throw new Error("Invalid data URI: expected base64-encoded media")
  }
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") }
}

/**
 * Upload a base64 data-URI (the same payload the client already sends) to R2.
 * Returns the public URL. The object key lives under `folder/` to mirror the
 * old Cloudinary folder structure (e.g. "cuez/posts").
 */
export const uploadToR2 = async (
  dataUri: string,
  folder: string
): Promise<string> => {
  const { contentType, buffer } = parseDataUri(dataUri)
  const ext = EXT_BY_MIME[contentType] ?? "bin"
  const key = `${folder}/${randomUUID()}.${ext}`

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return `${R2_PUBLIC_URL}/${key}`
}

/** Derive the object key from a stored public R2 URL. */
export const keyFromR2Url = (url: string): string | null => {
  if (!url.startsWith(R2_PUBLIC_URL + "/")) return null
  return url.slice(R2_PUBLIC_URL.length + 1)
}

/** Best-effort delete; never throws so it can't block the request flow. */
export const deleteFromR2 = async (url: string): Promise<void> => {
  const key = keyFromR2Url(url)
  if (!key) return
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
  } catch (error) {
    console.error("Error deleting R2 object:", error)
  }
}
