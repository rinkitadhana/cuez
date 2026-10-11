"use client"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"
import SafeImage from "@/components/media/SafeImage"
import CuezBadge from "@/components/pageComponents/CuezBadge"
import { useDebounce } from "@/hooks/useDebounce"
import { useSearchUsersPreview } from "@/hooks/useSearch"
import { useGetSuggestedUsers } from "@/hooks/useUser"
import { useStartConversation } from "@/hooks/useChat"
import { useGetMe } from "@/hooks/useAuth"
import { User } from "@/types/User"

// "New message": pick someone (search, or suggestions) to open a chat with.
const NewMessageModal = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const q = useDebounce(query.trim(), 200)
  const { data: me } = useGetMe()
  const { data: results, isFetching } = useSearchUsersPreview(q)
  const { data: suggested } = useGetSuggestedUsers()
  const { mutate: startConversation, isPending, variables } =
    useStartConversation()

  if (!open || typeof document === "undefined") return null

  const users = (q ? results : suggested?.users)?.filter(
    (u) => u._id !== me?.user._id
  )

  const pick = (user: User) =>
    startConversation(user._id, {
      onSuccess: (conversation) => {
        onClose()
        setQuery("")
        router.push(`/chat/${conversation._id}`)
      },
    })

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-black/60 flex justify-center items-start sm:pt-[10vh]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-auto sm:max-h-[70vh] sm:max-w-[480px] bg-bgClr sm:border border-zinc-700 sm:rounded-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="size-5" />
          </button>
          <h2 className="font-semibold">New message</h2>
        </div>
        <div className="relative px-4 py-3 border-b border-zinc-800 shrink-0">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-mainclr"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {!q && !!users?.length && (
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-zinc-400">
              Suggested
            </p>
          )}
          {q && isFetching && !results && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-zinc-400" />
            </div>
          )}
          {users?.map((user) => (
            <button
              key={user._id}
              onClick={() => pick(user)}
              disabled={isPending}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900 transition-colors disabled:opacity-60"
            >
              <SafeImage
                kind="avatar"
                src={user.profileImg}
                alt={user.username}
                width={40}
                height={40}
                className="size-10 rounded-xl object-cover bg-white shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold truncate">
                    {user.fullName || user.username}
                  </span>
                  {user.cuezBadge && <CuezBadge />}
                </div>
                <span className="text-xs text-zinc-400 truncate">
                  @{user.username}
                </span>
              </div>
              {isPending && variables === user._id && (
                <Loader2 className="size-4 animate-spin text-zinc-400" />
              )}
            </button>
          ))}
          {q && results && users?.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">
              No people found for &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default NewMessageModal
