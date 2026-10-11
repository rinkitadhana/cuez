"use client"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import config from "@/config/config"
import { getSocket } from "@/lib/socket"
import { getMe } from "@/lib/queryCache"
import {
  bumpConversation,
  chatKeys,
  patchConversation,
  upsertMessage,
} from "@/lib/chatCache"
import { useIsLoggedIn } from "@/hooks/useAuth"
import useChatStore from "@/store/ChatStore"
import { ChatMessage } from "@/types/Chat"

// Keeps the socket connected while logged in and applies server pushes to
// the React Query cache, so every chat screen updates live.
const ChatSocketBridge = () => {
  const queryClient = useQueryClient()
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn) return
    const socket = getSocket()

    const onMessage = ({
      conversationId,
      message,
      clientId,
    }: {
      conversationId: string
      message: ChatMessage
      clientId?: string
    }) => {
      const meId = getMe(queryClient)?._id
      const fromMe = message.sender === meId
      const { activeConversationId, setTyping } = useChatStore.getState()
      const isOpen =
        activeConversationId === conversationId &&
        document.visibilityState === "visible"

      upsertMessage(queryClient, conversationId, message, clientId)
      if (!fromMe) setTyping(conversationId, null)

      const bumped = bumpConversation(
        queryClient,
        conversationId,
        message,
        (c) => ({
          unreadCount: fromMe || isOpen ? c.unreadCount : c.unreadCount + 1,
        })
      )
      if (!bumped) queryClient.invalidateQueries({ queryKey: chatKeys.lists })

      if (!fromMe && isOpen) {
        // Reading it live: tell the sender right away.
        axios
          .post(
            `${config.backendUrl}/chat/conversations/${conversationId}/read`,
            {},
            { withCredentials: true }
          )
          .catch(() => {})
      } else if (!fromMe) {
        queryClient.invalidateQueries({ queryKey: chatKeys.unread })
      }
    }

    const onMessageUpdated = ({
      conversationId,
      message,
    }: {
      conversationId: string
      message: ChatMessage
    }) => {
      upsertMessage(queryClient, conversationId, message)
      patchConversation(queryClient, conversationId, (c) => ({
        ...c,
        lastMessage: c.lastMessage?._id === message._id ? message : c.lastMessage,
      }))
    }

    const onRead = ({
      conversationId,
      userId,
      at,
    }: {
      conversationId: string
      userId: string
      at: string
    }) => {
      const meId = getMe(queryClient)?._id
      if (userId === meId) {
        // Read in another tab/device.
        patchConversation(queryClient, conversationId, (c) => ({
          ...c,
          unreadCount: 0,
          myLastReadAt: at,
        }))
        queryClient.invalidateQueries({ queryKey: chatKeys.unread })
      } else {
        patchConversation(queryClient, conversationId, (c) => ({
          ...c,
          otherLastReadAt: at,
        }))
      }
    }

    const onTyping = ({ conversationId }: { conversationId: string }) =>
      useChatStore.getState().setTyping(conversationId, Date.now())

    // Catch up on anything missed while disconnected.
    const onReconnect = () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.all })

    socket.on("chat:message", onMessage)
    socket.on("chat:message-updated", onMessageUpdated)
    socket.on("chat:read", onRead)
    socket.on("chat:typing", onTyping)
    socket.io.on("reconnect", onReconnect)
    socket.connect()

    return () => {
      socket.off("chat:message", onMessage)
      socket.off("chat:message-updated", onMessageUpdated)
      socket.off("chat:read", onRead)
      socket.off("chat:typing", onTyping)
      socket.io.off("reconnect", onReconnect)
      socket.disconnect()
    }
  }, [isLoggedIn, queryClient])

  return null
}

export default ChatSocketBridge
