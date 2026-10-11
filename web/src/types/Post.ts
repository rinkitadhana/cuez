import { z } from "zod"
import { userSchema } from "./User"

export const postSchema = z.object({
  _id: z.string(),
  user: userSchema,
  text: z.string().optional(),
  img: z.string().optional(),
  video: z.string().optional(),
  cuezBadge: z.string().optional(),
  likes: z.array(z.string()),
  bookmarks: z.array(z.string()),
  parent: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  editedAt: z.string().optional(),
})

export type Post = z.infer<typeof postSchema> & {
  // On a profile's Replies tab: the post being replied to (null if deleted).
  parentPost?: Post | null
}
