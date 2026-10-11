import { io, Socket } from "socket.io-client"
import config from "@/config/config"

let socket: Socket | null = null

// One shared connection to the API server (same jwt cookie as REST).
export const getSocket = () => {
  if (!socket) {
    socket = io(new URL(config.backendUrl).origin, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket", "polling"],
    })
  }
  return socket
}
