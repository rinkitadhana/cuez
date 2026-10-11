import { InfiniteData, Query, QueryClient } from "@tanstack/react-query"
import { Post } from "@/types/Post"
import { User } from "@/types/User"

// Helpers for optimistic updates: patch every cached copy of a post or user
// in place, and snapshot/restore the cache if the server rejects the change.

export const OPTIMISTIC_PREFIX = "optimistic-"
export const isOptimisticId = (id?: string) =>
  !!id?.startsWith(OPTIMISTIC_PREFIX)

// Queries whose data can contain posts (lists, single post, threads).
const POST_QUERY_KEYS = [
  "posts",
  "user-posts",
  "liked-posts",
  "bookmarked-posts",
  "replies",
  "post",
  "parent-thread",
  "search-posts",
  "user-replies",
]
export const postQueries = {
  predicate: (query: Query) =>
    POST_QUERY_KEYS.includes(query.queryKey[0] as string),
}

const isPost = (value: unknown): value is Post =>
  !!value &&
  typeof value === "object" &&
  "_id" in value &&
  "likes" in value &&
  "user" in value

// Walks any cached response shape (infinite pages, { post }, { thread }) and
// applies fn to each post. Returning null from fn drops the post from lists.
const mapPosts = (value: unknown, fn: (post: Post) => Post | null): unknown => {
  if (isPost(value)) return withParent(fn(value) ?? value, fn)
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (isPost(item)) {
        const next = fn(item)
        return next ? [withParent(next, fn)] : []
      }
      return [mapPosts(item, fn)]
    })
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, mapPosts(v, fn)])
    )
  }
  return value
}

// Replies on a profile carry the post they answer; keep it in sync too
// (a deleted parent becomes null).
const withParent = (post: Post, fn: (post: Post) => Post | null): Post =>
  post.parentPost ? { ...post, parentPost: fn(post.parentPost) } : post

export const updatePosts = (
  queryClient: QueryClient,
  fn: (post: Post) => Post | null
) =>
  queryClient.setQueriesData(postQueries, (data: unknown) =>
    data === undefined ? data : mapPosts(data, fn)
  )

export const updatePost = (
  queryClient: QueryClient,
  postId: string,
  fn: (post: Post) => Post | null
) => updatePosts(queryClient, (post) => (post._id === postId ? fn(post) : post))

export const findPost = (queryClient: QueryClient, postId: string) => {
  let found: Post | undefined
  for (const [, data] of queryClient.getQueriesData(postQueries)) {
    mapPosts(data, (post) => {
      if (post._id === postId) found = post
      return post
    })
    if (found) return found
  }
}

// Adds an item to the top of the first page of a cached infinite list.
export const prependToList = <T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  itemsKey: string,
  item: T
) =>
  queryClient.setQueryData<InfiniteData<Record<string, unknown>>>(
    queryKey,
    (data) => {
      if (!data) return data
      const [first, ...rest] = data.pages
      return {
        ...data,
        pages: [
          { ...first, [itemsKey]: [item, ...((first?.[itemsKey] as T[]) ?? [])] },
          ...rest,
        ],
      }
    }
  )

export const toggleId = (ids: string[] = [], id: string, on: boolean) =>
  on ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((x) => x !== id)

interface MeData {
  message: string
  user: User
}

export const getMe = (queryClient: QueryClient) =>
  queryClient.getQueryData<MeData | null>(["me"])?.user

export const updateMe = (queryClient: QueryClient, fn: (user: User) => User) =>
  queryClient.setQueryData<MeData | null>(["me"], (data) =>
    data?.user ? { ...data, user: fn(data.user) } : data
  )

// Cancels in-flight fetches (so they can't overwrite the optimistic state)
// and returns everything needed to roll back.
export const snapshot = async (
  queryClient: QueryClient,
  filters: Parameters<QueryClient["getQueriesData"]>[0][]
) => {
  await Promise.all(filters.map((f) => queryClient.cancelQueries(f)))
  return filters.flatMap((f) => queryClient.getQueriesData(f))
}

export type Snapshot = Awaited<ReturnType<typeof snapshot>>

export const restore = (queryClient: QueryClient, snap?: Snapshot) =>
  snap?.forEach(([key, data]) => queryClient.setQueryData(key, data))
