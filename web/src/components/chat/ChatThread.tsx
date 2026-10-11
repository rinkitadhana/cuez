"use client"
import { Fragment, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import SafeImage from "@/components/media/SafeImage"
import CuezBadge from "@/components/pageComponents/CuezBadge"
import LoadMore from "@/components/LoadMore"
import MessageBubble from "./MessageBubble"
import Composer from "./Composer"
import {
  useAcceptRequest,
  useConversation,
  useDeleteConversation,
  useDiscardMessage,
  useMarkRead,
  useMessages,
  useReactToMessage,
  useSendMessage,
  useUnsendMessage,
  SendMessageInput,
} from "@/hooks/useChat"
import { useGetMe } from "@/hooks/useAuth"
import useChatStore from "@/store/ChatStore"
import { formatDayLabel, isSameDay } from "@/lib/chatTime"
import { ChatMessage } from "@/types/Chat"

const GROUP_GAP_MS = 2 * 60 * 1000

const sameGroup = (a?: ChatMessage, b?: ChatMessage) =>
  !!a &&
  !!b &&
  a.sender === b.sender &&
  isSameDay(a.createdAt, b.createdAt) &&
  Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) <
    GROUP_GAP_MS

const TypingBubble = () => (
  <div className="flex items-start mt-3">
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
)

const ChatThread = ({ conversationId }: { conversationId: string }) => {
  const router = useRouter()
  const { data: me } = useGetMe()
  const meId = me?.user._id
  const { data, isLoading: isConversationLoading, isError } =
    useConversation(conversationId)
  const conversation = data?.conversation
  const other = conversation?.otherUser
  const otherName = other?.fullName || other?.username || "Deleted user"
  const messages = useMessages(conversationId)
  const { mutate: sendMessage } = useSendMessage(conversationId)
  const { mutate: markRead } = useMarkRead(conversationId)
  const { mutate: react } = useReactToMessage(conversationId)
  const { mutate: unsend } = useUnsendMessage(conversationId)
  const { mutate: accept } = useAcceptRequest(conversationId)
  const { mutate: deleteConversation } = useDeleteConversation()
  const discard = useDiscardMessage(conversationId)
  const isTyping = useChatStore((s) => !!s.typingAt[conversationId])
  const setActiveConversationId = useChatStore(
    (s) => s.setActiveConversationId
  )
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mark this conversation as on-screen so live messages count as read.
  useEffect(() => {
    setActiveConversationId(conversationId)
    setReplyTo(null)
    return () => setActiveConversationId(null)
  }, [conversationId, setActiveConversationId])

  // Clear unread when opened, and again when returning to the tab.
  const unread = conversation?.unreadCount ?? 0
  useEffect(() => {
    if (unread > 0 && document.visibilityState === "visible") markRead()
    const onVisible = () => {
      if (document.visibilityState === "visible" && unread > 0) markRead()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [unread, markRead])

  // Jump to the newest message whenever I send one.
  const newestId = messages.items[0]?._id
  const newestMine = messages.items[0]?.sender === meId
  useEffect(() => {
    if (newestMine) scrollRef.current?.scrollTo({ top: 0 })
  }, [newestId, newestMine])

  const send = (input: Omit<SendMessageInput, "clientId">) =>
    sendMessage({
      ...input,
      clientId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })

  const retry = (message: ChatMessage) =>
    sendMessage({
      clientId: message._id,
      text: message.text,
      img: message.img,
      replyTo: message.replyTo,
    })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center">
        <h2 className="text-xl font-semibold">Conversation not found</h2>
        <p className="text-sm text-zinc-400">
          It may have been deleted, or you don&apos;t have access to it.
        </p>
        <Link href="/chat" className="mt-2 text-mainclr hover:underline">
          Back to messages
        </Link>
      </div>
    )
  }

  // My newest delivered message gets "Seen" once the other person has read it.
  const myLatest = messages.items.find((m) => m.sender === meId && !m.status)
  const seen =
    !!myLatest &&
    !!conversation?.otherLastReadAt &&
    new Date(conversation.otherLastReadAt) >= new Date(myLatest.createdAt)

  const footerFor = (message: ChatMessage, index: number) => {
    if (message.status === "sending") return "Sending…"
    if (message.status === "failed") {
      return (
        <span className="text-red-400">
          Failed to send ·{" "}
          <button onClick={() => retry(message)} className="underline hover:text-red-300">
            Retry
          </button>{" "}
          ·{" "}
          <button onClick={() => discard(message._id)} className="underline hover:text-red-300">
            Delete
          </button>
        </span>
      )
    }
    if (index === 0 && message._id === myLatest?._id) {
      return seen ? "Seen" : "Sent"
    }
    return undefined
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 h-[60px] border-b border-zinc-700 shrink-0">
        <button
          onClick={() => router.push("/chat")}
          aria-label="Back"
          className="md:hidden p-2 rounded-xl hover:bg-zinc-800"
        >
          <ArrowLeft className="size-5" />
        </button>
        {isConversationLoading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="size-9 rounded-xl bg-zinc-800" />
            <div className="h-3 w-28 rounded bg-zinc-800" />
          </div>
        ) : (
          <Link
            href={other ? `/${other.username}` : "#"}
            className="flex items-center gap-2.5 min-w-0 group/head"
          >
            <SafeImage
              kind="avatar"
              src={other?.profileImg}
              alt={otherName}
              width={36}
              height={36}
              className="size-9 rounded-xl object-cover bg-white shrink-0"
            />
            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-semibold truncate group-hover/head:underline">
                  {otherName}
                </span>
                {other?.cuezBadge && <CuezBadge />}
              </div>
              <span className="text-xs text-zinc-400 truncate">
                {isTyping ? (
                  <span className="text-mainclr">typing…</span>
                ) : (
                  `@${other?.username || "deleted"}`
                )}
              </span>
            </div>
          </Link>
        )}
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Conversation options"
            className="p-2 rounded-xl hover:bg-zinc-800"
          >
            <MoreHorizontal className="size-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl shadow-black/40">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDelete(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 className="size-4" /> Delete conversation
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages: column-reverse keeps the view pinned to the newest message
          and lets older pages load in above without jumping. */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse px-4 pb-3 scrollbar-hide"
      >
        {isTyping && <TypingBubble />}
        {messages.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          messages.items.map((message, i) => {
            const newer = messages.items[i - 1]
            const older = messages.items[i + 1]
            const showDay = !older || !isSameDay(older.createdAt, message.createdAt)
            return (
              <Fragment key={message.clientId || message._id}>
                <MessageBubble
                  message={message}
                  isMine={message.sender === meId}
                  isFirstInGroup={!sameGroup(older, message)}
                  isLastInGroup={!sameGroup(message, newer)}
                  otherName={otherName}
                  meId={meId}
                  footer={footerFor(message, i)}
                  onReply={() => setReplyTo(message)}
                  onReact={(emoji) => react({ messageId: message._id, emoji })}
                  onUnsend={() => unsend(message._id)}
                />
                {showDay && (
                  <div className="flex items-center gap-3 my-4 text-xs text-zinc-500">
                    <div className="h-px flex-1 bg-zinc-800" />
                    {formatDayLabel(message.createdAt)}
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>
                )}
              </Fragment>
            )
          })
        )}
        <LoadMore
          hasNextPage={messages.hasNextPage}
          isFetchingNextPage={messages.isFetchingNextPage}
          fetchNextPage={messages.fetchNextPage}
        />
        {/* Profile card at the very start of the conversation, like X. */}
        {!messages.isLoading && !messages.hasNextPage && other && (
          <Link
            href={`/${other.username}`}
            className="flex flex-col items-center text-center gap-1 py-8 mb-2 border-b border-zinc-800 hover:bg-zinc-900/50 rounded-xl transition-colors"
          >
            <SafeImage
              kind="avatar"
              src={other.profileImg}
              alt={otherName}
              width={64}
              height={64}
              className="size-16 rounded-2xl object-cover bg-white mb-2"
            />
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">{otherName}</span>
              {other.cuezBadge && <CuezBadge />}
            </div>
            <span className="text-sm text-zinc-400">@{other.username}</span>
            <span className="mt-2 text-sm text-mainclr">View profile</span>
          </Link>
        )}
      </div>

      {conversation?.isRequest && (
        <div className="shrink-0 border-t border-zinc-700 px-4 py-3 flex flex-col gap-2">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold">{otherName}</span> wants to message
            you. Accept to move this chat to your inbox.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => accept()}
              className="flex-1 py-2 rounded-xl bg-mainclr text-white text-sm font-semibold hover:bg-mainclr/85"
            >
              Accept
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 py-2 rounded-xl border border-zinc-700 text-sm font-semibold text-red-400 hover:bg-zinc-800"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <Composer
        conversationId={conversationId}
        replyTo={replyTo}
        replyToName={replyTo?.sender === meId ? "yourself" : otherName}
        onCancelReply={() => setReplyTo(null)}
        onSend={send}
      />

      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(false)}
          className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-2xl border border-zinc-700 bg-bgClr p-6 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Delete conversation?</h2>
              <p className="text-sm text-zinc-400">
                This removes it from your inbox. {otherName} will still be able
                to see it.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  deleteConversation(conversationId)
                  router.push("/chat")
                }}
                className="w-full py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full py-2 rounded-xl border border-zinc-700 text-sm font-semibold hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatThread
