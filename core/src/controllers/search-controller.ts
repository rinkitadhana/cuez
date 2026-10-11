import { Request, Response } from "express"
import { errorHandler } from "../utils/errorHandler"
import Post from "../models/post-model"
import User from "../models/user-model"
import { getPagination, paginate } from "../utils/pagination"

const MAX_QUERY_LENGTH = 100

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const getQuery = (req: Request) =>
  typeof req.query.q === "string"
    ? req.query.q.trim().slice(0, MAX_QUERY_LENGTH)
    : ""

// Posts and replies whose text contains the query, newest first.
const searchPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = getQuery(req)
    if (!q) {
      res.status(200).json({ message: "Empty query", posts: [], nextCursor: null })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const posts = await Post.find({
      text: { $regex: escapeRegex(q), $options: "i" },
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: "-password -email -bookmarks" })
    const { page, nextCursor } = paginate(posts, limit)
    res.status(200).json({ message: "Search results", posts: page, nextCursor })
  } catch (error) {
    errorHandler(res, error)
  }
}

// Accounts matching username or name. Exact username first, then username
// prefix, then everything else, each ordered by follower count.
const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = getQuery(req)
    if (!q) {
      res.status(200).json({ message: "Empty query", users: [], nextCursor: null })
      return
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
    const offset = Math.max(parseInt(req.query.cursor as string) || 0, 0)
    const pattern = escapeRegex(q.replace(/^@/, ""))

    const users = await User.aggregate([
      {
        $match: {
          $or: [
            { username: { $regex: pattern, $options: "i" } },
            { fullName: { $regex: pattern, $options: "i" } },
          ],
        },
      },
      {
        $addFields: {
          _rank: {
            $cond: [
              { $eq: ["$username", pattern.toLowerCase()] },
              0,
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$username",
                      regex: `^${pattern}`,
                      options: "i",
                    },
                  },
                  1,
                  2,
                ],
              },
            ],
          },
          _followerCount: { $size: { $ifNull: ["$followers", []] } },
        },
      },
      { $sort: { _rank: 1, _followerCount: -1, _id: 1 } },
      { $skip: offset },
      { $limit: limit + 1 },
      {
        $project: {
          password: 0,
          email: 0,
          bookmarks: 0,
          _rank: 0,
          _followerCount: 0,
        },
      },
    ])

    const hasMore = users.length > limit
    res.status(200).json({
      message: "Search results",
      users: hasMore ? users.slice(0, limit) : users,
      nextCursor: hasMore ? String(offset + limit) : null,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

export { searchPosts, searchUsers }
