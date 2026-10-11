import { Request, Response } from "express"
import { errorHandler } from "../utils/errorHandler"
import Notification from "../models/notification-model"
import { getPagination, paginate } from "../utils/pagination"

const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id.toString()
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const notifications = await Notification.find({ to: userId, ...cursorFilter })
      .populate({
        path: "from",
        select: "-password -email -bookmarks",
      })
      .populate("post", "text img video")
      .sort(sort)
      .limit(limit + 1)
    // Opening the notifications page (first page) marks everything as read.
    if (!req.query.cursor) {
      await Notification.updateMany({ to: userId }, { $set: { read: true } })
    }
    const { page, nextCursor } = paginate(notifications, limit)
    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications: page,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const deleteAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user._id.toString()
    await Notification.deleteMany({ to: userId })
    res.status(200).json({ message: "All notifications deleted successfully!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notificationId = req.params.id
    await Notification.findByIdAndDelete(notificationId)
    res.status(200).json({ message: "Notification deleted successfully!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getUnreadNotificationsCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user._id.toString()
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }
    const count = await Notification.countDocuments({ to: userId, read: false })
    res.status(200).json({
      message: "Unread notifications count fetched successfully",
      count,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

export {
  getNotifications,
  deleteNotification,
  deleteAllNotifications,
  getUnreadNotificationsCount,
}
