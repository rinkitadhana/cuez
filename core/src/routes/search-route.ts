import express from "express"
import { searchPosts, searchUsers } from "../controllers/search-controller"
const router = express.Router()

router.get("/posts", searchPosts)
router.get("/users", searchUsers)

export default router
