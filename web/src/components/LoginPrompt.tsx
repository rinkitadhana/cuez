"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import axios from "axios"
import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import useLoginPromptStore from "@/store/LoginPromptStore"

const LoginPrompt = () => {
  const { open, setOpen } = useLoginPromptStore()
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
        setOpen(true)
      }
      return Promise.reject(error)
    })
    return () => axios.interceptors.response.eject(id)
  }, [queryClient, setOpen])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 bg-bgClr/50 backdrop-blur-sm flex justify-center items-center z-[10000] px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-bgClr border border-zinc-700 w-full max-w-[400px] rounded-xl p-6 flex flex-col items-center gap-4 text-center"
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-zinc-700 transition-all duration-200"
        >
          <X className="size-5" />
        </button>
        <Image
          src="/img/icon/cuez-logo.png"
          alt="Cuez Logo"
          width={48}
          height={48}
          className="size-12"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">You need to log in first</h2>
          <p className="text-sm text-zinc-400">
            Join Cuez to like, comment, save posts and follow people.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="w-full py-2 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/80 transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="w-full py-2 rounded-xl border border-zinc-700 font-semibold hover:bg-zinc-800 transition-all duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt
