"use client"
import { Notification } from "@/types/Notification"
import SafeImage from "@/components/media/SafeImage"
import { MdDeleteOutline } from "react-icons/md"
import { useDeleteNotification } from "@/hooks/useNotification"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const NotificationMessage = ({
  notification,
}: {
  notification: Notification
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "follow":
        return (
          <div className="absolute -right-1 -bottom-1 bg-indigo-500 p-1.5 rounded-full shadow-md shadow-indigo-500/30">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6" />
              <path d="M16 11h6" />
            </svg>
          </div>
        )
      case "like":
        return (
          <div className="absolute -right-1 -bottom-1 bg-red-500 p-1.5 rounded-full shadow-md shadow-indigo-500/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )
      case "repost":
        return (
          <div className="absolute -right-1 -bottom-1 bg-green-500 p-1.5 rounded-full shadow-md shadow-indigo-500/30">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
        )
      case "reply":
        return (
          <div className="absolute -right-1 -bottom-1 bg-blue-500 p-1.5 rounded-full shadow-md shadow-indigo-500/30">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getNotificationText = () => {
    switch (notification.type) {
      case "follow":
        return "followed you"
      case "like":
        return "liked your post"
      case "repost":
        return "reposted your post"
      case "reply":
        return "replied to your post"
      default:
        return ""
    }
  }

  const { mutate: deleteNotification, isPending } = useDeleteNotification()
  const handleDeleteNotification = () => {
    deleteNotification(notification._id)
  }
  const router = useRouter()
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

  return (
    <div
      className={`relative flex items-start px-4 sm:px-6 py-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer group overflow-hidden ${
        !notification.read ? "bg-indigo-500/5" : ""
      }`}
      onClick={() => {
        if (notification.type === "follow") {
          router.push(`/${notification.from.username}`)
        } else if (["like", "repost", "reply"].includes(notification.type)) {
          router.push(`/post/${notification.post?._id}`)
        }
      }}
    >
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
      )}

      <div
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/${notification?.from?.username}`)
        }}
        className="relative shrink-0 mr-3 sm:mr-4"
      >
        <SafeImage
          kind="avatar"
          src={notification?.from?.profileImg || "/img/pfp/default.webp"}
          alt={`${notification?.from?.fullName}'s profile picture`}
          width={48}
          height={48}
          className="rounded-xl size-[40px] sm:size-[48px] object-cover ring-2 ring-zinc-700/50"
        />
        {getNotificationIcon()}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-1">
          <span
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/${notification?.from?.username}`)
            }}
            className="font-bold hover:underline text-sm sm:text-base text-white"
          >
            {notification?.from?.fullName || "Deleted User"}
          </span>
          <span className="text-zinc-400 text-sm sm:text-base sm:ml-1">
            {getNotificationText()}
          </span>
          <span className="text-zinc-500 text-xs sm:text-sm sm:ml-2 whitespace-nowrap">
            • {formatDate(new Date(notification?.createdAt))}
          </span>
        </div>

        {notification?.post && (
          <div className="mt-1  text-zinc-400 text-sm line-clamp-2 max-w-full">
            {notification?.post?.text}
            {notification?.post?.img && (
              <span className="ml-1 text-zinc-400 text-xs">(Image)</span>
            )}
            {notification?.post?.video && (
              <span className="ml-1 text-zinc-400 text-xs">(Video)</span>
            )}
          </div>
        )}
      </div>

      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-zinc-800 rounded-xl cursor-pointer self-start ml-2 hover:text-red-400"
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteNotification()
        }}
        aria-label="Delete notification"
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <MdDeleteOutline size={18} />
        )}
      </button>
    </div>
  )
}

export default NotificationMessage
