import mongoose from "mongoose"
import { Request, Response, NextFunction } from "express"

// Close the connection after this long with no requests so the server can sleep
const IDLE_TIMEOUT_MS = 5 * 60 * 1000

let connectPromise: Promise<typeof mongoose> | null = null
let disconnectPromise: Promise<void> | null = null
let idleTimer: NodeJS.Timeout | null = null
let activeRequests = 0

const openConnection = async () => {
  const URI = process.env.MONGO_URI
  if (!URI) {
    throw new Error("MONGO_URI environment variable is not defined")
  }
  if (disconnectPromise) await disconnectPromise
  if (!connectPromise) {
    connectPromise = mongoose.connect(URI).then((m) => {
      console.log("MongoDB Connected!")
      return m
    })
    connectPromise.catch(() => {
      connectPromise = null
    })
  }
  return connectPromise
}

const closeConnection = () => {
  if (!connectPromise || activeRequests > 0) return
  connectPromise = null
  disconnectPromise = mongoose
    .disconnect()
    .then(() => console.log("MongoDB Disconnected (idle)"))
    .catch((error) => console.log("MongoDB Disconnect Error: ", error))
    .finally(() => {
      disconnectPromise = null
    })
}

const scheduleIdleClose = () => {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(closeConnection, IDLE_TIMEOUT_MS)
}

// Tracks in-flight work so the idle timer only starts once everything is done.
const beginActivity = () => {
  activeRequests++
  if (idleTimer) clearTimeout(idleTimer)
  let done = false
  return () => {
    if (done) return
    done = true
    activeRequests--
    if (activeRequests === 0) scheduleIdleClose()
  }
}

// Opens the connection on demand and closes it after a period of inactivity
export const ensureDB = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const finish = beginActivity()
  res.on("finish", finish)
  res.on("close", finish)

  try {
    await openConnection()
    next()
  } catch (error) {
    console.log("MongoDB Error: ", error)
    res.status(503).json({ message: "Database unavailable" })
  }
}

// Same as ensureDB, for work outside an HTTP request (e.g. socket events).
export const ensureDBFor = async <T>(work: () => Promise<T>): Promise<T> => {
  const finish = beginActivity()
  try {
    await openConnection()
    return await work()
  } finally {
    finish()
  }
}

const connectDB = async () => {
  try {
    await openConnection()
    scheduleIdleClose()
  } catch (error) {
    console.log("MongoDB Error: ", error)
    process.exit(1)
  }
}
export default connectDB
