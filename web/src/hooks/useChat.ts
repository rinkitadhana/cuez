import config from "../config/config"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import useMessageStore from "@/store/messageStore"
import { ChatMessage, Conversation } from "@/types/Chat"
import { useInfiniteList } from "./useInfiniteList"
import { useIsLoggedIn } from "./useAuth"
import { getMe } from "@/lib/queryCache"
import {
  bumpConversation,
  chatKeys,
  findMessage,
  patchConversation,
  removeConversation,
  updateMessage,
  upsertMessage,
} from "@/lib/chatCache"

const api = (path: string) => config.backendUrl + "/chat" + path
const withCredentials = { withCredentials: true }

const errorMessage = (error: AxiosError, fallback: string) =>
  (error.response?.data as { message?: string })?.message || fallback

export const useConversations = (filter: "inbox" | "requests") =>
  useInfiniteList<Conversation, "conversations">({
    queryKey: [...chatKeys.list(filter)],
    path: "/chat/conversations",
    itemsKey: "conversations",
    params: { filter },
  })

export interface ChatSearchPage {
  people: Conversation[]
  messages: { message: ChatMessage; otherUser: Conversation["otherUser"] }[]
  nextCursor?: string | null
}

// People (first page only) and matching messages across my conversations.
export const useChatSearch = (q: string) => {
  const query = useInfiniteQuery<ChatSearchPage, AxiosError>({
    queryKey: ["chat", "search", q],
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get<ChatSearchPage>(api("/search"), {
        params: { q, limit: 20, cursor: pageParam ?? undefined },
        ...withCredentials,
      })
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: !!q,
  })
  return {
    ...query,
    people: query.data?.pages[0]?.people ?? [],
    messages: query.data?.pages.flatMap((p) => p.messages) ?? [],
  }
}

export const useChatUnreadCount = () => {
  const isLoggedIn = useIsLoggedIn()
  return useQuery({
    queryKey: chatKeys.unread,
    queryFn: async () => {
      const { data } = await axios.get<{ count: number }>(
        api("/unread"),
        withCredentials
      )
      return data
    },
    enabled: isLoggedIn,
  })
}

export const useConversation = (id: string) =>
  useQuery({
    queryKey: chatKeys.conversation(id),
    queryFn: async () => {
      const { data } = await axios.get<{ conversation: Conversation }>(
        api(`/conversations/${id}`),
        withCredentials
      )
      return data
    },
    enabled: !!id,
  })

export const useMessages = (id: string) =>
  useInfiniteList<ChatMessage, "messages">({
    queryKey: [...chatKeys.messages(id)],
    path: `/chat/conversations/${id}/messages`,
    itemsKey: "messages",
    enabled: !!id,
  })

export const useStartConversation = () => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<Conversation, AxiosError, string>({
    mutationFn: async (userId) => {
      const { data } = await axios.post<{ conversation: Conversation }>(
        api("/conversations"),
        { userId },
        withCredentials
      )
      return data.conversation
    },
    onSuccess: (conversation) => {
      queryClient.setQueryData(chatKeys.conversation(conversation._id), {
        conversation,
      })
    },
    onError: (error) =>
      setMessage(errorMessage(error, "Couldn't start the chat"), "error"),
  })
}

export interface SendMessageInput {
  clientId: string
  text?: string
  img?: string
  replyTo?: ChatMessage["replyTo"]
}

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient()
  return useMutation<ChatMessage, AxiosError, SendMessageInput>({
    mutationFn: async ({ clientId, text, img, replyTo }) => {
      const { data } = await axios.post<{ data: ChatMessage }>(
        api(`/conversations/${conversationId}/messages`),
        { clientId, text, img, replyTo: replyTo?._id },
        withCredentials
      )
      return data.data
    },
    // Show the message immediately; the server copy replaces it by clientId.
    onMutate: ({ clientId, text, img, replyTo }) => {
      const me = getMe(queryClient)
      if (!me) return
      const optimistic: ChatMessage = {
        _id: clientId,
        clientId,
        conversation: conversationId,
        sender: me._id,
        text,
        img,
        replyTo: replyTo
          ? {
              _id: replyTo._id,
              sender: replyTo.sender,
              text: replyTo.text,
              img: replyTo.img,
              deleted: replyTo.deleted,
            }
          : null,
        reactions: [],
        deleted: false,
        createdAt: new Date().toISOString(),
        status: "sending",
      }
      // Re-sending a failed message reuses its clientId and slot.
      upsertMessage(queryClient, conversationId, optimistic, clientId)
      if (!bumpConversation(queryClient, conversationId, optimistic)) {
        queryClient.invalidateQueries({ queryKey: chatKeys.lists })
      }
    },
    onSuccess: (message, { clientId }) => {
      upsertMessage(queryClient, conversationId, message, clientId)
      patchConversation(queryClient, conversationId, (c) => ({
        ...c,
        isRequest: false,
        lastMessage:
          c.lastMessage?._id === clientId ? message : c.lastMessage,
      }))
    },
    onError: (_, { clientId }) => {
      updateMessage(queryClient, conversationId, clientId, (m) => ({
        ...m,
        status: "failed",
      }))
    },
  })
}

export const useMarkRead = (conversationId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      axios.post(api(`/conversations/${conversationId}/read`), {}, withCredentials),
    onMutate: () => {
      patchConversation(queryClient, conversationId, (c) => ({
        ...c,
        unreadCount: 0,
        myLastReadAt: new Date().toISOString(),
      }))
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.unread }),
  })
}

export const useReactToMessage = (conversationId: string) => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<
    unknown,
    AxiosError,
    { messageId: string; emoji: string },
    { before?: ChatMessage }
  >({
    mutationFn: ({ messageId, emoji }) =>
      axios.post(api(`/messages/${messageId}/react`), { emoji }, withCredentials),
    onMutate: ({ messageId, emoji }) => {
      const me = getMe(queryClient)
      const before = findMessage(queryClient, conversationId, messageId)
      if (!me || !before) return {}
      const mine = before.reactions.find((r) => r.user === me._id)
      const others = before.reactions.filter((r) => r.user !== me._id)
      updateMessage(queryClient, conversationId, messageId, (m) => ({
        ...m,
        reactions:
          mine?.emoji === emoji ? others : [...others, { user: me._id, emoji }],
      }))
      return { before }
    },
    onError: (error, { messageId }, context) => {
      if (context?.before) {
        updateMessage(queryClient, conversationId, messageId, () => context.before!)
      }
      setMessage(errorMessage(error, "Couldn't react"), "error")
    },
  })
}

export const useUnsendMessage = (conversationId: string) => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<unknown, AxiosError, string, { before?: ChatMessage }>({
    mutationFn: (messageId) =>
      axios.delete(api(`/messages/${messageId}`), withCredentials),
    onMutate: (messageId) => {
      const before = findMessage(queryClient, conversationId, messageId)
      updateMessage(queryClient, conversationId, messageId, (m) => ({
        ...m,
        deleted: true,
        text: undefined,
        img: undefined,
        reactions: [],
      }))
      return { before }
    },
    onError: (error, messageId, context) => {
      if (context?.before) {
        updateMessage(queryClient, conversationId, messageId, () => context.before!)
      }
      setMessage(errorMessage(error, "Couldn't unsend message"), "error")
    },
  })
}

// Removes a failed optimistic message (e.g. before retrying or discarding).
export const useDiscardMessage = (conversationId: string) => {
  const queryClient = useQueryClient()
  return (messageId: string) =>
    updateMessage(queryClient, conversationId, messageId, () => null)
}

export const useAcceptRequest = (conversationId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      axios.post(api(`/conversations/${conversationId}/accept`), {}, withCredentials),
    onMutate: () =>
      patchConversation(queryClient, conversationId, (c) => ({
        ...c,
        isRequest: false,
      })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chatKeys.lists }),
  })
}

export const useDeleteConversation = () => {
  const queryClient = useQueryClient()
  const { setMessage } = useMessageStore()
  return useMutation<unknown, AxiosError, string>({
    mutationFn: (conversationId) =>
      axios.delete(api(`/conversations/${conversationId}`), withCredentials),
    onMutate: (conversationId) => removeConversation(queryClient, conversationId),
    onSuccess: () => setMessage("Conversation deleted", "success"),
    onError: (error) => {
      setMessage(errorMessage(error, "Couldn't delete conversation"), "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists })
      queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    },
  })
}
