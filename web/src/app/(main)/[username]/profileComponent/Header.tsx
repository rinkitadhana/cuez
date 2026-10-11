"use client"
import { useGetMe } from "@/hooks/useAuth"
import { useGetUserProfile } from "@/hooks/useUser"
import { ArrowLeft, PencilLine } from "lucide-react"
import Link from "next/link"
import { useGoBack } from "@/hooks/useGoBack"
import { useParams } from "next/navigation"
const Header = () => {
  const goBack = useGoBack("/home")
  const { username } = useParams()
  const { data: authUser } = useGetMe()
  const { data: user } = useGetUserProfile(username as string)
  const owner = authUser?.user._id === user?.user._id

  const handleBack = () => {
    goBack()
  }

  return (
    <div className="flex sticky top-0 z-50 bg-bgClr items-center justify-between border-b border-zinc-700 h-[60px] px-4">
      <div className=" flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-zinc-800 rounded-xl w-fit cursor-pointer opacity-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold">Profile</h1>
      </div>
      {owner && (
        <Link
          href="/settings/profile"
          className="flex select-none items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700/70 transition-colors duration-200 px-3 py-1.5 border font-semibold text-sm border-zinc-700"
        >
          <PencilLine size={16} />
          Edit Profile
        </Link>
      )}
    </div>
  )
}

export default Header
