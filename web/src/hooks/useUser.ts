import useMessageStore from "@/store/messageStore"
import config from "../config/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { User } from "@/types/User"
import { useIsLoggedIn } from "./useAuth"
import { useInfiniteList } from "./useInfiniteList"

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

interface FollowUnfollowUserResponse {
  message: string
}

const followUnfollowUser = async (
  userId: string
): Promise<FollowUnfollowUserResponse> => {
  const response = await axios.post<FollowUnfollowUserResponse>(
    config.backendUrl + `/user/follow/${userId}`,
    {},
    {
      withCredentials: true,
    }
  )
  return response.data
}

export const useFollowUnfollowUser = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<FollowUnfollowUserResponse, AxiosError, string>({
    mutationFn: followUnfollowUser,
    onSuccess: (data: FollowUnfollowUserResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["me"] })
      queryClient.invalidateQueries({ queryKey: ["is-following"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["followers"] })
      queryClient.invalidateQueries({ queryKey: ["followings"] })
      queryClient.invalidateQueries({ queryKey: ["follows-you"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as FollowUnfollowUserResponse)?.message ||
        "Failed to follow user"
      setMessage(message, "error")
    },
  })
}

interface IsFollowingResponse {
  message: string
  isFollowing: boolean
}

const isFollowing = async (userId: string): Promise<IsFollowingResponse> => {
  const response = await axios.get<IsFollowingResponse>(
    config.backendUrl + `/user/is-following/${userId}`,
    { withCredentials: true }
  )
  return response.data
}

export const useIsFollowing = (userId: string) => {
  const isLoggedIn = useIsLoggedIn()
  return useQuery<IsFollowingResponse, AxiosError>({
    queryKey: ["is-following", userId],
    queryFn: () => isFollowing(userId),
    enabled: isLoggedIn && !!userId,
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

export const useUpdateUserProfile = () => {
  const { setMessage } = useMessageStore()
  const queryClient = useQueryClient()
  return useMutation<
    UpdateUserProfileResponse,
    AxiosError,
    UpdateUserProfileData
  >({
    mutationFn: updateUserProfile,
    onSuccess: (data: UpdateUserProfileResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["me"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as UpdateUserProfileResponse)?.message ||
        "Failed to update profile"
      setMessage(message, "error")
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

interface GetFollowsYouResponse {
  message: string
  followsYou: boolean
}

const getFollowsYou = async (
  userId: string
): Promise<GetFollowsYouResponse> => {
  const response = await axios.get<GetFollowsYouResponse>(
    config.backendUrl + `/user/follows-you/${userId}`,
    { withCredentials: true }
  )
  return response.data
}

export const useGetFollowsYou = (userId: string) => {
  const isLoggedIn = useIsLoggedIn()
  return useQuery<GetFollowsYouResponse, AxiosError>({
    queryKey: ["follows-you", userId],
    queryFn: () => getFollowsYou(userId),
    enabled: isLoggedIn && !!userId,
  })
}
