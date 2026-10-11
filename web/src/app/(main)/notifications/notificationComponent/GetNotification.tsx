"use client"
import { useGetNotifications } from "@/hooks/useNotification"
import NotificationMessage from "./NotificationMessage"
import Notification from "@/components/skeletons/Notification"
import NoNotification from "./NoNotification"
import { AlertCircle } from "lucide-react"
import LoadMore from "@/components/LoadMore"

const GetNotification = () => {
  const {
    items,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetNotifications()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col divide-y divide-zinc-800">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <Notification key={i} />)
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
          <AlertCircle className="w-8 h-8 mb-3 text-indigo-500" />
          <p className="text-base">Failed to load notifications</p>
          <p className="text-sm text-zinc-500 mt-1">Please try again later</p>
        </div>
      ) : items.length === 0 ? (
        <NoNotification />
      ) : (
        <>
          {items.map((notification) => (
            <NotificationMessage
              key={notification._id}
              notification={notification}
            />
          ))}
          <LoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </>
      )}
    </div>
  )
}

export default GetNotification
