"use client"
import SafeImage from "@/components/media/SafeImage"
import { BiCommentDetail, BiSolidUpvote, BiUpvote } from "react-icons/bi"
import { HiArrowPathRoundedSquare } from "react-icons/hi2"
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5"
import { RiShareBoxFill } from "react-icons/ri"
import { SlOptions } from "react-icons/sl"
import { useEffect, useRef, useState } from "react"
import { Post } from "@/types/Post"
import { useGetMe } from "@/hooks/useAuth"
import {
  useBookmarkPost,
  useDeletePost,
  useLikeUnlikePost,
  useGetReplyCount,
} from "@/hooks/usePost"
import { X } from "lucide-react"
import config from "@/config/config"
import useMessageStore from "@/store/messageStore"
import { useRouter } from "next/navigation"
import EditPost from "./EditPost"
import { useFollowUnfollowUser } from "@/hooks/useUser"
import { isOptimisticId } from "@/lib/queryCache"
import CuezBadge from "./CuezBadge"
import PostMedia from "../media/PostMedia"
import { useRequireAuth } from "@/hooks/useRequireAuth"

interface PostStructureProps {
  post: Post
  inThread?: boolean
}

const PostStructure = ({ post, inThread = false }: PostStructureProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showWarning, setShowWarning] = useState(false)
  const warningRef = useRef<HTMLDivElement>(null)
  const postRef = useRef<HTMLElement>(null)
  const { data: authUser } = useGetMe()
  const { requireAuth } = useRequireAuth()
  const { mutate: deletePost } = useDeletePost()
  const { mutate: likeUnlikePost } = useLikeUnlikePost()
  const { mutate: bookmarkPost } = useBookmarkPost()
  const { data: replyCount } = useGetReplyCount(post._id)
  const { mutate: followUnfollowUser } = useFollowUnfollowUser()
  // Derived from cached data so optimistic updates show instantly.
  const meId = authUser?.user._id
  const isOwner = !!meId && meId === post?.user?._id
  const isLiked = !!meId && post.likes.includes(meId)
  const isBookmarked = !!meId && post.bookmarks.includes(meId)
  const isFollowing =
    !!post?.user?._id && !!authUser?.user.followings.includes(post.user._id)
  const isOptimistic = isOptimisticId(post._id)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !event.composedPath().includes(menuRef.current)
      ) {
        setIsOpen(false)
      }

      if (
        showWarning &&
        warningRef.current &&
        !warningRef.current.contains(event.target as Node) &&
        !event.composedPath().includes(warningRef.current)
      ) {
        setShowWarning(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showWarning])

  const handleDeletePost = () => {
    setIsOpen(false)
    setShowWarning(false)
    deletePost(post._id)
  }

  const handleLikeUnlikePost = () => {
    requireAuth("like", () => likeUnlikePost(post._id))
  }

  const userProfile = () => {
    if (!post?.user._id) return
    router.push(`/${post?.user.username}`)
  }

  const handleBookmarkPost = () => {
    requireAuth("bookmark", () => bookmarkPost(post._id))
  }

  const handleShare = async () => {
    const shareData = {
      title: "Check out this post",
      text: "Here's something interesting!",
      url: `${config.frontendUrl}/post/${post._id}`,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        useMessageStore.setState({
          message: "Link copied to clipboard!",
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000
    )
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  return (
    <section
      onClick={() => router.push(`/post/${post._id}`)}
      ref={postRef}
      className={`flex relative flex-col gap-3 ${
        inThread ? "" : "border-b border-zinc-700"
      } hover:bg-zinc-900 transition-all duration-200 cursor-pointer p-4 ${
        inThread ? "thread-post" : ""
      } ${inThread ? "has-connector" : ""} ${
        isOptimistic ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <div className="flex gap-2 w-full">
        <SafeImage
          kind="avatar"
          onClick={(e) => {
            e.stopPropagation()
            userProfile()
          }}
          src={post?.user?.profileImg || "/img/pfp/default.webp"}
          alt="user avatar"
          width={40}
          height={40}
          className="rounded-lg size-10 select-none cursor-pointer bg-white object-cover hover:brightness-90 transition-all duration-200"
          style={
            inThread
              ? {
                  position: "relative",
                  zIndex: 10,
                }
              : {}
          }
        />
        <div className="flex flex-col gap-1 w-full">
          {/* Header with user info */}
          <div className="flex items-center justify-between">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex gap-2 items-center"
            >
              <div className="flex flex-col -space-y-1">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 items-center">
                    <h1
                      onClick={userProfile}
                      className="font-semibold hover:underline cursor-pointer"
                    >
                      {post?.user?.fullName || "Deleted User"}
                    </h1>
                    {post?.user?.cuezBadge && <CuezBadge />}
                  </div>

                  {!isOwner &&
                    post?.user?._id &&
                    (isFollowing ? (
                      <div className="text-xs text-zinc-400">Following</div>
                    ) : (
                      <div
                        onClick={() =>
                          requireAuth("follow", () =>
                            followUnfollowUser(post.user._id)
                          )
                        }
                        className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
                      >
                        Follow
                      </div>
                    ))}
                </div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm text-zinc-400">
                    @{post?.user?.username || "DeletedUser"}
                  </p>
                  <div className="text-sm text-zinc-400">
                    <span> {" • "}</span>
                    <span>{formatDate(new Date(post.createdAt))}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="select-none" ref={menuRef}>
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                  }}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isOpen ? "bg-zinc-700" : "hover:bg-zinc-700"
                  }`}
                >
                  <SlOptions />
                </button>
              )}
              {isOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className="absolute flex flex-col items-start gap-0.5 top-14 right-5 bg-zinc-900 z-10 border border-zinc-700 p-2 w-32 rounded-lg"
                >
                  <EditPost post={post} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowWarning(true)
                    }}
                    type="button"
                    className="py-1 px-3 text-left hover:bg-zinc-700 rounded-lg transition-all duration-200 w-full"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post content */}
          {post.text && <p className="leading-relaxed py-1">{post.text}</p>}

          {(post.img || post.video) && (
            <div className="my-2">
              <PostMedia img={post.img} video={post.video} />
            </div>
          )}

          {/* Post actions */}
          <div className="flex justify-between text-lg select-none text-zinc-400 mt-2">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex gap-3 items-center"
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    requireAuth("comment", () =>
                      router.push(`/post/${post._id}?focus=comment-input`)
                    )
                  }}
                  className="flex items-center gap-1 p-1.5 hover:bg-blue-500/30 group/comment rounded-lg transition-all duration-200"
                >
                  <BiCommentDetail className="group-hover/comment:scale-[85%] transition-all duration-300" />
                </button>
                <span className="text-sm">{replyCount?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => requireAuth("repost")}
                  className="p-1.5 hover:bg-green-500/30 rounded-lg transition-all group/repost  duration-200"
                >
                  <HiArrowPathRoundedSquare className="group-hover/repost:rotate-180 transition-all duration-300" />
                </button>
                <span className="text-sm">0</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLikeUnlikePost}
                  className="flex items-center gap-1 p-1.5 hover:bg-pink-500/30 group/like rounded-lg transition-all duration-200"
                >
                  {isLiked ? (
                    <BiSolidUpvote className="group-hover/like:-translate-y-0.5 text-pink-500 transition-all duration-300" />
                  ) : (
                    <BiUpvote className="group-hover/like:-translate-y-0.5 transition-all duration-300" />
                  )}
                </button>
                <span className={`text-sm ${isLiked ? "text-pink-500" : ""}`}>
                  {post?.likes.length}
                </span>
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex gap-1 items-center"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleBookmarkPost()
                }}
                className="p-1.5 hover:bg-blue-500/30 rounded-lg transition-all duration-200"
              >
                {isBookmarked ? (
                  <IoBookmark className="text-blue-500" />
                ) : (
                  <IoBookmarkOutline />
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 hover:bg-blue-500/30 rounded-lg transition-all duration-200"
              >
                <RiShareBoxFill />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning model */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div
            ref={warningRef}
            className="bg-zinc-900 rounded-lg p-4 max-w-md w-full mx-2 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Delete Post</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowWarning(false)
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-700 transition-all duration-200"
              >
                <X />
              </button>
            </div>
            <p className="text-zinc-400">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowWarning(false)
                }}
                className="py-2 px-4 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePost()
                }}
                className="py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 transition-all duration-200 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PostStructure
