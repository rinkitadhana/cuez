import { InfiniteData, QueryClient } from "@tanstack/react-query"
import { ChatMessage, Conversation } from "@/types/Chat"

// Cache helpers shared by chat mutations (optimistic updates) and the socket
// bridge (server pushes), so both paths edit the cache the same way.

export type MessagePages = InfiniteData<{
  messages: ChatMessage[]
  nextCursor?: string | null
}>
export type ConversationPages = InfiniteData<{
  conversations: Conversation[]
  nextCursor?: string | null
}>

export const chatKeys = {
  all: ["chat"] as const,
  lists: ["chat", "conversations"] as const,
  list: (filter: "inbox" | "requests") =>
    ["chat", "conversations", filter] as const,
  unread: ["chat", "unread"] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
}

// Inserts a message (newest first), or replaces it if already present by id
// or by the clientId of its optimistic placeholder.
export const upsertMessage = (
  queryClient: QueryClient,
  conversationId: string,
  message: ChatMessage,
  clientId?: string
) =>
  queryClient.setQueryData<MessagePages>(
    chatKeys.messages(conversationId),
    (data) => {
      if (!data) return data
      let found = false
      const pages = data.pages.map((page) => ({
        ...page,
        messages: page.messages.map((m) => {
          if (m._id === message._id || (clientId && m._id === clientId)) {
            found = true
            return message
          }
          return m
        }),
      }))
      if (!found && pages[0]) {
        pages[0] = { ...pages[0], messages: [message, ...pages[0].messages] }
      }
      return { ...data, pages }
    }
  )

export const updateMessage = (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  fn: (message: ChatMessage) => ChatMessage | null
) =>
  queryClient.setQueryData<MessagePages>(
    chatKeys.messages(conversationId),
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          messages: page.messages.flatMap((m) => {
            if (m._id !== messageId) return [m]
            const next = fn(m)
            return next ? [next] : []
          }),
        })),
      }
  )

export const findMessage = (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string
) =>
  queryClient
    .getQueryData<MessagePages>(chatKeys.messages(conversationId))
    ?.pages.flatMap((p) => p.messages)
    .find((m) => m._id === messageId)

// Patches a conversation everywhere it's cached (lists and detail).
export const patchConversation = (
  queryClient: QueryClient,
  conversationId: string,
  fn: (conversation: Conversation) => Conversation
) => {
  queryClient.setQueriesData<ConversationPages>(
    { queryKey: chatKeys.lists },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((c) =>
            c._id === conversationId ? fn(c) : c
          ),
        })),
      }
  )
  queryClient.setQueryData<{ conversation: Conversation }>(
    chatKeys.conversation(conversationId),
    (data) => data && { ...data, conversation: fn(data.conversation) }
  )
}

// Sets the conversation's latest message and moves it to the top of its list.
// Returns false if it isn't in any loaded list (caller should refetch).
export const bumpConversation = (
  queryClient: QueryClient,
  conversationId: string,
  message: ChatMessage,
  extra: (conversation: Conversation) => Partial<Conversation> = () => ({})
) => {
  let found = false
  queryClient.setQueriesData<ConversationPages>(
    { queryKey: chatKeys.lists },
    (data) => {
      if (!data) return data
      const current = data.pages
        .flatMap((p) => p.conversations)
        .find((c) => c._id === conversationId)
      if (!current) return data
      found = true
      const updated: Conversation = {
        ...current,
        lastMessage: message,
        lastMessageAt: message.createdAt,
        ...extra(current),
      }
      const pages = data.pages.map((page) => ({
        ...page,
        conversations: page.conversations.filter(
          (c) => c._id !== conversationId
        ),
      }))
      pages[0] = {
        ...pages[0],
        conversations: [updated, ...pages[0].conversations],
      }
      return { ...data, pages }
    }
  )
  queryClient.setQueryData<{ conversation: Conversation }>(
    chatKeys.conversation(conversationId),
    (data) =>
      data && {
        ...data,
        conversation: {
          ...data.conversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          ...extra(data.conversation),
        },
      }
  )
  return found
}

export const removeConversation = (
  queryClient: QueryClient,
  conversationId: string
) => {
  queryClient.setQueriesData<ConversationPages>(
    { queryKey: chatKeys.lists },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          conversations: page.conversations.filter(
            (c) => c._id !== conversationId
          ),
        })),
      }
  )
  queryClient.removeQueries({ queryKey: chatKeys.messages(conversationId) })
}
