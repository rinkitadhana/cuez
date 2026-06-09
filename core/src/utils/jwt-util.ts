import { Response } from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/env"

const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d"

const generateJWT = (res: Response, userId: string) => {
  // Parse expiry first to validate it
  let expiryInSeconds: number
  if (JWT_EXPIRY.endsWith("d")) {
    expiryInSeconds = parseInt(JWT_EXPIRY.slice(0, -1)) * 24 * 60 * 60
  } else if (JWT_EXPIRY.endsWith("h")) {
    expiryInSeconds = parseInt(JWT_EXPIRY.slice(0, -1)) * 60 * 60
  } else if (JWT_EXPIRY.endsWith("m")) {
    expiryInSeconds = parseInt(JWT_EXPIRY.slice(0, -1)) * 60
  } else {
    expiryInSeconds = parseInt(JWT_EXPIRY)
  }

  if (isNaN(expiryInSeconds)) {
    throw new Error("Invalid JWT_EXPIRY value")
  }

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: expiryInSeconds })

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: expiryInSeconds * 1000,
    path: "/",
  })
}

const clearJWT = (res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    expires: new Date(0),
    path: "/",
  })
}

export { generateJWT, clearJWT }
