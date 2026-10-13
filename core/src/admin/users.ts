import type { PipelineStage } from "mongoose"
import { Feedback } from "../models/feedback-model"
import Post from "../models/post-model"
import User from "../models/user-model"
import { deleteUserCascade } from "./cascade"
import { adminRouter } from "./router"
import {
  getPagination,
  hasCursor,
  isId,
  offsetPage,
  offsetPaging,
  oid,
  paginate,
  searchRegex,
} from "./util"
import type { Types } from "mongoose"

export const usersAdminRoutes = adminRouter()

const FIELDS = {
  username: 1,
  fullName: 1,
  email: 1,
  profileImg: 1,
  coverImg: 1,
  bio: 1,
  link: 1,
  location: 1,
  cuezBadge: 1,
  bannedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  followersCount: { $size: { $ifNull: ["$followers", []] } },
  followingCount: { $size: { $ifNull: ["$followings", []] } },
  likedCount: { $size: { $ifNull: ["$likedPosts", []] } },
  bookmarkCount: { $size: { $ifNull: ["$bookmarks", []] } },
}

type Row = Record<string, unknown> & { _id: Types.ObjectId }

// posts / replies / reposts authored, for a set of users in one query.
const contentCounts = async (ids: Types.ObjectId[]) => {
  const rows = await Post.aggregate<{ _id: Types.ObjectId; posts: number; replies: number; reposts: number }>([
    { $match: { user: { $in: ids } } },
    {
      $group: {
        _id: "$user",
        reposts: { $sum: { $cond: [{ $ne: ["$repostOf", null] }, 1, 0] } },
        replies: { $sum: { $cond: [{ $and: [{ $eq: ["$repostOf", null] }, { $ne: ["$parent", null] }] }, 1, 0] } },
        posts: { $sum: { $cond: [{ $and: [{ $eq: ["$repostOf", null] }, { $eq: ["$parent", null] }] }, 1, 0] } },
      },
    },
  ])
  return new Map(rows.map((r) => [String(r._id), r]))
}

const serialize = (u: Row, counts: Map<string, { posts: number; replies: number; reposts: number }>) => {
  const c = counts.get(String(u._id))
  return {
    id: String(u._id),
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    profileImg: u.profileImg,
    coverImg: u.coverImg,
    bio: u.bio,
    link: u.link,
    location: u.location,
    cuezBadge: !!u.cuezBadge,
    banned: !!u.bannedAt,
    bannedAt: u.bannedAt ?? null,
    createdAt: u.createdAt,
    followers: u.followersCount,
    following: u.followingCount,
    likesGiven: u.likedCount,
    bookmarks: u.bookmarkCount,
    posts: c?.posts ?? 0,
    replies: c?.replies ?? 0,
    reposts: c?.reposts ?? 0,
  }
}

// GET /users?q=&filter=badge|banned&sort=newest|followers&cursor=&limit=
usersAdminRoutes.get("/users", async (req, res) => {
  const re = searchRegex(req)
  const match: Record<string, unknown> = {}
  if (re) match.$or = [{ username: re }, { fullName: re }, { email: re }]
  if (req.query.filter === "badge") match.cuezBadge = true
  if (req.query.filter === "banned") match.bannedAt = { $type: "date" }
  const byFollowers = req.query.sort === "followers"
  const total = hasCursor(req) ? undefined : await User.countDocuments(match)

  let rows: Row[]
  let nextCursor: string | number | null
  if (byFollowers) {
    const { limit, skip } = offsetPaging(req)
    const pipeline: PipelineStage[] = [
      { $match: match },
      { $addFields: { followersCount: { $size: { $ifNull: ["$followers", []] } } } },
      { $sort: { followersCount: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit + 1 },
      { $project: FIELDS },
    ]
    const found = await User.aggregate<Row>(pipeline)
    const paged = offsetPage(found, limit, skip)
    rows = paged.page
    nextCursor = paged.nextCursor
  } else {
    const { limit, cursorFilter, sort } = getPagination<unknown>(req)
    const query = Object.keys(cursorFilter).length ? { $and: [match, cursorFilter] } : match
    const found = await User.aggregate<Row>([
      { $match: query },
      { $sort: sort },
      { $limit: limit + 1 },
      { $project: FIELDS },
    ])
    const paged = paginate(found, limit)
    rows = paged.page
    nextCursor = paged.nextCursor
  }

  const counts = await contentCounts(rows.map((r) => r._id))
  res.json({ total, nextCursor, users: rows.map((r) => serialize(r, counts)) })
})

usersAdminRoutes.get("/users/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "User not found" })
  const id = oid(req.params.id)
  const [row] = await User.aggregate<Row>([{ $match: { _id: id } }, { $project: FIELDS }])
  if (!row) return res.status(404).json({ error: "User not found" })

  const [counts, likesReceived, feedback] = await Promise.all([
    contentCounts([id]),
    Post.aggregate<{ n: number }>([
      { $match: { user: id, repostOf: null } },
      { $group: { _id: null, n: { $sum: { $size: { $ifNull: ["$likes", []] } } } } },
    ]).then((r) => r[0]?.n ?? 0),
    Feedback.countDocuments({ user: id }),
  ])

  res.json({ user: { ...serialize(row, counts), likesReceived, feedback } })
})

// PATCH /users/:id  { cuezBadge?: boolean, banned?: boolean }
usersAdminRoutes.patch("/users/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "User not found" })
  const body = (req.body ?? {}) as Record<string, unknown>
  const set: Record<string, unknown> = {}
  const unset: Record<string, 1> = {}
  if (typeof body.cuezBadge === "boolean") set.cuezBadge = body.cuezBadge
  if (typeof body.banned === "boolean") {
    if (body.banned) set.bannedAt = new Date()
    else unset.bannedAt = 1
  }
  if (!Object.keys(set).length && !Object.keys(unset).length) {
    return res.status(400).json({ error: "Nothing to update (cuezBadge, banned)" })
  }
  const update: Record<string, unknown> = {}
  if (Object.keys(set).length) update.$set = set
  if (Object.keys(unset).length) update.$unset = unset
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("cuezBadge bannedAt")
  if (!user) return res.status(404).json({ error: "User not found" })
  res.json({ ok: true, cuezBadge: !!user.cuezBadge, banned: !!user.bannedAt, bannedAt: user.bannedAt ?? null })
})

// DELETE /users/:id: removes the account and all of its content, chats and references.
usersAdminRoutes.delete("/users/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "User not found" })
  const result = await deleteUserCascade(oid(req.params.id))
  if (!result) return res.status(404).json({ error: "User not found" })
  res.json({ ok: true, postsDeleted: result.posts })
})
