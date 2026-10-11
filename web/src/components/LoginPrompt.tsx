"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import axios from "axios"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import useLoginPromptStore, {
  LoginPromptReason,
} from "@/store/LoginPromptStore"

const subtitles: Record<LoginPromptReason, string> = {
  like: "Log in to upvote posts you like.",
  comment: "Log in to reply and join the conversation.",
  repost: "Log in to repost and share with your followers.",
  bookmark: "Log in to save posts for later.",
  follow: "Log in to follow people and see their posts.",
  post: "Log in to share what you're building.",
  feed: "Log in to see posts from people you follow.",
  page: "Log in or create an account to continue.",
}

const LoginPrompt = () => {
  const { open, reason, show, close } = useLoginPromptStore()
  const queryClient = useQueryClient()

  // If any API call comes back 401 (e.g. the session expired mid-visit),
  // treat the user as a guest and ask them to log in again.
  useEffect(() => {
    const id = axios.interceptors.response.use(undefined, (error) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        !error.config?.url?.endsWith("/auth/me") &&
        !error.config?.url?.endsWith("/auth/login")
      ) {
        queryClient.setQueryData(["me"], null)
        show("page")
      }
      return Promise.reject(error)
    })
    return () => axios.interceptors.response.eject(id)
  }, [queryClient, show])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, close])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="login-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-[10000] px-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[360px] bg-bgClr border border-zinc-700 rounded-2xl p-6 flex flex-col items-center gap-5 text-center"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200"
            >
              <X className="size-4" />
            </button>
            <Image
              src="/img/icon/cuez-logo.png"
              alt="Cuez"
              width={44}
              height={44}
              className="size-11 mt-1"
            />
            <div className="flex flex-col gap-1">
              <h2 id="login-prompt-title" className="text-lg font-semibold">
                You need to log in first
              </h2>
              <p className="text-sm text-zinc-400">{subtitles[reason]}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Link
                href="/login"
                onClick={close}
                className="w-full py-2 rounded-xl bg-mainclr text-white text-sm font-semibold hover:bg-mainclr/85 transition-all duration-200"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={close}
                className="w-full py-2 rounded-xl border border-zinc-700 text-sm font-semibold hover:bg-zinc-800 transition-all duration-200"
              >
                Sign up
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginPrompt
