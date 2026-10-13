import type { NextFunction, Request, Response } from "express"
import { Router } from "express"
import { ensureDB } from "../config/database"
import { auditLog, requireAdminKey } from "./auth"
import { feedbackAdminRoutes } from "./feedback"
import { postsAdminRoutes } from "./posts"
import { statsAdminRoutes } from "./stats"
import { usersAdminRoutes } from "./users"

/**
 * Admin API, mounted at /admin/v1. Authenticated by a static server-to-server
 * key (see auth.ts); consumed only by the admin dashboard backend.
 */
export const adminRoutes = Router()

adminRoutes.use(auditLog)
adminRoutes.use(requireAdminKey)
// After auth, so unauthenticated traffic can't wake the database.
adminRoutes.use(ensureDB)
adminRoutes.use((_req, res, next) => {
  res.set("Cache-Control", "no-store")
  next()
})
adminRoutes.use(statsAdminRoutes)
adminRoutes.use(usersAdminRoutes)
adminRoutes.use(postsAdminRoutes)
adminRoutes.use(feedbackAdminRoutes)

adminRoutes.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

// Last-resort handler: turn a rejected handler into a JSON 500 instead of a crash.
adminRoutes.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.log("[admin] error:", err)
  res.status(500).json({ error: "Server error" })
})
