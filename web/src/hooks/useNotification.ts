import useMessageStore from "@/store/messageStore"
import config from "../config/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { Notification } from "@/types/Notification"

interface GetNotificationsResponse {
  message: string
  notifications: Notification[]
}

const getNotifications = async (): Promise<GetNotificationsResponse> => {
  const response = await axios.get<GetNotificationsResponse>(
    `${config.backendUrl}/notification`,
    {
      withCredentials: true,
    }
  )
  return response.data
}

export const useGetNotifications = () => {
  return useQuery<GetNotificationsResponse, AxiosError>({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  })
}

interface DeleteAllNotificationsResponse {
  message: string
}

const deleteAllNotifications =
  async (): Promise<DeleteAllNotificationsResponse> => {
    const response = await axios.delete<DeleteAllNotificationsResponse>(
      `${config.backendUrl}/notification/delete-all`,
      {
        withCredentials: true,
      }
    )
    return response.data
  }

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<DeleteAllNotificationsResponse, AxiosError>({
    mutationFn: deleteAllNotifications,
    onSuccess: (data: DeleteAllNotificationsResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["unread-notifications-count"],
      })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as DeleteAllNotificationsResponse)?.message ||
        "Failed to delete all notifications!"
      setMessage(message, "error")
    },
  })
}

interface DeleteNotificationResponse {
  message: string
}

const deleteNotification = async (
  id: string
): Promise<DeleteNotificationResponse> => {
  const response = await axios.delete<DeleteNotificationResponse>(
    `${config.backendUrl}/notification/${id}`,
    {
      withCredentials: true,
    }
  )
  return response.data
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<DeleteNotificationResponse, AxiosError, string>({
    mutationFn: deleteNotification,
    onSuccess: (data: DeleteNotificationResponse) => {
      setMessage(data.message, "success")
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["unread-notifications-count"],
      })
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as DeleteNotificationResponse)?.message ||
        "Failed to delete notification!"
      setMessage(message, "error")
    },
  })
}

interface GetUnreadNotificationsCountResponse {
  message: string
  count: number
}

const getUnreadNotificationsCount =
  async (): Promise<GetUnreadNotificationsCountResponse> => {
    const response = await axios.get<GetUnreadNotificationsCountResponse>(
      `${config.backendUrl}/notification/unread-count`,
      {
        withCredentials: true,
      }
    )
    return response.data
  }

export const useGetUnreadNotificationsCount = () => {
  return useQuery<GetUnreadNotificationsCountResponse, AxiosError>({
    queryKey: ["unread-notifications-count"],
    queryFn: getUnreadNotificationsCount,
    refetchInterval: 45000,
  })
}
