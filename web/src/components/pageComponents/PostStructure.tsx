"use client"
import Image from "next/image"
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
  useIsBookmarked,
  useIsLiked,
  useLikeUnlikePost,
  useGetReplyCount,
} from "@/hooks/usePost"
import { Loader2, X } from "lucide-react"
import config from "@/config/config"
import useMessageStore from "@/store/messageStore"
import { useRouter } from "next/navigation"
import EditPost from "./EditPost"
import { useFollowUnfollowUser, useIsFollowing } from "@/hooks/useUser"
import CuezBadge from "./CuezBadge"
import { useRequireAuth } from "@/hooks/useRequireAuth"

interface PostStructureProps {
  post: Post
  inThread?: boolean
}

const PostStructure = ({ post, inThread = false }: PostStructureProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showWarning, setShowWarning] = useState(false)
  const warningRef = useRef<HTMLDivElement>(null)
  const postRef = useRef<HTMLElement>(null)
  const { data: authUser } = useGetMe()
  const { requireAuth } = useRequireAuth()
  const { mutate: deletePost, isPending } = useDeletePost()
  const { mutate: likeUnlikePost, isPending: isLikeUnlikePending } =
    useLikeUnlikePost()
  const { mutate: bookmarkPost, isPending: isBookmarkPending } =
    useBookmarkPost()
  const { data: isBookmarked, isLoading: isBookmarkedPending } =
    useIsBookmarked(post._id)
  const { data: isLiked, isLoading: isLikedPending } = useIsLiked(post._id)
  const { data: replyCount } = useGetReplyCount(post._id)
  const { data: isFollowing, isLoading: isFollowingPending } = useIsFollowing(
    post?.user?._id || ""
  )
  const {
    mutate: followUnfollowUser,
    isPending: isFollowUnfollowPending,
    isError: isFollowUnfollowError,
  } = useFollowUnfollowUser()
  const isOwner = authUser?.user._id === post?.user?._id

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
    deletePost(post._id, {
      onSuccess: () => {
        setIsOpen(false)
        setShowWarning(false)
      },
      onError: () => {
        setShowWarning(false)
      },
    })
  }

  const handleLikeUnlikePost = () => {
    requireAuth(() => likeUnlikePost(post._id))
  }

  const userProfile = () => {
    if (!post?.user._id) return
    router.push(`/${post?.user.username}`)
  }

  const handleBookmarkPost = () => {
    requireAuth(() => bookmarkPost(post._id))
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
      className={`flex relative flex-col gap-3 border-b border-zinc-700 hover:bg-zinc-900 transition-all duration-200 cursor-pointer p-4 ${
        inThread ? "thread-post" : ""
      } ${inThread ? "has-connector" : ""}`}
    >
      <div className="flex gap-2 w-full">
        <Image
          onClick={(e) => {
            e.stopPropagation()
            userProfile()
          }}
          src={post?.user?.profileImg || "/img/pfp/default.webp"}
          alt="user avatar"
          width={32}
          height={32}
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
                    (isFollowingPending ? (
                      <div className="text-sm text-zinc-400">...</div>
                    ) : isFollowing?.isFollowing ? (
                      <div className="text-xs text-zinc-400">Following</div>
                    ) : (
                      <div
                        onClick={() =>
                          requireAuth(() => followUnfollowUser(post.user._id))
                        }
                      >
                        {isFollowUnfollowPending && (
                          <div className="text-sm text-zinc-400">...</div>
                        )}
                        {isFollowUnfollowError && ""}
                        {!isFollowUnfollowPending && !isFollowUnfollowError && (
                          <div className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer">
                            Follow
                          </div>
                        )}
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

          {post?.img && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                setIsImageModalOpen(true)
              }}
              className="relative h-80 max-h-96 overflow-hidden rounded-xl my-2"
            >
              <Image
                src={post.img}
                alt="Post image"
                fill
                className="object-cover cursor-pointer hover:brightness-90 transition-all duration-200"
              />
            </div>
          )}

          {post?.video && (
            <div className="my-2">
              <video
                controls
                src={post?.video}
                className="rounded-lg w-full select-none h-80 bg-black"
              ></video>
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
                    requireAuth(() =>
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
                  onClick={() => requireAuth()}
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
                  {isLikeUnlikePending || isLikedPending ? (
                    <Loader2 className="animate-spin size-[18px]" />
                  ) : isLiked?.liked ? (
                    <BiSolidUpvote className="group-hover/like:-translate-y-0.5 text-pink-500 transition-all duration-300" />
                  ) : (
                    <BiUpvote className="group-hover/like:-translate-y-0.5 transition-all duration-300" />
                  )}
                </button>
                <span className="text-sm">{post?.likes.length}</span>
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
                {isBookmarkPending || isBookmarkedPending ? (
                  <Loader2 className="animate-spin size-[18px]" />
                ) : isBookmarked?.isBookmarked ? (
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
                disabled={isPending}
                className="py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 transition-all duration-200 text-white"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Deleting</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image modal */}
      {isImageModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsImageModalOpen(false)
          }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        >
          <div className="relative w-[50%]  mx-2">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all duration-200"
            >
              <X className="size-6" />
            </button>
            <Image
              src={post?.img || "/img/pfp/default.webp"}
              alt="Post"
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default PostStructure
