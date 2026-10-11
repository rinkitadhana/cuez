"use client"
import Link from "next/link"
import { HiArrowPathRoundedSquare } from "react-icons/hi2"
import PostStructure from "./PostStructure"
import { useGetMe } from "@/hooks/useAuth"
import { Post } from "@/types/Post"

// A feed/profile item: either a post, or a repost entry shown as the
// original post with "<name> reposted" above it, like X.
const PostItem = ({ post }: { post: Post }) => {
  const { data: me } = useGetMe()

  // A repost entry whose original was just deleted.
  const isEmptyRepost =
    post.repostOf === null && !post.text && !post.img && !post.video
  if (isEmptyRepost) return null
  if (!post.repostOf) return <PostStructure post={post} />

  const byMe = !!me?.user && me.user._id === post.user?._id
  return (
    <div className="relative">
      <Link
        href={`/${post.user?.username}`}
        className="absolute left-4 top-2 z-10 flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:underline"
      >
        <HiArrowPathRoundedSquare className="size-4 ml-5" />
        {byMe ? "You" : post.user?.fullName || post.user?.username} reposted
      </Link>
      <div className="[&>section]:pt-8">
        <PostStructure post={post.repostOf} />
      </div>
    </div>
  )
}

export default PostItem
