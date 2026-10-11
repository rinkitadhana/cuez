import mongoose, { Document } from "mongoose"

export interface IPost extends Document {
  user: mongoose.Types.ObjectId
  text?: string
  img?: string
  video?: string
  parent?: mongoose.Types.ObjectId
  likes: mongoose.Types.ObjectId[]
  bookmarks: mongoose.Types.ObjectId[]
  // Users who reposted this post.
  reposts: mongoose.Types.ObjectId[]
  // Set on a repost entry: the original post it shares. Repost entries
  // have no content of their own and appear in profiles/following feeds.
  repostOf?: mongoose.Types.ObjectId
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const postSchema = new mongoose.Schema<IPost>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: String,
    img: String,
    video: String,

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true, collection: "post-data" }
)

// One repost entry per user per post.
postSchema.index(
  { user: 1, repostOf: 1 },
  { unique: true, partialFilterExpression: { repostOf: { $type: "objectId" } } }
)

const Post = mongoose.model<IPost>("Post", postSchema)

export default Post
