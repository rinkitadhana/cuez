import { useGetMe } from "@/hooks/useAuth"
import useMenuStore from "@/store/MenuStrore"
import SafeImage from "@/components/media/SafeImage"
import React from "react"
import Link from "next/link"

const MenuButton = () => {
  const { data } = useGetMe()
  const { setOpen } = useMenuStore()

  if (!data?.user) {
    return (
      <Link
        href="/login"
        className="md:hidden block px-3 py-1.5 rounded-xl bg-mainclr text-white text-xs font-semibold"
      >
        Log in
      </Link>
    )
  }

  return (
    <div onClick={() => setOpen(true)} className="md:hidden block">
      <SafeImage
        kind="avatar"
        src={data?.user?.profileImg || "/img/pfp/default.webp"}
        alt="menu"
        width={24}
        height={24}
        className="rounded-xl size-[34px] object-cover"
      />
    </div>
  )
}

export default MenuButton
