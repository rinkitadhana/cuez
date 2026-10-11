import { create } from "zustand"

interface LoginPromptStore {
  open: boolean
  setOpen: (open: boolean) => void
}

const useLoginPromptStore = create<LoginPromptStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

export default useLoginPromptStore
