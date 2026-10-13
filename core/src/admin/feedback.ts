import type { Types } from "mongoose"
import { Feedback } from "../models/feedback-model"
import User from "../models/user-model"
import { adminRouter } from "./router"
import { getPagination, hasCursor, isId, paginate, publicUser, searchRegex } from "./util"

export const feedbackAdminRoutes = adminRouter()

// GET /feedback?q=&status=new|reviewed|all&cursor=&limit=
feedbackAdminRoutes.get("/feedback", async (req, res) => {
  const match: Record<string, unknown> = {}
  const re = searchRegex(req)
  if (re) match.$or = [{ title: re }, { description: re }]
  if (req.query.status === "new") match.reviewed = { $ne: true }
  if (req.query.status === "reviewed") match.reviewed = true

  const total = hasCursor(req) ? undefined : await Feedback.countDocuments(match)
  const { limit, cursorFilter, sort } = getPagination<unknown>(req)
  const query = Object.keys(cursorFilter).length ? { $and: [match, cursorFilter] } : match
  const found = await Feedback.find(query).sort(sort).limit(limit + 1).lean()
  const { page, nextCursor } = paginate(found, limit)

  const users = await User.find({ _id: { $in: page.map((f) => f.user) } })
    .select("username fullName profileImg cuezBadge email")
    .lean()
  const userById = new Map(users.map((u) => [String(u._id), publicUser(u)]))

  res.json({
    total,
    nextCursor,
    feedback: page.map((f) => ({
      id: String(f._id),
      title: f.title,
      description: f.description,
      reviewed: !!f.reviewed,
      createdAt: f.createdAt,
      user: userById.get(String(f.user as Types.ObjectId)) ?? null,
    })),
  })
})

feedbackAdminRoutes.patch("/feedback/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "Feedback not found" })
  const reviewed = (req.body ?? {}).reviewed
  if (typeof reviewed !== "boolean") return res.status(400).json({ error: "reviewed must be a boolean" })
  const doc = await Feedback.findByIdAndUpdate(req.params.id, { $set: { reviewed } }, { new: true }).select("reviewed")
  if (!doc) return res.status(404).json({ error: "Feedback not found" })
  res.json({ ok: true, reviewed: !!doc.reviewed })
})

feedbackAdminRoutes.delete("/feedback/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: "Feedback not found" })
  const doc = await Feedback.findByIdAndDelete(req.params.id).select("_id")
  if (!doc) return res.status(404).json({ error: "Feedback not found" })
  res.json({ ok: true })
})
