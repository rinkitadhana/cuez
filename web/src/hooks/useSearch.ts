import config from "../config/config"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Post } from "@/types/Post"
import { User } from "@/types/User"
import { useInfiniteList } from "./useInfiniteList"

export const useSearchPosts = (q: string, enabled = true) =>
  useInfiniteList<Post, "posts">({
    queryKey: ["search-posts", q],
    path: "/search/posts",
    itemsKey: "posts",
    params: { q },
    enabled: enabled && !!q,
  })

export const useSearchUsers = (q: string, enabled = true) =>
  useInfiniteList<User, "users">({
    queryKey: ["search-users", q],
    path: "/search/users",
    itemsKey: "users",
    params: { q },
    enabled: enabled && !!q,
  })

// Small, single-page lookup for the search box dropdown.
export const useSearchUsersPreview = (q: string) =>
  useQuery({
    queryKey: ["search-users-preview", q],
    queryFn: async () => {
      const { data } = await axios.get<{ users: User[] }>(
        config.backendUrl + "/search/users",
        { params: { q, limit: 5 } }
      )
      return data.users
    },
    enabled: !!q,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
