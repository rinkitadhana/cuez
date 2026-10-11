import http from "http"
import jwt from "jsonwebtoken"
import { Server } from "socket.io"
import { JWT_SECRET } from "./config/env"
import { ensureDBFor } from "./config/database"
import Conversation from "./models/conversation-model"

let io: Server | null = null

const readCookie = (header: string | undefined, name: string) =>
  header
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1]

// Real-time layer for chat. Every socket joins a room for its user, so the
// REST handlers can push to "everyone signed in as X" (all their tabs).
export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  })

  // Same httpOnly jwt cookie as the REST API.
  io.use((socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, "jwt")
      if (!token) return next(new Error("Unauthorized"))
      const { userId } = jwt.verify(token, JWT_SECRET) as { userId: string }
      socket.data.userId = userId
      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId
    socket.join(`user:${userId}`)

    // conversationId -> the other participant, checked once per socket.
    const peers = new Map<string, string | null>()

    socket.on("chat:typing", async (payload: { conversationId?: string }) => {
      const conversationId = payload?.conversationId
      if (typeof conversationId !== "string") return
      if (!peers.has(conversationId)) {
        try {
          const conversation = await ensureDBFor(() =>
            Conversation.findOne({
              _id: conversationId,
              participants: userId,
            }).select("participants")
          )
          const other = conversation?.participants
            .map(String)
            .find((id) => id !== userId)
          peers.set(conversationId, other ?? null)
        } catch {
          return
        }
      }
      const other = peers.get(conversationId)
      if (other) {
        io?.to(`user:${other}`).emit("chat:typing", { conversationId, userId })
      }
    })
  })
}

export const emitToUsers = (
  userIds: (string | { toString(): string })[],
  event: string,
  payload: unknown
) => {
  if (!io) return
  io.to(userIds.map((id) => `user:${String(id)}`)).emit(event, payload)
}
