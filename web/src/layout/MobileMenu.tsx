"use client"
import { useGetMe, useLogout } from "@/hooks/useAuth"
import useMenuStore from "@/store/MenuStrore"
import SafeImage from "@/components/media/SafeImage"
import React from "react"
import CuezBadge from "../components/pageComponents/CuezBadge"
import { useRouter } from "next/navigation"
import { FaRegUser } from "react-icons/fa"
import { IoFolderOpenOutline, IoSettingsOutline } from "react-icons/io5"
import { MdWorkOutline } from "react-icons/md"
import { Loader2 } from "lucide-react"
import { LuLogOut } from "react-icons/lu"
import { FiFeather } from "react-icons/fi"

const MobileMenu = () => {
  const { data } = useGetMe()
  const { open, setOpen } = useMenuStore()
  const { mutate: logOut, isPending: isLogoutPending } = useLogout()
  const router = useRouter()

  const userProfile = () => {
    router.push(`/${data?.user?.username}`)
    setOpen(false)
  }
  const handleLogout = () => {
    logOut()
    setOpen(false)
  }
  return (
    <div
      onClick={() => setOpen(false)}
      className={`fixed top-0 left-0 w-full h-full z-[999] bg-black/40 backdrop-blur-sm ${
        open ? "block" : "hidden"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-[70%] h-full p-4 border-r border-zinc-700  bg-bgClr z-[999]   "
      >
        <div className=" flex flex-col gap-2">
          <SafeImage
            kind="avatar"
            onClick={userProfile}
            src={data?.user?.profileImg || "/img/pfp/default.webp"}
            alt="user"
            width={24}
            height={24}
            className="rounded-xl size-10 object-cover"
          />
          <div className="flex flex-col -gap-1">
            <div className="flex items-center gap-1.5">
              <h1
                onClick={userProfile}
                className="text-xl hover:underline font-semibold"
              >
                {data?.user?.fullName}
              </h1>
              {data?.user?.cuezBadge && <CuezBadge />}
            </div>
            <p onClick={userProfile} className="text-sm text-zinc-400">
              @{data?.user?.username}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p onClick={userProfile} className="">
              {data?.user?.followings?.length}{" "}
              <span className="text-zinc-400">following</span>
            </p>
            <p onClick={userProfile} className="">
              {data?.user?.followers?.length}{" "}
              <span className="text-zinc-400">followers</span>
            </p>
          </div>
        </div>
        <div className=" flex flex-col justify-between h-full py-5">
          <div className="flex flex-col gap-4">
            <div
              onClick={userProfile}
              className=" flex items-center gap-3 font-semibold text-lg"
            >
              <FaRegUser />
              Profile
            </div>
            <div
              onClick={() => {
                router.push("/projects")
                setOpen(false)
              }}
              className=" flex items-center gap-3 font-semibold text-lg"
            >
              <IoFolderOpenOutline />
              Projects
            </div>
            <div
              onClick={() => {
                router.push("/jobs")
                setOpen(false)
              }}
              className=" flex items-center gap-3 font-semibold text-lg"
            >
              <MdWorkOutline />
              Jobs
            </div>
            <div
              onClick={() => {
                router.push("/settings")
                setOpen(false)
              }}
              className=" flex items-center gap-3 font-semibold text-lg"
            >
              <IoSettingsOutline />
              Settings
            </div>
            <div
              onClick={() => {
                router.push("/post")
                setOpen(false)
              }}
              className=" flex items-center gap-3 font-semibold rounded-xl bg-mainclr text-white px-4 py-2 justify-center"
            >
              <FiFeather size={20} />
              Create Post
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 font-semibold text-lg rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2"
          >
            {isLogoutPending ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                <LuLogOut className="" />
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
