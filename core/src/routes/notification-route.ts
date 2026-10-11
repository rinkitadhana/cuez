import express from "express"
import { protectRoute } from "../middlewares/ProtectRoute"
import {
  getNotifications,
  deleteNotification,
  getUnreadNotificationsCount,
} from "../controllers/notification-controller"
const router = express.Router()

router.get("/", protectRoute, getNotifications)
router.delete("/:id", protectRoute, deleteNotification)
router.get("/unread-count", protectRoute, getUnreadNotificationsCount)

export default router
