import express from "express"
import { protectRoute } from "../middlewares/ProtectRoute"
import {
  createPost,
  deletePost,
  getAllPosts,
  getLikedPosts,
  getUserReplies,
  likeUnlikePost,
  repostPost,
  getFollowingPosts,
  getUserPosts,
  editPost,
  isLiked,
  getPostById,
  getTrendingPosts,
  bookmarkPost,
  getBookmarkedPosts,
  isBookmarked,
  getReplies,
  getReplyCount,
  getParentThread,
} from "../controllers/post-controller"
const router = express.Router()

router.post("/create-post", protectRoute, createPost)
router.patch("/edit-post/:id", protectRoute, editPost)
router.delete("/delete-post/:id", protectRoute, deletePost)
router.post("/like-post/:id", protectRoute, likeUnlikePost)
router.post("/repost-post/:id", protectRoute, repostPost)
router.get("/is-liked/:id", protectRoute, isLiked)
router.get("/all-posts", getAllPosts)
router.get("/following-posts", protectRoute, getFollowingPosts)
router.get("/trending-posts", getTrendingPosts)
router.get("/liked-posts/:username", getLikedPosts)
router.get("/user-replies/:username", getUserReplies)
router.get("/user-posts/:username", getUserPosts)
router.post("/bookmark-post/:id", protectRoute, bookmarkPost)
router.get("/is-bookmarked/:id", protectRoute, isBookmarked)
router.get("/bookmarked-posts", protectRoute, getBookmarkedPosts)
router.get("/replies/:postId", getReplies)
router.get("/reply-count/:postId", getReplyCount)
router.get("/parent-thread/:postId", getParentThread)

router.get("/post/:id", getPostById)
export default router
