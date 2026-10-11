import { useGetMe } from "./useAuth"
import useLoginPromptStore, {
  LoginPromptReason,
} from "@/store/LoginPromptStore"

// Wraps actions that need a logged-in user. Guests get the login prompt instead.
export const useRequireAuth = () => {
  const { data: me } = useGetMe()
  const { show } = useLoginPromptStore()
  const isLoggedIn = !!me?.user

  const requireAuth = (reason: LoginPromptReason, action?: () => void) => {
    if (!isLoggedIn) {
      show(reason)
      return
    }
    action?.()
  }

  return { isLoggedIn, requireAuth }
}
