"use client"
import { useState } from "react"
import Link from "next/link"
import { Loader2, MailPlus, Search, X } from "lucide-react"
import SafeImage from "@/components/media/SafeImage"
import CuezBadge from "@/components/pageComponents/CuezBadge"
import LoadMore from "@/components/LoadMore"
import MenuButton from "@/layout/MenuButton"
import NewMessageModal from "./NewMessageModal"
import { useChatSearch, useConversations } from "@/hooks/useChat"
import { useDebounce } from "@/hooks/useDebounce"
import Highlight from "./Highlight"
import { useGetMe } from "@/hooks/useAuth"
import { formatListTime } from "@/lib/chatTime"
import { ChatMessage, Conversation } from "@/types/Chat"
import useChatStore from "@/store/ChatStore"

const preview = (conversation: Conversation, meId?: string) => {
  const last = conversation.lastMessage
  if (!last) return ""
  const prefix = last.sender === meId ? "You: " : ""
  if (last.deleted) return `${prefix}Message deleted`
  if (last.text) return prefix + last.text
  if (last.img) return `${prefix}Sent a photo`
  return ""
}

const ConversationRow = ({
  conversation,
  active,
  meId,
}: {
  conversation: Conversation
  active: boolean
  meId?: string
}) => {
  const user = conversation.otherUser
  const unread = conversation.unreadCount > 0
  const isTyping = useChatStore((s) => !!s.typingAt[conversation._id])
  return (
    <Link
      href={`/chat/${conversation._id}`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        active
          ? "bg-zinc-800/70 border-r-2 border-mainclr"
          : "hover:bg-zinc-900"
      }`}
    >
      <SafeImage
        kind="avatar"
        src={user?.profileImg}
        alt={user?.username || "Deleted user"}
        width={44}
        height={44}
        className="size-11 rounded-xl object-cover bg-white shrink-0"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-semibold text-sm truncate">
            {user?.fullName || user?.username || "Deleted user"}
          </span>
          {user?.cuezBadge && <CuezBadge />}
          <span className="text-xs text-zinc-500 truncate">
            @{user?.username || "deleted"}
          </span>
          <span className="text-xs text-zinc-500 shrink-0 ml-auto pl-2">
            {formatListTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate flex-1 ${
              isTyping
                ? "text-mainclr"
                : unread
                ? "text-zinc-100 font-semibold"
                : "text-zinc-400"
            }`}
          >
            {isTyping ? "typing…" : preview(conversation, meId)}
          </p>
          {unread && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-mainclr text-white text-[11px] font-bold flex items-center justify-center">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

const MessageResult = ({
  message,
  otherUser,
  query,
  meId,
}: {
  message: ChatMessage
  otherUser: Conversation["otherUser"]
  query: string
  meId?: string
}) => (
  <Link
    href={`/chat/${message.conversation}?m=${message._id}`}
    className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors"
  >
    <SafeImage
      kind="avatar"
      src={otherUser?.profileImg}
      alt={otherUser?.username || "Deleted user"}
      width={40}
      height={40}
      className="size-10 rounded-xl object-cover bg-white shrink-0"
    />
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-center gap-1 min-w-0">
        <span className="font-semibold text-sm truncate">
          {otherUser?.fullName || otherUser?.username || "Deleted user"}
        </span>
        <span className="text-xs text-zinc-500 truncate">
          @{otherUser?.username || "deleted"}
        </span>
        <span className="text-xs text-zinc-500 shrink-0 ml-auto pl-2">
          {formatListTime(message.createdAt)}
        </span>
      </div>
      <p className="text-sm text-zinc-400 line-clamp-2 break-words">
        {message.sender === meId && <span className="text-zinc-500">You: </span>}
        <Highlight text={message.text || ""} query={query} />
      </p>
    </div>
  </Link>
)

const SearchResults = ({
  query,
  activeId,
  meId,
}: {
  query: string
  activeId: string | null
  meId?: string
}) => {
  const search = useChatSearch(query)
  if (search.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    )
  }
  if (search.people.length === 0 && search.messages.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-8 py-12">
        <h2 className="text-xl font-bold break-words">
          No results for &ldquo;{query}&rdquo;
        </h2>
        <p className="text-sm text-zinc-400">
          Try searching for a name, username or a word from a message.
        </p>
      </div>
    )
  }
  return (
    <>
      {search.people.length > 0 && (
        <>
          <h3 className="px-4 pt-4 pb-1 text-sm font-bold">People</h3>
          {search.people.map((conversation) => (
            <ConversationRow
              key={conversation._id}
              conversation={conversation}
              active={conversation._id === activeId}
              meId={meId}
            />
          ))}
        </>
      )}
      {search.messages.length > 0 && (
        <>
          <h3 className="px-4 pt-4 pb-1 text-sm font-bold">Messages</h3>
          {search.messages.map(({ message, otherUser }) => (
            <MessageResult
              key={message._id}
              message={message}
              otherUser={otherUser}
              query={query}
              meId={meId}
            />
          ))}
          <LoadMore
            hasNextPage={search.hasNextPage}
            isFetchingNextPage={search.isFetchingNextPage}
            fetchNextPage={search.fetchNextPage}
          />
        </>
      )}
    </>
  )
}

const ConversationList = ({ activeId }: { activeId: string | null }) => {
  const [tab, setTab] = useState<"inbox" | "requests">("inbox")
  const [isNewOpen, setIsNewOpen] = useState(false)
  const search = useChatStore((s) => s.search)
  const setSearch = useChatStore((s) => s.setSearch)
  const query = useDebounce(search.trim(), 250)
  const { data: me } = useGetMe()
  const inbox = useConversations("inbox")
  const requests = useConversations("requests")
  const list = tab === "inbox" ? inbox : requests
  const requestCount = requests.items.length

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-zinc-700">
        <div className="flex items-center justify-between gap-3 px-4 h-[60px]">
          <div className="flex items-center gap-3">
            <MenuButton />
            <h1 className="font-semibold text-lg">Messages</h1>
          </div>
          <button
            onClick={() => setIsNewOpen(true)}
            aria-label="New message"
            title="New message"
            className="p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <MailPlus className="size-5" />
          </button>
        </div>
        <div className="relative px-4 pb-3">
          <Search className="absolute left-7 top-1/2 -translate-y-[calc(50%+6px)] size-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search Direct Messages"
            aria-label="Search Direct Messages"
            className="w-full pl-9 pr-9 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:border-mainclr transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-6 top-1/2 -translate-y-[calc(50%+6px)] p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className={`flex ${query ? "hidden" : ""}`}>
          {(["inbox", "requests"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors hover:bg-zinc-900 ${
                tab === id ? "text-white" : "text-zinc-400"
              }`}
            >
              <span
                className={`relative pb-2 inline-flex items-center gap-1.5 ${
                  tab === id
                    ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-full after:bg-mainclr"
                    : ""
                }`}
              >
                {id === "inbox" ? "Inbox" : "Requests"}
                {id === "requests" && requestCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-zinc-700 text-[11px] flex items-center justify-center">
                    {requestCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {query ? (
          <SearchResults query={query} activeId={activeId} meId={me?.user._id} />
        ) : list.isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="size-11 rounded-xl bg-zinc-800" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-3 w-1/2 rounded bg-zinc-800" />
                  <div className="h-3 w-3/4 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : list.items.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-8 py-12">
            {tab === "inbox" ? (
              <>
                <h2 className="text-2xl font-bold">Welcome to your inbox!</h2>
                <p className="text-sm text-zinc-400">
                  Drop a line, share posts and more with private conversations
                  between you and others on Cuez.
                </p>
                <button
                  onClick={() => setIsNewOpen(true)}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/85 transition-colors"
                >
                  Write a message
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">No message requests</h2>
                <p className="text-sm text-zinc-400">
                  Messages from people you don&apos;t follow show up here until
                  you accept them.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {list.items.map((conversation) => (
              <ConversationRow
                key={conversation._id}
                conversation={conversation}
                active={conversation._id === activeId}
                meId={me?.user._id}
              />
            ))}
            <LoadMore
              hasNextPage={list.hasNextPage}
              isFetchingNextPage={list.isFetchingNextPage}
              fetchNextPage={list.fetchNextPage}
            />
          </>
        )}
      </div>

      <NewMessageModal open={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </div>
  )
}

export default ConversationList
