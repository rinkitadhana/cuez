import { optionalAuth } from "../middlewares/ProtectRoute"
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  sendOTP,
  verifyOTP,
} from "../controllers/auth-controller"
import express from "express"
const router = express.Router()

router.post("/send-otp", sendOTP)
router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/forgot-password/verify-otp", verifyOTP)
router.post("/forgot-password/reset", resetPassword)
router.get("/me", optionalAuth, getMe)
export default router
