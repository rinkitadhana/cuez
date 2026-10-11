import { Request, Response } from "express"
import User from "../models/user-model"
import { errorHandler } from "../utils/errorHandler"
import Post from "../models/post-model"
import { uploadToR2, deleteFromR2 } from "../utils/storage"
import Notification from "../models/notification-model"
import { getPagination, paginate } from "../utils/pagination"

const PUBLIC_USER_FIELDS = "-password -email -bookmarks"

const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, img, video, parentId } = req.body
    const userId = req.user._id.toString()
    const user = await User.findById(userId)

    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    if (!text && !img && !video) {
      res.status(400).json({ message: "Text or Image or Video is required!" })
      return
    }
    let postData: {
      user: typeof user._id
      text?: string
      img?: string
      video?: string
      parent?: string
    } = { user: user._id }

    if (img) {
      postData.img = await uploadToR2(img, "cuez/posts")
    }

    if (video) {
      postData.video = await uploadToR2(video, "cuez/posts")
    }

    if (text) postData.text = text

    if (parentId) {
      const parentPost = await Post.findById(parentId)
      if (!parentPost) {
        res.status(404).json({ message: "Parent post not found!" })
        return
      }

      postData.parent = parentId

      if (userId !== parentPost.user.toString()) {
        const notification = new Notification({
          from: userId,
          to: parentPost.user.toString(),
          type: "reply",
          post: parentPost._id,
        })
        await notification.save()
      }
    }

    const newPost = await Post.create(postData)
    res.status(201).json({ message: "Post created", post: newPost })
  } catch (error) {
    errorHandler(res, error)
  }
}

const editPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body
    const { img, video } = req.body
    const post = await Post.findById(req.params.id)
    const userId = req.user._id.toString()
    const user = await User.findById(userId)

    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }

    if (!post) {
      res.status(404).json({ message: "Post not found!" })
      return
    }

    if (post.user.toString() !== userId) {
      res
        .status(403)
        .json({ message: "You are not authorized to edit this post!" })
      return
    }

    if (!text && !img && !video) {
      res.status(400).json({ message: "Text or Image or Video is required!" })
      return
    }

    let updateData: {
      text?: string
      img?: string
      video?: string
      editedAt?: Date
    } = {}

    if (img && img !== post.img) {
      if (post.img) {
        await deleteFromR2(post.img)
      }
      updateData.img = await uploadToR2(img, "cuez/posts")
      updateData.editedAt = new Date()
    }

    if (video && video !== post.video) {
      if (post.video) {
        await deleteFromR2(post.video)
      }
      updateData.video = await uploadToR2(video, "cuez/posts")
      updateData.editedAt = new Date()
    }

    if (text) {
      updateData.text = text
      updateData.editedAt = new Date()
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )

    res
      .status(200)
      .json({ message: "Post updated successfully!", post: updatedPost })
  } catch (error) {
    errorHandler(res, error)
  }
}

const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id)
    const userId = req.user._id.toString()
    const user = await User.findById(userId)

    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }

    if (!post) {
      res.status(404).json({ message: "Post not found!" })
      return
    }

    if (post.user.toString() !== userId) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this post!" })
      return
    }

    if (post.img) {
      await deleteFromR2(post.img)
    }

    if (post.video) {
      await deleteFromR2(post.video)
    }

    await Notification.deleteMany({ post: post._id })

    await Post.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Post deleted successfully!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const likeUnlikePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id
    const post = await Post.findById(req.params.id).select("user")
    if (!post) {
      res.status(404).json({ message: "Post not found!" })
      return
    }
    // Atomic toggle: add only if absent, otherwise remove. Keeps likes
    // consistent when the client fires rapid optimistic clicks.
    const added = await Post.updateOne(
      { _id: post._id, likes: { $ne: userId } },
      { $addToSet: { likes: userId } }
    )
    if (added.modifiedCount === 0) {
      await Post.updateOne({ _id: post._id }, { $pull: { likes: userId } })
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: post._id } })
      await Notification.deleteMany({
        from: userId,
        to: post.user,
        type: "like",
        post: post._id,
      })
      res.status(200).json({ message: "Post unliked successfully!", liked: false })
      return
    }
    await User.updateOne({ _id: userId }, { $addToSet: { likedPosts: post._id } })
    if (userId.toString() !== post.user.toString()) {
      await Notification.create({
        from: userId,
        to: post.user,
        type: "like",
        post: post._id,
      })
    }
    res.status(200).json({ message: "Post liked successfully!", liked: true })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, cursorFilter, sort } = getPagination(req)
    const posts = await Post.find({ parent: null, ...cursorFilter })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(posts, limit)
    res
      .status(200)
      .json({ message: "Got all posts successfully", posts: page, nextCursor })
  } catch (error) {
    errorHandler(res, error)
  }
}

// A user's replies, newest first, each with the post it answers
// (`parentPost`, null if that post was deleted) for thread-style display.
const getUserReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username })
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const replies = await Post.find({
      user: user._id,
      parent: { $ne: null },
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(replies, limit)

    const parents = await Post.find({
      _id: { $in: page.map((reply) => reply.parent) },
    }).populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const parentById = new Map(parents.map((p) => [String(p._id), p]))

    res.status(200).json({
      message: "User replies fetched successfully!",
      userReplies: page.map((reply) => ({
        ...reply.toObject(),
        parentPost: parentById.get(String(reply.parent)) ?? null,
      })),
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getLikedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username })
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(likedPosts, limit)
    res.status(200).json({
      message: "Liked posts fetched successfully!",
      likedPosts: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getFollowingPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user._id.toString()
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const followingPosts = await Post.find({
      user: { $in: user.followings },
      parent: null, // Only get top-level posts
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(followingPosts, limit)
    res.status(200).json({
      message: "Following posts fetched successfully!",
      posts: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getTrendingPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const trendingPosts = await Post.aggregate([
      {
        $match: { parent: null }, // Only get top-level posts
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $sort: { likesCount: -1 },
      },
    ]).exec()

    const populatedPosts = await Post.populate(trendingPosts, [
      {
        path: "user",
        select: "-password -email -bookmarks",
      },
    ])

    if (populatedPosts.length === 0) {
      res.status(200).json({ message: "No posts found!", posts: [] })
      return
    }

    res.status(200).json({
      message: "Trending posts fetched successfully!",
      posts: populatedPosts,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getUserPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username })
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const userPosts = await Post.find({
      user: user._id,
      parent: null, // Only get top-level posts
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(userPosts, limit)
    res.status(200).json({
      message: "User posts fetched successfully!",
      userPosts: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const isLiked = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
    const userId = req.user.id

    if (!post) {
      res.status(404).json({ message: "Post not found" })
      return
    }
    const liked = post.likes.includes(userId)
    res.status(200).json({ liked })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate({
      path: "user",
      select: "-password -email -bookmarks",
    })

    if (!post) {
      res.status(404).json({ message: "Post not found" })
      return
    }

    // Replies are loaded separately (and paginated) via /replies/:postId.
    res.status(200).json({
      message: "Post found",
      post,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const bookmarkPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id
    const post = await Post.findById(req.params.id).select("_id")
    if (!post) {
      res.status(404).json({ message: "Post not found!" })
      return
    }
    // Atomic toggle, same as likes.
    const added = await Post.updateOne(
      { _id: post._id, bookmarks: { $ne: userId } },
      { $addToSet: { bookmarks: userId } }
    )
    if (added.modifiedCount === 0) {
      await Post.updateOne({ _id: post._id }, { $pull: { bookmarks: userId } })
      await User.updateOne({ _id: userId }, { $pull: { bookmarks: post._id } })
      res
        .status(200)
        .json({ message: "Post unbookmarked successfully!", bookmarked: false })
      return
    }
    await User.updateOne({ _id: userId }, { $addToSet: { bookmarks: post._id } })
    res
      .status(200)
      .json({ message: "Post bookmarked successfully!", bookmarked: true })
  } catch (error) {
    errorHandler(res, error)
  }
}

const isBookmarked = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id)
    const user = await User.findById(req.user._id.toString())
    if (!post) {
      res.status(404).json({ message: "Post not found!" })
      return
    }
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const isBookmarked = post.bookmarks.includes(req.user._id.toString())
    res
      .status(200)
      .json({ isBookmarked, message: "Bookmarked post fetched successfully!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getBookmarkedPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user._id.toString())
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const bookmarkedPosts = await Post.find({
      _id: { $in: user.bookmarks },
      ...cursorFilter,
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(bookmarkedPosts, limit)
    res.status(200).json({
      message: "Bookmarked posts fetched successfully!",
      posts: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params

    const parentPost = await Post.findById(postId)
    if (!parentPost) {
      res.status(404).json({ message: "Post not found!" })
      return
    }

    const { limit, cursorFilter, sort } = getPagination(req)
    const replies = await Post.find({ parent: postId, ...cursorFilter })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "user", select: PUBLIC_USER_FIELDS })
    const { page, nextCursor } = paginate(replies, limit)
    res.status(200).json({
      message: "Replies fetched successfully!",
      replies: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getReplyCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params

    const count = await Post.countDocuments({ parent: postId })

    res.status(200).json({
      message: "Reply count fetched successfully",
      count,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getParentThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params
    let currentPost = await Post.findById(postId)

    if (!currentPost) {
      res.status(404).json({ message: "Post not found!" })
      return
    }

    const thread: any[] = []

    // Traverse up the parent chain and collect all parent posts
    while (currentPost && currentPost.parent) {
      currentPost = await Post.findById(currentPost.parent).populate({
        path: "user",
        select: "-password -email -bookmarks",
      })

      if (currentPost) {
        thread.push(currentPost)
      }
    }

    // Return the posts in chronological order (oldest first)
    res.status(200).json({
      message: "Parent thread fetched successfully!",
      thread: thread.reverse(),
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

export {
  createPost,
  deletePost,
  likeUnlikePost,
  getAllPosts,
  getLikedPosts,
  getUserReplies,
  getFollowingPosts,
  getUserPosts,
  editPost,
  isLiked,
  getPostById,
  getTrendingPosts,
  bookmarkPost,
  isBookmarked,
  getBookmarkedPosts,
  getReplies,
  getReplyCount,
  getParentThread,
}
