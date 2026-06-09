import { S3Client } from "@aws-sdk/client-s3"
import dotenv from "dotenv"
dotenv.config()

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }
  return value
}

export const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID")
export const R2_BUCKET = requireEnv("R2_BUCKET")
// Public base URL the bucket is served from (custom domain or *.r2.dev),
// no trailing slash.
export const R2_PUBLIC_URL = requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "")

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
})
