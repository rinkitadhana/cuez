import { Response } from "express"
import mongoose from "mongoose"

export const errorHandler = (res: Response, error: any) => {
  // A malformed id in the URL (e.g. /post/abc) is a missing resource, not a
  // server failure.
  if (error instanceof mongoose.Error.CastError) {
    res.status(404).json({ message: "Not found!" })
    return
  }
  console.log("Server Error:", error)
  res.status(500).json({ message: "Server Error!" })
}
