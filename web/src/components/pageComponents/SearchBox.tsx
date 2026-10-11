"use client"

import { Search, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useDebounce } from "@/hooks/useDebounce"
import { useSearchUsersPreview } from "@/hooks/useSearch"
import CuezBadge from "./CuezBadge"

// Sidebar search with an account typeahead, like X. Enter (or the first row)
// opens the full results page.
export const SearchBox = ({
  placeholder = "Search Cuez",
}: {
  placeholder?: string
}) => {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const q = useDebounce(query.trim(), 200)
  const { data: users } = useSearchUsersPreview(q)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const goToResults = () => {
    const term = query.trim()
    if (!term) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const goToProfile = (username: string) => {
    setOpen(false)
    setQuery("")
    router.push(`/${username}`)
  }

  const showDropdown = open && !!query.trim()

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToResults()
            if (e.key === "Escape") setOpen(false)
          }}
          className="w-full px-4 py-1.5 pl-10 pr-9 placeholder:text-zinc-400 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-mainclr transition-colors duration-200"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-zinc-400" />
        </div>
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 my-auto h-fit p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1.5 w-full bg-bgClr border border-zinc-700 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-30">
          <button
            onClick={goToResults}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors duration-150"
          >
            <Search className="size-4 text-zinc-400 shrink-0" />
            <span className="text-sm truncate">
              Search for &ldquo;{query.trim()}&rdquo;
            </span>
          </button>
          {users?.map((user) => (
            <button
              key={user._id}
              onClick={() => goToProfile(user.username)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left border-t border-zinc-800 hover:bg-zinc-800 transition-colors duration-150"
            >
              <Image
                src={user.profileImg || "/img/pfp/default.webp"}
                alt={user.username}
                width={36}
                height={36}
                className="size-9 rounded-lg object-cover bg-white shrink-0"
              />
              <div className="flex flex-col min-w-0">
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
