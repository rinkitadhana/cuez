"use client"
import MenuButton from "@/layout/MenuButton"

const Header = () => {
  return (
    <div className="flex w-full select-none items-center border-b h-[60px] border-zinc-700 sticky top-0 bg-bgClr px-4 z-10">
      <div className="flex items-center gap-4">
        <MenuButton />
        <h1 className="font-semibold opacity-95">Notifications</h1>
      </div>
    </div>
  )
}

export default Header
