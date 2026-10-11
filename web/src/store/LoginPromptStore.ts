import { create } from "zustand"

export type LoginPromptReason =
  | "like"
  | "comment"
  | "repost"
  | "bookmark"
  | "follow"
  | "post"
  | "feed"
  | "message"
  | "page"

interface LoginPromptStore {
  open: boolean
  reason: LoginPromptReason
  show: (reason?: LoginPromptReason) => void
  close: () => void
}

const useLoginPromptStore = create<LoginPromptStore>((set) => ({
  open: false,
  reason: "page",
  show: (reason = "page") => set({ open: true, reason }),
  close: () => set({ open: false }),
}))

export default useLoginPromptStore
