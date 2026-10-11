import useMessageStore from "@/store/messageStore"
import config from "../config/config"
import {
  InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { Notification } from "@/types/Notification"
import { useIsLoggedIn } from "./useAuth"
import { useInfiniteList } from "./useInfiniteList"
import { Snapshot, restore, snapshot } from "@/lib/queryCache"

type NotificationPages = InfiniteData<{
  notifications: Notification[]
  nextCursor?: string | null
}>

const notificationQueries = [
  { queryKey: ["notifications"] },
  { queryKey: ["unread-notifications-count"] },
]

export const useGetNotifications = () => {
  return useInfiniteList<Notification, "notifications">({
    queryKey: ["notifications"],
    path: "/notification",
    itemsKey: "notifications",
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
  return useMutation<
    DeleteNotificationResponse,
    AxiosError,
    string,
    { snap?: Snapshot }
  >({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      const snap = await snapshot(queryClient, notificationQueries)
      queryClient.setQueryData<NotificationPages>(
        ["notifications"],
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              notifications: page.notifications.filter((n) => n._id !== id),
            })),
          }
      )
      return { snap }
    },
    onError: (error: AxiosError, _, context) => {
      restore(queryClient, context?.snap)
      const message =
        (error.response?.data as DeleteNotificationResponse)?.message ||
        "Failed to delete notification!"
      setMessage(message, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["unread-notifications-count"],
      })
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
  const isLoggedIn = useIsLoggedIn()
  return useQuery<GetUnreadNotificationsCountResponse, AxiosError>({
    queryKey: ["unread-notifications-count"],
    queryFn: getUnreadNotificationsCount,
    enabled: isLoggedIn,
    refetchInterval: 45000,
  })
}
