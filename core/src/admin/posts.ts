import type { PipelineStage, Types } from "mongoose"
import Post from "../models/post-model"
import User from "../models/user-model"
import { deletePostsCascade } from "./cascade"
import { adminRouter } from "./router"
import {
  getPagination,
  hasCursor,
  isId,
  offsetPage,
  offsetPaging,
  oid,
  paginate,
  publicUser,
  searchRegex,
} from "./util"

export const postsAdminRoutes = adminRouter()

type Row = Record<string, unknown> & { _id: Types.ObjectId; user: Types.ObjectId; parent?: Types.ObjectId | null; repostOf?: Types.ObjectId | null }

const PROJECT = {
  text: 1,
  img: 1,
  video: 1,
  user: 1,
  parent: 1,
  repostOf: 1,
  createdAt: 1,
  editedAt: 1,
  likesCount: { $size: { $ifNull: ["$likes", []] } },
  bookmarksCount: { $size: { $ifNull: ["$bookmarks", []] } },
  repostsCount: { $size: { $ifNull: ["$reposts", []] } },
}

const USER_FIELDS = "username fullName profileImg cuezBadge email"

const typeOf = (p: Row) => (p.repostOf ? "repost" : p.parent ? "reply" : "post")

// Adds author, reply counts and, for reposts, a preview of the original.
const enrich = async (rows: Row[]) => {
  const originalIds = rows.map((r) => r.repostOf).filter((id): id is Types.ObjectId => !!id)
  const [originals, replyCounts] = await Promise.all([
    originalIds.length
      ? Post.find({ _id: { $in: originalIds } }).select("text img video user").lean()
      : Promise.resolve([]),
    Post.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { parent: { $in: rows.map((r) => r._id) } } },
      { $group: { _id: "$parent", n: { $sum: 1 } } },
    ]),
  ])
  const userIds = [...rows.map((r) => r.user), ...originals.map((o) => o.user)]
  const users = await User.find({ _id: { $in: userIds } }).select(USER_FIELDS).lean()
  const userById = new Map(users.map((u) => [String(u._id), publicUser(u)]))
  const originalById = new Map(originals.map((o) => [String(o._id), o]))
  const replyBy = new Map(replyCounts.map((r) => [String(r._id), r.n]))

  return rows.map((p) => {
    const original = p.repostOf ? originalById.get(String(p.repostOf)) : undefined
    return {
      id: String(p._id),
      type: typeOf(p),
      text: p.text ?? "",
      img: p.img ?? "",
      video: p.video ?? "",
      parent: p.parent ? String(p.parent) : null,
      repostOf: p.repostOf ? String(p.repostOf) : null,
      createdAt: p.createdAt,
      edited: !!p.editedAt,
      likes: p.likesCount,
      bookmarks: p.bookmarksCount,
      reposts: p.repostsCount,
      replies: replyBy.get(String(p._id)) ?? 0,
      user: userById.get(String(p.user)) ?? null,
      original: original
        ? {
            id: String(original._id),
            text: original.text ?? "",
            img: original.img ?? "",
            video: original.video ?? "",
            user: userById.get(String(original.user)) ?? null,
          }
        : null,
    }
  })
}

// GET /posts?q=&type=all|post|reply|repost|media&user=&parent=&sort=newest|likes&cursor=&limit=
postsAdminRoutes.get("/posts", async (req, res) => {
  const match: Record<string, unknown> = {}
  const and: Record<string, unknown>[] = []
  const re = searchRegex(req)
  if (re) match.text = re
  switch (req.query.type) {
    case "post":
      match.parent = null
      match.repostOf = null
      break
    case "reply":
      match.parent = { $ne: null }
      match.repostOf = null
      break
    case "repost":
      match.repostOf = { $ne: null }
      break
    case "media":
      match.repostOf = null
      and.push({ $or: [{ img: { $nin: [null, ""] } }, { video: { $nin: [null, ""] } }] })
      break
  }
  if (isId(req.query.user)) match.user = oid(req.query.user)
  if (isId(req.query.parent)) match.parent = oid(req.query.parent)
  if (and.length) match.$and = and

  const total = hasCursor(req) ? undefined : await Post.countDocuments(match)

  let rows: Row[]
  let nextCursor: string | number | null
  if (req.query.sort === "likes") {
    const { limit, skip } = offsetPaging(req)
    const pipeline: PipelineStage[] = [
      { $match: match },
      { $addFields: { likesSort: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likesSort: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit + 1 },
      { $project: PROJECT },
    ]
    const paged = offsetPage(await Post.aggregate<Row>(pipeline), limit, skip)
    rows = paged.page
    nextCursor = paged.nextCursor
  } else {
    const { limit, cursorFilter, sort } = getPagination<unknown>(req)
    const query = Object.keys(cursorFilter).length ? { $and: [match, cursorFilter] } : match
    const found = await Post.aggregate<Row>([{ $match: query }, { $sort: sort }, { $limit: limit + 1 }, { $project: PROJECT }])
    const paged = paginate(found, limit)
    rows = paged.page
    nextCursor = paged.nextCursor
  }

  res.json({ total, nextCursor, posts: await enrich(rows) })
})

postsAdminRoutes.get("/posts/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "Post not found" })
  const [row] = await Post.aggregate<Row>([{ $match: { _id: oid(req.params.id) } }, { $project: PROJECT }])
  if (!row) return res.status(404).json({ error: "Post not found" })
  const [post] = await enrich([row])
  res.json({ post })
})

// DELETE /posts/:id: also removes its replies, reposts, notifications and media.
postsAdminRoutes.delete("/posts/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "Post not found" })
  const exists = await Post.exists({ _id: req.params.id })
  if (!exists) return res.status(404).json({ error: "Post not found" })
  const deleted = await deletePostsCascade([oid(req.params.id)])
  res.json({ ok: true, deleted })
})
