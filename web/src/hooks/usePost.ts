import config from "../config/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import useFeedTypeStore from "@/store/FeedTypeStore"
import useMessageStore from "@/store/messageStore"
import { Post } from "../types/Post"

interface GetPostsResponse {
  message: string
  posts: Post[]
}

const getPosts = async (feedType: string): Promise<GetPostsResponse> => {
  const getPostEndPoint = () => {
    switch (feedType) {
      case "All":
        return "/post/all-posts"
      case "Following":
        return "/post/following-posts"
      default:
        return "/post/all-posts"
    }
  }
  try {
    const response = await axios.get<GetPostsResponse>(
      config.backendUrl + getPostEndPoint(),
      { withCredentials: true }
    )
    return response.data
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

export const useGetPosts = () => {
  const { feedType } = useFeedTypeStore()
  return useQuery<GetPostsResponse, AxiosError>({
    queryKey: ["posts", feedType],
    queryFn: () => getPosts(feedType),
  })
}

interface CreatePostResponse {
  message: string
}

interface CreatePostData {
  text?: string
  img?: string
  video?: string
  parentId?: string
}

const createPost = async (
  postData: CreatePostData
): Promise<CreatePostResponse> => {
  const { data } = await axios.post<CreatePostResponse>(
    config.backendUrl + "/post/create-post",
    postData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  return data
}

export const useCreatePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<CreatePostResponse, AxiosError, CreatePostData>({
    mutationFn: createPost,
    onSuccess: (data: CreatePostResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({ queryKey: ["post"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as CreatePostResponse)?.message ||
        "Create Post failed!"
      setMessage(message, "error")
    },
  })
}

interface DeletePostResponse {
  message: string
}

const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  const { data } = await axios.delete<DeletePostResponse>(
    config.backendUrl + `/post/delete-post/${postId}`,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  return data
}

export const useDeletePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<DeletePostResponse, AxiosError, string>({
    mutationFn: deletePost,
    onSuccess: (data: DeletePostResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({ queryKey: ["post"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as DeletePostResponse)?.message ||
        "Delete Post failed!"
      setMessage(message, "error")
    },
  })
}

interface EditPostResponse {
  message: string
}

interface EditPostData {
  text?: string
  img?: string
  video?: string
}

const editPost = async (
  postId: string,
  postData: EditPostData
): Promise<EditPostResponse> => {
  const { data } = await axios.patch<EditPostResponse>(
    config.backendUrl + `/post/edit-post/${postId}`,
    postData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  return data
}

export const useEditPost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    EditPostResponse,
    AxiosError,
    { postId: string; postData: EditPostData }
  >({
    mutationFn: ({ postId, postData }) => editPost(postId, postData),
    onSuccess: (data: EditPostResponse, variables) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({
        queryKey: ["is-bookmarked", variables.postId],
      })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({
        queryKey: ["reply-count", variables.postId],
      })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies", variables.postId] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
      queryClient.invalidateQueries({
        queryKey: ["is-liked", variables.postId],
      })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as EditPostResponse)?.message ||
        "Edit Post failed!"
      setMessage(message, "error")
    },
  })
}

interface LikeUnlikePostResponse {
  message: string
}

const likeUnlikePost = async (
  postId: string
): Promise<LikeUnlikePostResponse> => {
  const { data } = await axios.post<LikeUnlikePostResponse>(
    config.backendUrl + `/post/like-post/${postId}`,
    {},
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  return data
}

export const useLikeUnlikePost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<LikeUnlikePostResponse, AxiosError, string>({
    mutationFn: likeUnlikePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-liked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({ queryKey: ["reply-count", postId] })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies", postId] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as LikeUnlikePostResponse)?.message ||
        "Like/Unlike Post failed!"
      setMessage(message, "error")
    },
  })
}

interface IsLikedResponse {
  message: string
  liked: boolean
}

const isLiked = async (postId: string): Promise<IsLikedResponse> => {
  const { data } = await axios.get<IsLikedResponse>(
    config.backendUrl + `/post/is-liked/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useIsLiked = (postId: string) => {
  return useQuery<IsLikedResponse, AxiosError>({
    queryKey: ["is-liked", postId],
    queryFn: () => isLiked(postId),
  })
}

interface GetPostByIdResponse {
  message: string
  post: Post
}

const getPostById = async (postId: string): Promise<GetPostByIdResponse> => {
  const { data } = await axios.get<GetPostByIdResponse>(
    config.backendUrl + `/post/post/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useGetPostById = (postId: string) => {
  return useQuery<GetPostByIdResponse, AxiosError>({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId),
  })
}

interface CreateCommentData {
  text?: string
  img?: string
  video?: string
  user: string
}
interface CommentPostResponse {
  message: string
}

const commentPost = async (
  postId: string,
  commentData: CreateCommentData
): Promise<CommentPostResponse> => {
  const { data } = await axios.post<CommentPostResponse>(
    config.backendUrl + `/post/comment-post/${postId}`,
    commentData,
    { withCredentials: true }
  )
  return data
}

export const useCommentPost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    CommentPostResponse,
    AxiosError,
    { postId: string; commentData: CreateCommentData }
  >({
    mutationFn: ({ postId, commentData }) => commentPost(postId, commentData),
    onSuccess: (data: CommentPostResponse, { postId }) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({ queryKey: ["is-liked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({ queryKey: ["reply-count", postId] })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies", postId] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as CommentPostResponse)?.message ||
        "Comment Post failed!"
      setMessage(message, "error")
    },
  })
}

interface GetUserPostsResponse {
  message: string
  userPosts: Post[]
}

const getUserPosts = async (
  username: string
): Promise<GetUserPostsResponse> => {
  const { data } = await axios.get<GetUserPostsResponse>(
    config.backendUrl + `/post/user-posts/${username}`,
    { withCredentials: true }
  )
  return data
}

export const useGetUserPosts = (username: string) => {
  return useQuery<GetUserPostsResponse, AxiosError>({
    queryKey: ["user-posts", username],
    queryFn: () => getUserPosts(username),
  })
}

interface GetLikedPostsResponse {
  message: string
  likedPosts: Post[]
}

const getLikedPosts = async (
  username: string
): Promise<GetLikedPostsResponse> => {
  const { data } = await axios.get<GetLikedPostsResponse>(
    config.backendUrl + `/post/liked-posts/${username}`,
    { withCredentials: true }
  )
  return data
}

export const useGetLikedPosts = (username: string) => {
  return useQuery<GetLikedPostsResponse, AxiosError>({
    queryKey: ["liked-posts", username],
    queryFn: () => getLikedPosts(username),
  })
}

interface BookmarkPostResponse {
  message: string
}

const bookmarkPost = async (postId: string): Promise<BookmarkPostResponse> => {
  const { data } = await axios.post<BookmarkPostResponse>(
    config.backendUrl + `/post/bookmark-post/${postId}`,
    {},
    { withCredentials: true }
  )
  return data
}

export const useBookmarkPost = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<BookmarkPostResponse, AxiosError, string>({
    mutationFn: bookmarkPost,
    onSuccess: (data: BookmarkPostResponse, postId) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["is-liked", postId] })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({ queryKey: ["reply-count", postId] })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
      queryClient.invalidateQueries({ queryKey: ["replies", postId] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as BookmarkPostResponse)?.message ||
        "Bookmark Post failed!"
      setMessage(message, "error")
    },
  })
}

interface IsBookmarkedResponse {
  message: string
  isBookmarked: boolean
}

const isBookmarked = async (postId: string): Promise<IsBookmarkedResponse> => {
  const { data } = await axios.get<IsBookmarkedResponse>(
    config.backendUrl + `/post/is-bookmarked/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useIsBookmarked = (postId: string) => {
  return useQuery<IsBookmarkedResponse, AxiosError>({
    queryKey: ["is-bookmarked", postId],
    queryFn: () => isBookmarked(postId),
  })
}

interface GetBookmarkedPostsResponse {
  message: string
  posts: Post[]
}

const getBookmarkedPosts = async (): Promise<GetBookmarkedPostsResponse> => {
  const { data } = await axios.get<GetBookmarkedPostsResponse>(
    config.backendUrl + `/post/bookmarked-posts`,
    { withCredentials: true }
  )
  return data
}

export const useGetBookmarkedPosts = () => {
  return useQuery<GetBookmarkedPostsResponse, AxiosError>({
    queryKey: ["bookmarked-posts"],
    queryFn: () => getBookmarkedPosts(),
  })
}

export const useCreateReply = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    CreatePostResponse,
    AxiosError,
    { postData: CreatePostData; parentId: string }
  >({
    mutationFn: ({ postData, parentId }) => {
      return createPost({
        ...postData,
        parentId,
      })
    },
    onSuccess: (data: CreatePostResponse, variables) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", variables.parentId] })
      queryClient.invalidateQueries({
        queryKey: ["replies", variables.parentId],
      })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
      queryClient.invalidateQueries({ queryKey: ["user-posts"] })
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] })
      queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] })
      queryClient.invalidateQueries({
        queryKey: ["is-bookmarked", variables.parentId],
      })
      queryClient.invalidateQueries({ queryKey: ["is-bookmarked"] })
      queryClient.invalidateQueries({
        queryKey: ["is-liked", variables.parentId],
      })
      queryClient.invalidateQueries({ queryKey: ["is-liked"] })
      queryClient.invalidateQueries({
        queryKey: ["reply-count", variables.parentId],
      })
      queryClient.invalidateQueries({ queryKey: ["reply-count"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as CreatePostResponse)?.message ||
        "Failed to create reply!"
      setMessage(message, "error")
    },
  })
}

interface GetRepliesResponse {
  message: string
  replies: Post[]
}

const getReplies = async (postId: string): Promise<GetRepliesResponse> => {
  const { data } = await axios.get<GetRepliesResponse>(
    config.backendUrl + `/post/replies/${postId}`,
    { withCredentials: true }
  )
  return data
}

export const useGetReplies = (postId: string) => {
  return useQuery<GetRepliesResponse, AxiosError>({
    queryKey: ["replies", postId],
    queryFn: () => getReplies(postId),
    enabled: !!postId,
  })
}

// Add a function to get the number of replies for a post
interface GetReplyCountResponse {
  message: string
  count: number
}

const getReplyCount = async (
  postId: string
): Promise<GetReplyCountResponse> => {
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
    enabled: !!postId,
  })
}

interface GetParentThreadResponse {
  message: string
  thread: Post[]
}

const getParentThread = async (
  postId: string
): Promise<GetParentThreadResponse> => {
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
