import { createHash, timingSafeEqual } from "node:crypto"
import type { NextFunction, Request, Response } from "express"

const MIN_KEY_LENGTH = 32
const MAX_FAILED_PER_MINUTE = 10

const sha256 = (value: string) =>
  createHash("sha256").update(value, "utf8").digest()

const configuredKeyDigest = () => {
  const key = (process.env.ADMIN_API_KEY || "").trim()
  return key.length < MIN_KEY_LENGTH ? null : sha256(key)
}

const bearerToken = (req: Request) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ")
  return scheme?.toLowerCase() === "bearer" && token ? token : null
}

const clientIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] || req.ip || "")
    .split(",")[0]
    .trim()

// Failed-attempt counters per IP, in memory (the API runs as one long-lived process).
const failures = new Map<string, { count: number; resetAt: number }>()

const tooManyFailures = (ip: string) => {
  const now = Date.now()
  const entry = failures.get(ip)
  if (!entry || entry.resetAt < now) {
    failures.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > MAX_FAILED_PER_MINUTE
}

/**
 * Guards the whole /admin/v1 API with one static secret sent as
 * `Authorization: Bearer <ADMIN_API_KEY>`. Server-to-server only (the admin
 * dashboard backend): never expose the key to a browser.
 *
 * Fails closed: if ADMIN_API_KEY is unset or shorter than 32 chars the admin
 * API is disabled. Digests are compared in constant time, and repeated
 * failures from one IP are rate limited.
 */
export const requireAdminKey = (req: Request, res: Response, next: NextFunction) => {
  const expected = configuredKeyDigest()
  if (!expected) {
    res.status(503).json({ error: "Admin API is not configured" })
    return
  }
  const token = bearerToken(req)
  if (token && timingSafeEqual(sha256(token), expected)) {
    next()
    return
  }
  if (tooManyFailures(clientIp(req))) {
    res.status(429).json({ error: "Too many failed attempts" })
    return
  }
  res.status(401).json({ error: "Unauthorized" })
}

/** Logs every admin request (method, path, status, ip): never the body or key. */
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  const started = Date.now()
  res.on("finish", () => {
    console.log(
      `[admin] ${req.method} ${req.originalUrl.split("?")[0]} -> ${res.statusCode} (${Date.now() - started}ms) ip=${clientIp(req)}`
    )
  })
  next()
}
