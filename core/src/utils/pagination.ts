import { Request } from "express"
import mongoose, { FilterQuery } from "mongoose"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

// Newest-first keyset pagination on (createdAt, _id).
// Cursor format: "<createdAt ISO>_<_id>", taken from the last item of a page.
export const getPagination = <T>(req: Request) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  )

  let cursorFilter: FilterQuery<T> = {}
  const cursor = req.query.cursor
  if (typeof cursor === "string" && cursor) {
    const [iso, id] = cursor.split("_")
    const date = new Date(iso)
    if (!isNaN(date.getTime()) && mongoose.isValidObjectId(id)) {
      const _id = new mongoose.Types.ObjectId(id)
      cursorFilter = {
        $or: [{ createdAt: { $lt: date } }, { createdAt: date, _id: { $lt: _id } }],
      } as FilterQuery<T>
    }
  }

  return { limit, cursorFilter, sort: { createdAt: -1, _id: -1 } as const }
}

// Call with limit + 1 items fetched; trims the extra and returns the next cursor.
export const paginate = <T extends { _id: unknown; createdAt?: Date }>(
  items: T[],
  limit: number
) => {
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const last = page[page.length - 1]
  const nextCursor =
    hasMore && last?.createdAt
      ? `${new Date(last.createdAt).toISOString()}_${String(last._id)}`
      : null
  return { page, nextCursor }
}
