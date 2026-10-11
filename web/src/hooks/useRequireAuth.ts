import { useGetMe } from "./useAuth"
import useLoginPromptStore from "@/store/LoginPromptStore"

// Wraps actions that need a logged-in user. Guests get the login prompt instead.
export const useRequireAuth = () => {
  const { data: me } = useGetMe()
  const { setOpen } = useLoginPromptStore()
  const isLoggedIn = !!me?.user

  const requireAuth = (action?: () => void) => {
    if (!isLoggedIn) {
      setOpen(true)
      return
    }
    action?.()
  }

  return { isLoggedIn, requireAuth }
}
