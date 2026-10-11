"use client"

import { ArrowLeft } from "lucide-react"
import { useGoBack } from "@/hooks/useGoBack"
import { usePathname } from "next/navigation"

const Header = ({ title }: { title: string }) => {
  // Sub-pages fall back to the settings list; the list itself to home.
  const pathname = usePathname()
  const goBack = useGoBack(pathname === "/settings" ? "/home" : "/settings")

  const handleBack = () => {
    goBack()
  }

  return (
    <div className="flex w-full select-none items-center border-b h-[60px] border-zinc-700 sticky top-0 bg-bgClr px-4 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-zinc-800 rounded-xl w-fit cursor-pointer opacity-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold opacity-95">{title}</h1>
      </div>
    </div>
  )
}

export default Header
