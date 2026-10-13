import express from "express"
import http from "http"
import dotenv from "dotenv"
import connectDB, { ensureDB } from "./config/database"
import authRoute from "./routes/auth-route"
import userRoute from "./routes/user-route"
import postRoute from "./routes/post-route"
import notificationRoute from "./routes/notification-route"
import feedbackRoute from "./routes/feedback-route"
import searchRoute from "./routes/search-route"
import chatRoute from "./routes/chat-route"
import { adminRoutes } from "./admin"
import { initSocket } from "./socket"

import cookieParser from "cookie-parser"
import cors from "cors"
dotenv.config()

//define
const app = express()
const PORT = process.env.PORT || 8080

//middlewares
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
)

//database
connectDB()

//base route
app.get("/", (req, res) => {
  res.send("Hello China!")
})

//routes
app.use("/api", ensureDB)
app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)
app.use("/api/post", postRoute)
app.use("/api/notification", notificationRoute)
app.use("/api/feedback", feedbackRoute)
app.use("/api/search", searchRoute)
app.use("/api/chat", chatRoute)
app.use("/admin/v1", adminRoutes)

//Listening
const server = http.createServer(app)
initSocket(server)
server.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`)
})
