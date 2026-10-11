"use client"
import Image from "next/image"
import { BiCommentDetail, BiSolidUpvote, BiUpvote } from "react-icons/bi"
import { HiArrowPathRoundedSquare } from "react-icons/hi2"
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5"
import { RiShareBoxFill } from "react-icons/ri"
import { SlOptions } from "react-icons/sl"
import { useEffect, useRef, useState } from "react"
import { useGetMe } from "@/hooks/useAuth"
import {
  useBookmarkPost,
  useDeletePost,
  useGetPostById,
  useIsBookmarked,
  useIsLiked,
  useLikeUnlikePost,
  useGetReplyCount,
  useGetParentThread,
} from "@/hooks/usePost"
import { Loader2, X } from "lucide-react"
import config from "@/config/config"
import useMessageStore from "@/store/messageStore"
import { useRouter, useSearchParams } from "next/navigation"
import { useParams } from "next/navigation"
import MainWrapper from "@/layout/MainWrapper"
import Header from "../postComponents/Header"
import NoPost from "@/components/notAvailable/NoPost"
import CreateComment from "@/components/pageComponents/CreateComment"
import GetComments from "@/components/pageComponents/GetComments"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import PostWithoutImage from "@/components/skeletons/PostWithoutImage"
import EditPost from "@/components/pageComponents/EditPost"
import { useIsFollowing } from "@/hooks/useUser"
import { useFollowUnfollowUser } from "@/hooks/useUser"
import CuezBadge from "@/components/pageComponents/CuezBadge"
import PageHead from "@/components/pageComponents/PageHead"
import ParentThread from "@/components/pageComponents/ParentThread"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import LazyVideo from "@/components/LazyVideo"

const PostPage = () => {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const { data: post, isPending: isPostPending } = useGetPostById(id as string)
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showWarning, setShowWarning] = useState(false)
  const warningRef = useRef<HTMLDivElement>(null)
  const [commentActive, setCommentActive] = useState(false)
  const { data: authUser } = useGetMe()
  const { requireAuth } = useRequireAuth()
  const { mutate: deletePost, isPending: isDeletePending } = useDeletePost()
  const { mutate: likeUnlikePost, isPending: isLikeUnlikePending } =
    useLikeUnlikePost()
  const { data: isFollowing, isLoading: isFollowingPending } = useIsFollowing(
    post?.post?.user?._id || ""
  )
  const { mutate: followUnfollowUser, isPending: isFollowUnfollowPending } =
    useFollowUnfollowUser()
  const { mutate: bookmarkPost, isPending: isBookmarkPending } =
    useBookmarkPost()
  const { data: isBookmarked, isLoading: isBookmarkedPending } =
    useIsBookmarked(id as string)
  const { data: isLiked, isLoading: isLikedPending } = useIsLiked(id as string)
  const { data: replyCount } = useGetReplyCount(id as string)
  const isUpdated =
    post?.post.editedAt &&
    new Date(post.post.editedAt).getTime() !==
      new Date(post.post.createdAt).getTime()
  const { data: parentThreadData } = useGetParentThread(id as string)
  const parentUser =
    parentThreadData?.thread?.[parentThreadData.thread.length - 1]?.user

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (
        showWarning &&
        warningRef.current &&
        !warningRef.current.contains(event.target as Node)
      ) {
        setShowWarning(false)
      }
      // Add check for comment section click outside
      const commentInput = document.querySelector("#comment-input")
      if (commentInput && !commentInput.contains(event.target as Node)) {
        setCommentActive(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showWarning])

  useEffect(() => {
    if (searchParams.get("focus") === "comment-input") {
      const commentInput = document.querySelector(
        "#comment-input"
      ) as HTMLInputElement
      if (commentInput) {
        commentInput.focus()
      }
      setCommentActive(true)
    }
  }, [searchParams])

  const handleDeletePost = () => {
    if (!post?.post._id) return
    deletePost(post.post._id, {
      onSuccess: () => {
        setIsOpen(false)
        setShowWarning(false)
        router.back()
      },
    })
  }

  const userProfile = () => {
    if (!post?.post.user._id) return
    router.push(`/${post?.post.user.username}`)
  }

  const handleBookmarkPost = () => {
    if (!post?.post._id) return
    const postId = post.post._id
    requireAuth("bookmark", () => bookmarkPost(postId))
  }
  const handleLikeUnlikePost = () => {
    if (!post?.post._id) return
    const postId = post.post._id
    requireAuth("like", () => likeUnlikePost(postId))
  }

  const handleShare = async () => {
    if (!post?.post._id) return
    const shareData = {
      title: "Check out this post",
      text: "Here's something interesting!",
      url: `${config.frontendUrl}/post/${post.post._id}`,
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

  if (isPostPending) {
    return (
      <MainWrapper>
        <Header title="Post" />
        <PostSkeleton />
        <PostWithoutImage />
        <PostWithoutImage />
        <PostWithoutImage />
      </MainWrapper>
    )
  }
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(date).toLocaleString("en-US", options)
  }
  const isOwner = authUser?.user._id === post?.post?.user?._id

  return (
    <MainWrapper>
      <PageHead
        title={`${post?.post?.user?.fullName} on Cuez: "${post?.post?.text}"`}
      />
      <Header title="Post" />
      {post?.post ? (
        <section>
          {post.post.parent && <ParentThread postId={id as string} />}
          <div className="flex relative flex-col gap-4 p-4">
            {post.post.parent && parentUser && (
              <div className="text-sm text-zinc-400 mb-2 flex items-center">
                <span>Replying to </span>
                <span
                  className="text-blue-500 hover:underline cursor-pointer ml-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${parentUser.username}`)
                  }}
                >
                  @{parentUser.username}
                </span>
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Image
                onClick={userProfile}
                src={post?.post?.user?.profileImg || "/img/pfp/default.webp"}
                alt="user avatar"
                width={48}
                height={48}
                quality={100}
                priority
                className="rounded-lg size-10 select-none cursor-pointer object-cover bg-white hover:brightness-90 transition-all duration-200"
              />
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col -space-y-1">
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1 items-center">
                          <h1
                            onClick={userProfile}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {post?.post?.user?.fullName || "Deleted User"}
                          </h1>
                          {post?.post?.user?.cuezBadge && <CuezBadge />}
                        </div>
                        {!isOwner &&
                          (isFollowingPending ? (
                            <div className=" text-sm text-zinc-400">...</div>
                          ) : isFollowing?.isFollowing ? (
                            <div className="text-xs text-zinc-400">
                              Following
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                requireAuth("follow", () =>
                                  followUnfollowUser(post?.post?.user?._id || "")
                                )
                              }
                            >
                              {isFollowUnfollowPending ? (
                                <div className=" text-sm text-zinc-400">
                                  ...
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer">
                                  Follow
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                      <div className="flex gap-1 items-center">
                        <p className="text-sm text-zinc-400">
                          @{post?.post?.user?.username || "DeletedUser"}
                        </p>
                        <div className="text-sm text-zinc-400">
                          <span> {" • "}</span>
                          <span>
                            {formatDate(new Date(post?.post?.createdAt))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="select-none" ref={menuRef}>
                    {isOwner && (
                      <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isOpen ? "bg-zinc-700" : "hover:bg-zinc-700"
                        }`}
                      >
                        <SlOptions />
                      </button>
                    )}
                    {isOpen && (
                      <div className="absolute flex flex-col items-start gap-0.5 top-14 right-5 bg-zinc-900 z-10 border border-zinc-700 p-2 w-32 rounded-lg">
                        <EditPost post={post?.post} />
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
                <div className="flex flex-col gap-4 w-full">
                  <div>{post?.post?.text}</div>
                  {post?.post?.img && (
                    <div
                      onClick={() => setIsImageModalOpen(true)}
                      className="cursor-pointer select-none"
                    >
                      <Image
                        src={post?.post?.img}
                        alt="Post image"
                        width={600}
                        height={600}
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="rounded-lg w-full select-none"
                      />
                    </div>
                  )}
                  {post?.post?.video && (
                    <div>
                      <LazyVideo
                        src={post.post.video}
                        className="rounded-lg w-full select-none"
                      />
                    </div>
                  )}
                  <div className="text-sm text-zinc-400">
                    {isUpdated
                      ? `Edited on ${formatDateTime(
                          new Date(post?.post?.editedAt || "")
                        )}`
                      : `Posted on ${formatDateTime(
                          new Date(post?.post?.createdAt || "")
                        )}`}
                  </div>
                  <div className="flex justify-between text-lg select-none text-zinc-400">
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => requireAuth("comment", () => setCommentActive(true))}
                          className="flex items-center gap-1 p-1.5 hover:bg-blue-500/30 group/comment rounded-lg transition-all duration-200"
                        >
                          <BiCommentDetail className="group-hover/comment:scale-[85%] transition-all duration-300" />
                        </button>
                        <span className="text-sm">
                          {replyCount?.count || 0}
                        </span>
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
                          {isLikeUnlikePending || isLikedPending ? (
                            <Loader2 className="animate-spin size-[18px]" />
                          ) : isLiked?.liked ? (
                            <BiSolidUpvote className="group-hover/like:-translate-y-0.5 text-pink-500 transition-all duration-300" />
                          ) : (
                            <BiUpvote className="group-hover/like:-translate-y-0.5 transition-all duration-300" />
                          )}
                        </button>
                        <span className="text-sm">
                          {post?.post?.likes?.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {post?.post?.bookmarks?.length}
                        </span>
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
                      </div>
                      <button
                        onClick={handleShare}
                        className="p-1.5 hover:bg-green-500/30 rounded-lg transition-all duration-200"
                      >
                        <RiShareBoxFill />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CreateComment commentActive={commentActive} />
          <GetComments />

          {showWarning && (
            <div className="fixed inset-0 bg-bgClr/50 backdrop-blur-sm flex justify-center items-center z-[10000]">
              <div
                ref={warningRef}
                className="bg-bgClr border border-zinc-700 w-full max-w-[400px] rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Delete post?</h2>
                <p className="text-zinc-400 mb-6">
                  You are about to delete this post. Are you sure you want to
                  proceed?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-4 py-1.5 rounded-xl font-semibold hover:bg-zinc-800 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-1.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                  >
                    {isDeletePending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isImageModalOpen && (
            <div className="fixed inset-0 bg-bgClr/50 backdrop-blur-sm flex justify-center items-center z-[10000]">
              <Image
                src={post?.post?.img || ""}
                alt="Post image"
                width={1920}
                height={1080}
                className="rounded-lg max-w-full max-h-full object-contain select-none"
              />
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-zinc-700/50 rounded-xl p-2 transition-all duration-200"
              >
                <X />
              </button>
            </div>
          )}
        </section>
      ) : (
        <NoPost />
      )}
    </MainWrapper>
  )
}

export default PostPage
