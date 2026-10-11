import { create } from "zustand"

const TYPING_TIMEOUT_MS = 4000

interface ChatStore {
  // Conversation currently open on screen (marks incoming messages read).
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
  // conversationId -> when the other person last sent a typing ping.
  // Entries clear themselves after a few seconds without a new ping.
  typingAt: Record<string, number>
  setTyping: (conversationId: string, at: number | null) => void
  // DM search text; kept here so it survives opening a result.
  search: string
  setSearch: (search: string) => void
}

const useChatStore = create<ChatStore>((set, get) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  search: "",
  setSearch: (search) => set({ search }),
  typingAt: {},
  setTyping: (conversationId, at) => {
    set((state) => {
      const typingAt = { ...state.typingAt }
      if (at === null) delete typingAt[conversationId]
      else typingAt[conversationId] = at
      return { typingAt }
    })
    if (at !== null) {
      setTimeout(() => {
        if (get().typingAt[conversationId] === at) {
          get().setTyping(conversationId, null)
        }
      }, TYPING_TIMEOUT_MS)
    }
  },
}))

export default useChatStore
