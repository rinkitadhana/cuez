/**
 * One-time migration: copy all Cloudinary assets to R2, then rewrite the
 * stored URLs in MongoDB to point at R2.
 *
 * Usage (from core/):
 *   npx ts-node scripts/migrate-to-r2.ts            # full run
 *   npx ts-node scripts/migrate-to-r2.ts --dry-run  # report only, no writes
 *
 * Required env (in addition to the R2_* vars used by the app):
 *   MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Safe to re-run: file copies overwrite the same keys, and the DB rewrite only
 * touches URLs that still point at Cloudinary.
 */
import dotenv from "dotenv"
dotenv.config()

import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "../src/config/r2"
import Post from "../src/models/post-model"
import User from "../src/models/user-model"

const DRY_RUN = process.argv.includes("--dry-run")
const PREFIX = "cuez/"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/** Turn a stored Cloudinary URL into the equivalent R2 URL. */
const cloudinaryUrlToR2 = (url: string): string | null => {
  if (!url || !url.includes("res.cloudinary.com")) return null
  const afterUpload = url.split("/upload/")[1]
  if (!afterUpload) return null
  // Strip the leading version segment ("v1745885316/") if present.
  const path = afterUpload.replace(/^v\d+\//, "")
  return `${R2_PUBLIC_URL}/${path}`
}

/** Copy every Cloudinary asset under cuez/ into R2 at key = public_id.format. */
const copyAssets = async (resourceType: "image" | "video") => {
  let nextCursor: string | undefined
  let copied = 0
  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix: PREFIX,
      max_results: 500,
      next_cursor: nextCursor,
    })

    for (const asset of result.resources) {
      const key = `${asset.public_id}.${asset.format}`
      if (DRY_RUN) {
        console.log(`[dry-run] would copy ${resourceType}: ${key}`)
        copied++
        continue
      }
      const res = await fetch(asset.secure_url)
      if (!res.ok) {
        console.error(`  ! failed to download ${asset.secure_url}`)
        continue
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: res.headers.get("content-type") ?? undefined,
        })
      )
      copied++
      console.log(`  ✓ ${key}`)
    }
    nextCursor = result.next_cursor
  } while (nextCursor)

  console.log(`Copied ${copied} ${resourceType} asset(s).`)
}

/** Rewrite Cloudinary URLs on a collection's fields to their R2 equivalents. */
const rewriteDocs = async (
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Model: any,
  fields: string[]
) => {
  const query = { $or: fields.map((f) => ({ [f]: /res\.cloudinary\.com/ })) }
  const docs = await Model.find(query)
  let updated = 0
  for (const doc of docs) {
    let changed = false
    for (const field of fields) {
      const r2Url = cloudinaryUrlToR2(doc[field])
      if (r2Url) {
        doc[field] = r2Url
        changed = true
      }
    }
    if (changed) {
      if (!DRY_RUN) await doc.save()
      updated++
    }
  }
  console.log(`${DRY_RUN ? "[dry-run] would update" : "Updated"} ${updated} ${label} doc(s).`)
}

const main = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set")
  await mongoose.connect(process.env.MONGO_URI)
  console.log(`MongoDB connected. ${DRY_RUN ? "DRY RUN — no writes.\n" : ""}`)

  console.log("== Copying assets to R2 ==")
  await copyAssets("image")
  await copyAssets("video")

  console.log("\n== Rewriting DB URLs ==")
  await rewriteDocs("post", Post, ["img", "video"])
  await rewriteDocs("user", User, ["profileImg", "coverImg"])

  await mongoose.disconnect()
  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
