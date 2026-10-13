import type { Request } from "express"
import mongoose from "mongoose"

export { getPagination, paginate } from "../utils/pagination"

export const isId = (value: unknown): value is string =>
  typeof value === "string" && mongoose.isValidObjectId(value)

export const oid = (value: string) => new mongoose.Types.ObjectId(value)

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Case-insensitive "contains" regex from ?q=, or null when empty. */
export const searchRegex = (req: Request): RegExp | null => {
  const q = String(req.query.q ?? "").trim().slice(0, 100)
  return q ? new RegExp(escapeRegex(q), "i") : null
}

export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

/** Offset paging for ranked lists (keyset can't follow a non-date sort). */
export const offsetPaging = (req: Request, defaultLimit = 30) => {
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit)) || defaultLimit, 1),
    50
  )
  const skip = Math.max(parseInt(String(req.query.cursor)) || 0, 0)
  return { limit, skip }
}

export const offsetPage = <T>(items: T[], limit: number, skip: number) => {
  const hasMore = items.length > limit
  return {
    page: hasMore ? items.slice(0, limit) : items,
    nextCursor: hasMore ? skip + limit : null,
  }
}

export const hasCursor = (req: Request) => !!req.query.cursor

export const publicUser = (u: {
  _id: unknown
  username?: string
  fullName?: string
  profileImg?: string
  cuezBadge?: boolean
  email?: string
}) => ({
  id: String(u._id),
  username: u.username ?? "",
  fullName: u.fullName ?? "",
  profileImg: u.profileImg ?? "",
  cuezBadge: !!u.cuezBadge,
  ...(u.email !== undefined ? { email: u.email } : {}),
})
