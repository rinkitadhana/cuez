import { Feedback } from "../models/feedback-model"
import Notification from "../models/notification-model"
import Post from "../models/post-model"
import User from "../models/user-model"
import { adminRouter } from "./router"
import { daysAgo } from "./util"

export const statsAdminRoutes = adminRouter()

const perDay = (model: typeof User | typeof Post, match: Record<string, unknown> = {}) =>
  (model as typeof Post).aggregate<{ _id: string; count: number }>([
    { $match: { ...match, createdAt: { $gte: daysAgo(30) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

// Original top-level posts only (no replies, no repost entries).
const ORIGINAL = { parent: null, repostOf: null }
const REPLY = { parent: { $ne: null } }
const REPOST = { repostOf: { $ne: null } }

statsAdminRoutes.get("/stats/overview", async (_req, res) => {
  const d7 = { $gte: daysAgo(7) }
  const d30 = { $gte: daysAgo(30) }
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [
    users,
    posts,
    replies,
    reposts,
    mediaPosts,
    feedback,
    feedbackNew,
    notifications,
    notificationsUnread,
    notificationTypes,
    badgeUsers,
    bannedUsers,
    usersToday,
    users7d,
    users30d,
    posts7d,
    posters7d,
    usersByDay,
    postsByDay,
  ] = await Promise.all([
    User.estimatedDocumentCount(),
    Post.countDocuments(ORIGINAL),
    Post.countDocuments(REPLY),
    Post.countDocuments(REPOST),
    Post.countDocuments({ ...ORIGINAL, $or: [{ img: { $nin: [null, ""] } }, { video: { $nin: [null, ""] } }] }),
    Feedback.estimatedDocumentCount(),
    Feedback.countDocuments({ reviewed: { $ne: true } }),
    Notification.estimatedDocumentCount(),
    Notification.countDocuments({ read: false }),
    Notification.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    User.countDocuments({ cuezBadge: true }),
    User.countDocuments({ bannedAt: { $type: "date" } }),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: d7 }),
    User.countDocuments({ createdAt: d30 }),
    Post.countDocuments({ createdAt: d7, repostOf: null }),
    Post.distinct("user", { createdAt: d7 }).then((ids) => ids.length),
    perDay(User),
    perDay(Post, { repostOf: null }),
  ])

  res.json({
    totals: {
      users,
      posts,
      replies,
      reposts,
      mediaPosts,
      feedback,
      feedbackNew,
      notifications,
      notificationsUnread,
      badgeUsers,
      bannedUsers,
    },
    growth: { usersToday, users7d, users30d, posts7d, posters7d },
    notificationTypes: Object.fromEntries(notificationTypes.map((t) => [t._id, t.count])),
    byDay: { users: usersByDay, posts: postsByDay },
  })
})
