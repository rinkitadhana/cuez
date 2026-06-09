import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import User from "../models/user-model"
import { JWT_SECRET } from "../config/env"

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.jwt
    if (!token) {
      res.status(401).json({ message: "Not authorized, no token" })
      return
    }
    const decode = jwt.verify(token, JWT_SECRET) as { userId: string }
    if (!decode) {
      res.status(401).json({ message: "Not authorized, invalid token" })
      return
    }
    const user = await User.findById(decode.userId).select("-password")
    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" })
      return
    }
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" })
      return
    }

    console.error("Authentication error:", error)
    res.status(500).json({ message: "Server error during authentication" })
    return
  }
}
