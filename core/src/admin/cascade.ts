import mongoose from "mongoose"
import Conversation from "../models/conversation-model"
import { Feedback } from "../models/feedback-model"
import Message from "../models/message-model"
import Notification from "../models/notification-model"
import OTP from "../models/OTP-model"
import Post from "../models/post-model"
import User from "../models/user-model"
import { deleteFromR2 } from "../utils/storage"

type Id = mongoose.Types.ObjectId

const deleteMedia = async (urls: (string | null | undefined)[]) => {
  await Promise.all(urls.filter((u): u is string => !!u).map(deleteFromR2))
}

/**
 * Delete posts and everything hanging off them: replies (any depth), reposts,
 * notifications, likes/bookmarks references and uploaded media.
 * Returns how many post documents were removed.
 */
export const deletePostsCascade = async (rootIds: Id[]): Promise<number> => {
  const all = new Map<string, Id>(rootIds.map((id) => [String(id), id]))
  let frontier = rootIds
  while (frontier.length) {
    const children = await Post.find({
      $or: [{ parent: { $in: frontier } }, { repostOf: { $in: frontier } }],
    }).select("_id")
    frontier = children
      .map((c) => c._id as Id)
      .filter((id) => !all.has(String(id)))
    frontier.forEach((id) => all.set(String(id), id))
  }
  const ids = [...all.values()]
  if (!ids.length) return 0

  const docs = await Post.find({ _id: { $in: ids } }).select(
    "img video user repostOf"
  )
  await deleteMedia(docs.flatMap((d) => [d.img, d.video]))

  // A removed repost entry un-reposts: take the user off the original's list
  // unless that original is going away too.
  const unrepost = docs
    .filter((d) => d.repostOf && !all.has(String(d.repostOf)))
    .map((d) => ({
      updateOne: {
        filter: { _id: d.repostOf },
        update: { $pull: { reposts: d.user } },
      },
    }))
  if (unrepost.length) await Post.bulkWrite(unrepost)

  await Promise.all([
    Notification.deleteMany({ post: { $in: ids } }),
    User.updateMany(
      { $or: [{ likedPosts: { $in: ids } }, { bookmarks: { $in: ids } }] },
      { $pull: { likedPosts: { $in: ids }, bookmarks: { $in: ids } } }
    ),
  ])
  const result = await Post.deleteMany({ _id: { $in: ids } })
  return result.deletedCount
}

/** Delete conversations (and their messages + image uploads). */
export const deleteConversationsCascade = async (ids: Id[]) => {
  if (!ids.length) return
  const withImages = await Message.find({
    conversation: { $in: ids },
    img: { $exists: true, $ne: null },
  }).select("img")
  await deleteMedia(withImages.map((m) => m.img))
  await Message.deleteMany({ conversation: { $in: ids } })
  await Conversation.deleteMany({ _id: { $in: ids } })
}

/** Delete a user and everything of theirs: content, chats, follows, reactions. */
export const deleteUserCascade = async (userId: Id) => {
  const user = await User.findById(userId).select("email profileImg coverImg")
  if (!user) return null

  const ownPosts = await Post.find({ user: userId }).select("_id")
  const posts = await deletePostsCascade(ownPosts.map((p) => p._id as Id))

  const conversations = await Conversation.find({ participants: userId }).select(
    "_id"
  )
  await deleteConversationsCascade(conversations.map((c) => c._id as Id))

  // Messages the user sent can only exist inside their conversations (deleted above).
  await Promise.all([
    User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
    User.updateMany({ followings: userId }, { $pull: { followings: userId } }),
    Post.updateMany(
      { $or: [{ likes: userId }, { bookmarks: userId }, { reposts: userId }] },
      { $pull: { likes: userId, bookmarks: userId, reposts: userId } }
    ),
    Notification.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
    Feedback.deleteMany({ user: userId }),
    OTP.deleteMany({ email: user.email }),
    deleteMedia([user.profileImg, user.coverImg]),
  ])

  await User.deleteOne({ _id: userId })
  return { posts }
}
