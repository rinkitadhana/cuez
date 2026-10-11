"use client"
import MenuButton from "@/layout/MenuButton"

const Header = () => {
  return (
    <div className="flex w-full select-none items-center border-b border-zinc-800 sticky top-0 bg-bgClr/95 backdrop-blur-sm px-4 sm:px-6 z-10 h-16">
      <div className="flex items-center gap-3">
        <MenuButton />
        <h1 className="font-semibold text-white/95 text-lg">Notifications</h1>
      </div>
    </div>
  )
}

export default Header
