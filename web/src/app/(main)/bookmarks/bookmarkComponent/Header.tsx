"use client"

import MenuButton from "@/layout/MenuButton"
import { useGetMe } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

const Header = () => {
  // Total comes from the user record; the list itself is paginated.
  const { data: me, isLoading } = useGetMe()
  return (
    <div className="flex w-full select-none justify-between items-center border-b h-[60px] border-zinc-700 sticky top-0 bg-bgClr px-4 z-10">
      <div className=" flex items-center gap-4 ">
        <MenuButton />
        <h1 className="font-semibold opacity-95">Bookmarks</h1>
      </div>
      <div className="border border-zinc-700 text-zinc-200 bg-zinc-800 rounded-xl px-4 py-1">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          `${me?.user.bookmarks?.length ?? 0} Posts`
        )}
      </div>
    </div>
  )
}

export default Header
