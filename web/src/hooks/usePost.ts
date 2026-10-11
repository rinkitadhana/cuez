import config from "../config/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import useFeedTypeStore from "@/store/FeedTypeStore"
import useMessageStore from "@/store/messageStore"
import { Post } from "../types/Post"
import { useInfiniteList } from "./useInfiniteList"
import {
  OPTIMISTIC_PREFIX,
  Snapshot,
  findPost,
  getMe,
  isOptimisticId,
  postQueries,
  prependToList,
  restore,
  snapshot,
  toggleId,
  updateMe,
  updatePost,
} from "@/lib/queryCache"

interface MessageResponse {
  message: string
}

const errorMessage = (error: AxiosError, fallback: string) =>
  (error.response?.data as MessageResponse)?.message || fallback

export const useGetPosts = () => {
  const { feedType } = useFeedTypeStore()
  return useInfiniteList<Post, "posts">({
    queryKey: ["posts", feedType],
    path:
      feedType === "Following" ? "/post/following-posts" : "/post/all-posts",
    itemsKey: "posts",
  })
}

interface CreatePostData {
  text?: string
  img?: string
  video?: string
  parentId?: string
}

const createPost = async (postData: CreatePostData) => {
  const { data } = await axios.post<MessageResponse>(
    config.backendUrl + "/post/create-post",
    postData,
    { withCredentials: true }
  )
  return data
}

// Placeholder shown in lists until the server returns the real post.
const buildOptimisticPost = (
  user: Post["user"],
  data: CreatePostData
): Post => {
  const now = new Date().toISOString()
  return {
    _id: `${OPTIMISTIC_PREFIX}${Date.now()}`,
    user,
    text: data.text || undefined,
    img: data.img || undefined,
    video: data.video || undefined,
    parent: data.parentId,
    likes: [],
    bookmarks: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const useCreatePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    MessageResponse,
    AxiosError,
    CreatePostData,
    { snap?: Snapshot; username?: string }
  >({
    mutationFn: createPost,
    onMutate: async (postData) => {
      const me = getMe(queryClient)
      if (!me) return {}
      const snap = await snapshot(queryClient, [postQueries])
      const optimistic = buildOptimisticPost(me, postData)
      prependToList(queryClient, ["posts", "All"], "posts", optimistic)
      prependToList(
        queryClient,
        ["user-posts", me.username],
        "userPosts",
        optimistic
      )
      return { snap, username: me.username }
    },
    onSuccess: (data) => setMessage(data.message, "success"),
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      setMessage(errorMessage(error, "Create Post failed!"), "error")
    },
    onSettled: (_, __, ___, context) => {
      // Swap the placeholder for the real post (ids, media URLs).
      queryClient.invalidateQueries({ queryKey: ["posts", "All"] })
      queryClient.invalidateQueries({
        queryKey: ["user-posts", context?.username],
      })
    },
  })
}

const deletePost = async (postId: string) => {
  const { data } = await axios.delete<MessageResponse>(
    config.backendUrl + `/post/delete-post/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useDeletePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    MessageResponse,
    AxiosError,
    string,
    { snap?: Snapshot; parentId?: string }
  >({
    mutationFn: deletePost,
    onMutate: async (postId) => {
      const parentId = findPost(queryClient, postId)?.parent
      const snap = await snapshot(queryClient, [
        postQueries,
        { queryKey: ["reply-count", parentId] },
      ])
      updatePost(queryClient, postId, () => null)
      if (parentId) {
        queryClient.setQueryData<GetReplyCountResponse>(
          ["reply-count", parentId],
          (old) => old && { ...old, count: Math.max(0, old.count - 1) }
        )
      }
      return { snap, parentId }
    },
    onSuccess: (data) => setMessage(data.message, "success"),
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      setMessage(errorMessage(error, "Delete Post failed!"), "error")
    },
  })
}

interface EditPostData {
  text?: string
  img?: string
  video?: string
}

const editPost = async (postId: string, postData: EditPostData) => {
  const { data } = await axios.patch<MessageResponse>(
    config.backendUrl + `/post/edit-post/${postId}`,
    postData,
    { withCredentials: true }
  )
  return data
}

export const useEditPost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    MessageResponse,
    AxiosError,
    { postId: string; postData: EditPostData },
    { snap?: Snapshot; mediaChanged?: boolean }
  >({
    mutationFn: ({ postId, postData }) => editPost(postId, postData),
    onMutate: async ({ postId, postData }) => {
      const snap = await snapshot(queryClient, [postQueries])
      const before = findPost(queryClient, postId)
      const now = new Date().toISOString()
      updatePost(queryClient, postId, (post) => ({
        ...post,
        text: postData.text,
        img: postData.img || undefined,
        video: postData.video || undefined,
        editedAt: now,
      }))
      const mediaChanged =
        (postData.img || "") !== (before?.img || "") ||
        (postData.video || "") !== (before?.video || "")
      return { snap, mediaChanged }
    },
    onSuccess: (data) => setMessage(data.message, "success"),
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      setMessage(errorMessage(error, "Edit Post failed!"), "error")
    },
    onSettled: (_, __, { postId }, context) => {
      // New media comes back as an uploaded URL; text-only edits are final.
      if (context?.mediaChanged) {
        queryClient.invalidateQueries(postQueries)
      } else {
        queryClient.invalidateQueries({ queryKey: ["post", postId] })
      }
    },
  })
}

const likeUnlikePost = async (postId: string) => {
  const { data } = await axios.post<MessageResponse>(
    config.backendUrl + `/post/like-post/${postId}`,
    {},
    { withCredentials: true }
  )
  return data
}

export const useLikeUnlikePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    MessageResponse,
    AxiosError,
    string,
    { snap?: Snapshot; username?: string }
  >({
    mutationFn: likeUnlikePost,
    onMutate: async (postId) => {
      const me = getMe(queryClient)
      if (!me) return {}
      const snap = await snapshot(queryClient, [postQueries])
      updatePost(queryClient, postId, (post) => ({
        ...post,
        likes: toggleId(post.likes, me._id, !post.likes.includes(me._id)),
      }))
      return { snap, username: me.username }
    },
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      setMessage(errorMessage(error, "Like/Unlike Post failed!"), "error")
    },
    onSettled: (_, __, ___, context) => {
      // Your Likes tab picks this up next time it's opened.
      queryClient.invalidateQueries({
        queryKey: ["liked-posts", context?.username],
        refetchType: "none",
      })
    },
  })
}

const getPostById = async (postId: string) => {
  const { data } = await axios.get<{ message: string; post: Post }>(
    config.backendUrl + `/post/post/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useGetPostById = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId),
  })
}

export const useGetUserPosts = (username: string) => {
  return useInfiniteList<Post, "userPosts">({
    queryKey: ["user-posts", username],
    path: `/post/user-posts/${username}`,
    itemsKey: "userPosts",
    enabled: !!username,
  })
}

export const useGetUserReplies = (username: string) => {
  return useInfiniteList<Post, "userReplies">({
    queryKey: ["user-replies", username],
    path: `/post/user-replies/${username}`,
    itemsKey: "userReplies",
    enabled: !!username,
  })
}

export const useGetLikedPosts = (username: string) => {
  return useInfiniteList<Post, "likedPosts">({
    queryKey: ["liked-posts", username],
    path: `/post/liked-posts/${username}`,
    itemsKey: "likedPosts",
    enabled: !!username,
  })
}

const bookmarkPost = async (postId: string) => {
  const { data } = await axios.post<MessageResponse>(
    config.backendUrl + `/post/bookmark-post/${postId}`,
    {},
    { withCredentials: true }
  )
  return data
}

export const useBookmarkPost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<MessageResponse, AxiosError, string, { snap?: Snapshot }>(
    {
      mutationFn: bookmarkPost,
      onMutate: async (postId) => {
        const me = getMe(queryClient)
        if (!me) return {}
        const snap = await snapshot(queryClient, [
          postQueries,
          { queryKey: ["me"] },
        ])
        const post = findPost(queryClient, postId)
        const bookmarking = !post?.bookmarks.includes(me._id)
        updatePost(queryClient, postId, (p) => ({
          ...p,
          bookmarks: toggleId(p.bookmarks, me._id, bookmarking),
        }))
        updateMe(queryClient, (user) => ({
          ...user,
          bookmarks: toggleId(user.bookmarks, postId, bookmarking),
        }))
        if (!bookmarking) {
          // Drop it from the Bookmarks page right away.
          queryClient.setQueriesData(
            { queryKey: ["bookmarked-posts"] },
            (data: unknown) =>
              data &&
              typeof data === "object" &&
              "pages" in data &&
              Array.isArray(data.pages)
                ? {
                    ...data,
                    pages: data.pages.map((page: { posts: Post[] }) => ({
                      ...page,
                      posts: page.posts.filter((p) => p._id !== postId),
                    })),
                  }
                : data
          )
        }
        setMessage(
          bookmarking ? "Added to your bookmarks" : "Removed from bookmarks",
          "success"
        )
        return { snap }
      },
      onError: (error, _, context) => {
        restore(queryClient, context?.snap)
        setMessage(errorMessage(error, "Bookmark Post failed!"), "error")
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ["bookmarked-posts"],
          refetchType: "none",
        })
      },
    }
  )
}

export const useGetBookmarkedPosts = () => {
  return useInfiniteList<Post, "posts">({
    queryKey: ["bookmarked-posts"],
    path: "/post/bookmarked-posts",
    itemsKey: "posts",
  })
}

export const useCreateReply = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    MessageResponse,
    AxiosError,
    { postData: CreatePostData; parentId: string },
    { snap?: Snapshot }
  >({
    mutationFn: ({ postData, parentId }) =>
      createPost({ ...postData, parentId }),
    onMutate: async ({ postData, parentId }) => {
      const me = getMe(queryClient)
      if (!me) return {}
      const snap = await snapshot(queryClient, [
        { queryKey: ["replies", parentId] },
        { queryKey: ["reply-count", parentId] },
      ])
      prependToList(
        queryClient,
        ["replies", parentId],
        "replies",
        buildOptimisticPost(me, { ...postData, parentId })
      )
      queryClient.setQueryData<GetReplyCountResponse>(
        ["reply-count", parentId],
        (old) => old && { ...old, count: old.count + 1 }
      )
      return { snap }
    },
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      setMessage(errorMessage(error, "Failed to create reply!"), "error")
    },
    onSettled: (_, __, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", parentId] })
      queryClient.invalidateQueries({ queryKey: ["reply-count", parentId] })
      // Your Replies tab picks it up next time it's opened.
      queryClient.invalidateQueries({
        queryKey: ["user-replies", getMe(queryClient)?.username],
        refetchType: "none",
      })
    },
  })
}

export const useGetReplies = (postId: string) => {
  return useInfiniteList<Post, "replies">({
    queryKey: ["replies", postId],
    path: `/post/replies/${postId}`,
    itemsKey: "replies",
    enabled: !!postId,
  })
}

interface GetReplyCountResponse {
  message: string
  count: number
}

const getReplyCount = async (postId: string) => {
  const { data } = await axios.get<GetReplyCountResponse>(
    config.backendUrl + `/post/reply-count/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useGetReplyCount = (postId: string) => {
  return useQuery<GetReplyCountResponse, AxiosError>({
    queryKey: ["reply-count", postId],
    queryFn: () => getReplyCount(postId),
    enabled: !!postId && !isOptimisticId(postId),
  })
}

interface GetParentThreadResponse {
  message: string
  thread: Post[]
}

const getParentThread = async (postId: string) => {
  const { data } = await axios.get<GetParentThreadResponse>(
    config.backendUrl + `/post/parent-thread/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useGetParentThread = (postId: string) => {
  return useQuery<GetParentThreadResponse, AxiosError>({
    queryKey: ["parent-thread", postId],
    queryFn: () => getParentThread(postId),
    enabled: !!postId,
  })
}
