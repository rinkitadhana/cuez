import express from "express"
import { protectRoute } from "../middlewares/ProtectRoute"
import {
  acceptConversation,
  clearConversation,
  getConversation,
  getConversations,
  getMessages,
  getUnreadCount,
  markRead,
  reactToMessage,
  sendMessage,
  startConversation,
  unsendMessage,
} from "../controllers/chat-controller"
const router = express.Router()

router.use(protectRoute)
router.get("/conversations", getConversations)
router.post("/conversations", startConversation)
router.get("/unread", getUnreadCount)
router.get("/conversations/:id", getConversation)
router.delete("/conversations/:id", clearConversation)
router.get("/conversations/:id/messages", getMessages)
router.post("/conversations/:id/messages", sendMessage)
router.post("/conversations/:id/read", markRead)
router.post("/conversations/:id/accept", acceptConversation)
router.delete("/messages/:id", unsendMessage)
router.post("/messages/:id/react", reactToMessage)

export default router
