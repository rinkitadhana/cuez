export interface ChatUser {
  _id: string
  fullName?: string
  username: string
  profileImg?: string
  cuezBadge?: boolean
}

export interface ChatMessage {
  _id: string
  conversation: string
  sender: string
  text?: string
  img?: string
  replyTo: {
    _id: string
    sender: string
    text?: string
    img?: string
    deleted: boolean
  } | null
  reactions: { user: string; emoji: string }[]
  deleted: boolean
  createdAt: string
  // Client-only state for optimistic sends.
  status?: "sending" | "failed"
  clientId?: string
}

export interface Conversation {
  _id: string
  otherUser: ChatUser | null
  lastMessage: ChatMessage | null
  lastMessageAt: string | null
  unreadCount: number
  isRequest: boolean
  myLastReadAt: string | null
  otherLastReadAt: string | null
}
