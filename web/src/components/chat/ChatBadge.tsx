"use client"
import { useChatUnreadCount } from "@/hooks/useChat"

// Unread-conversations count on the Chat nav icon.
const ChatBadge = () => {
  const { data } = useChatUnreadCount()
  const count = data?.count ?? 0
  if (count <= 0) return null
  return (
    <div className="absolute -top-2 -right-1.5 bg-mainclr text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
      <span className="text-[10px] font-bold">{count > 99 ? "99+" : count}</span>
    </div>
  )
}

export default ChatBadge
