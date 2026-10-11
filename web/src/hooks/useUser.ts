import useMessageStore from "@/store/messageStore"
import config from "../config/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { User } from "@/types/User"
import { useIsLoggedIn } from "./useAuth"
import { useInfiniteList } from "./useInfiniteList"
import {
  Snapshot,
  getMe,
  postQueries,
  restore,
  snapshot,
  toggleId,
  updateMe,
  updatePosts,
} from "@/lib/queryCache"

interface SuggestedUsersResponse {
  message: string
  users: User[]
}

const getSuggestedUsers = async (): Promise<SuggestedUsersResponse> => {
  const response = await axios.get<SuggestedUsersResponse>(
    config.backendUrl + "/user/suggested",
    {
      withCredentials: true,
    }
  )
  return response.data
}

export const useGetSuggestedUsers = () => {
  const isLoggedIn = useIsLoggedIn()
  return useQuery<SuggestedUsersResponse, AxiosError>({
    queryKey: ["suggested-users"],
    queryFn: getSuggestedUsers,
    enabled: isLoggedIn,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

const followUnfollowUser = async (userId: string) => {
  const response = await axios.post<{ message: string }>(
    config.backendUrl + `/user/follow/${userId}`,
    {},
    { withCredentials: true }
  )
  return response.data
}

// Following state lives in me.followings; a target's follower list lives in
// their cached profile. Both flip instantly and roll back on failure.
export const useFollowUnfollowUser = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    { message: string },
    AxiosError,
    string,
    { snap?: Snapshot }
  >({
    mutationFn: followUnfollowUser,
    onMutate: async (userId) => {
      const me = getMe(queryClient)
      if (!me) return {}
      const snap = await snapshot(queryClient, [
        { queryKey: ["me"] },
        { queryKey: ["user-profile"] },
      ])
      const following = !me.followings.includes(userId)
      updateMe(queryClient, (user) => ({
        ...user,
        followings: toggleId(user.followings, userId, following),
      }))
      queryClient.setQueriesData<UserProfileResponse>(
        { queryKey: ["user-profile"] },
        (data) => {
          if (!data?.user) return data
          if (data.user._id === userId) {
            return {
              ...data,
              user: {
                ...data.user,
                followers: toggleId(data.user.followers, me._id, following),
              },
            }
          }
          if (data.user._id === me._id) {
            return {
              ...data,
              user: {
                ...data.user,
                followings: toggleId(data.user.followings, userId, following),
              },
            }
          }
          return data
        }
      )
      return { snap }
    },
    onError: (error, _, context) => {
      restore(queryClient, context?.snap)
      const message =
        (error.response?.data as { message?: string })?.message ||
        "Failed to follow user"
      setMessage(message, "error")
    },
    onSettled: () => {
      // Lists that depend on who you follow; refreshed when next opened.
      for (const queryKey of [
        ["followers"],
        ["followings"],
        ["posts", "Following"],
      ]) {
        queryClient.invalidateQueries({ queryKey, refetchType: "none" })
      }
    },
  })
}

interface UserProfileResponse {
  message: string
  user: User
}

const getUserProfile = async (
  username: string
): Promise<UserProfileResponse> => {
  const response = await axios.get<UserProfileResponse>(
    config.backendUrl + `/user/profile/${username}`,
    { withCredentials: true }
  )
  return response.data
}

export const useGetUserProfile = (username: string) => {
  return useQuery<UserProfileResponse, AxiosError>({
    queryKey: ["user-profile", username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
  })
}

interface UpdateUserProfileResponse {
  message: string
}

interface UpdateUserProfileData {
  fullName?: string
  username?: string
  currentPassword?: string
  newPassword?: string
  bio?: string
  link?: string
  location?: string
  profileImg?: string
  coverImg?: string
}

const updateUserProfile = async (
  profileData: UpdateUserProfileData
): Promise<UpdateUserProfileResponse> => {
  const response = await axios.patch<UpdateUserProfileResponse>(
    config.backendUrl + `/user/update-profile`,
    profileData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  return response.data
}

// Fields shown on the profile and on your posts. Username and password
// changes wait for the server since it validates them.
const VISIBLE_PROFILE_FIELDS = [
  "fullName",
  "bio",
  "link",
  "location",
  "profileImg",
  "coverImg",
] as const

export const useUpdateUserProfile = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    UpdateUserProfileResponse,
    AxiosError,
    UpdateUserProfileData,
    { snap?: Snapshot }
  >({
    mutationFn: updateUserProfile,
    onMutate: async (profileData) => {
      const me = getMe(queryClient)
      if (!me || profileData.username || profileData.newPassword) return {}
      const changes: Partial<User> = {}
      for (const field of VISIBLE_PROFILE_FIELDS) {
        // Empty image fields mean "unchanged".
        const value = profileData[field]
        if (value !== undefined && (value || !field.endsWith("Img"))) {
          changes[field] = value
        }
      }
      const snap = await snapshot(queryClient, [
        { queryKey: ["me"] },
        { queryKey: ["user-profile", me.username] },
        postQueries,
      ])
      updateMe(queryClient, (user) => ({ ...user, ...changes }))
      queryClient.setQueryData<UserProfileResponse>(
        ["user-profile", me.username],
        (data) => data && { ...data, user: { ...data.user, ...changes } }
      )
      updatePosts(queryClient, (post) =>
        post.user?._id === me._id
          ? { ...post, user: { ...post.user, ...changes } }
          : post
      )
      return { snap }
    },
    onSuccess: (data: UpdateUserProfileResponse) => {
      setMessage(data.message, "success")
    },
    onError: (error: AxiosError, _, context) => {
      restore(queryClient, context?.snap)
      const message =
        (error.response?.data as UpdateUserProfileResponse)?.message ||
        "Failed to update profile"
      setMessage(message, "error")
    },
    onSettled: () => {
      // Pick up uploaded image URLs (and username changes).
      queryClient.invalidateQueries({ queryKey: ["me"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
  })
}

export const useGetFollowers = (username: string, enabled = true) => {
  return useInfiniteList<User, "followers">({
    queryKey: ["followers", username],
    path: `/user/followers/${username}`,
    itemsKey: "followers",
    enabled: enabled && !!username,
  })
}

export const useGetFollowing = (username: string, enabled = true) => {
  return useInfiniteList<User, "followings">({
    queryKey: ["followings", username],
    path: `/user/followings/${username}`,
    itemsKey: "followings",
    enabled: enabled && !!username,
  })
}
