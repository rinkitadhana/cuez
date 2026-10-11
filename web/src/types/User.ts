import { z } from "zod"

export const userSchema = z.lazy(() =>
  z.object({
    _id: z.string(),
    fullName: z.string(),
    username: z.string(),
    email: z.string(),
    profileImg: z.string(),
    coverImg: z.string(),
    bio: z.string(),
    link: z.string(),
    likedPosts: z.array(z.string()),
    // Only present on the logged-in user (/auth/me).
    bookmarks: z.array(z.string()).optional(),
    cuezBadge: z.boolean(),
    location: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    followers: z.array(z.string()),
    followings: z.array(z.string()),
  })
)

export type User = z.infer<typeof userSchema>
