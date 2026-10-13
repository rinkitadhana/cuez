import { createFeedback } from "../controllers/feedback-controllers"
import express from "express"
import { protectRoute } from "../middlewares/ProtectRoute"
const router = express.Router()

router.post("/create-feedback", protectRoute, createFeedback)

export default router
