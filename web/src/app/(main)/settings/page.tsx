"use client"
import MainWrapper from "@/layout/MainWrapper"
import PageHead from "../../../components/pageComponents/PageHead"
import Header from "./settingComponent/Header"
import { useGetMe, useLogout } from "@/hooks/useAuth"
import SafeImage from "@/components/media/SafeImage"
import {
  AtSign,
  ChevronRight,
  HelpCircle,
  Info,
  Loader2,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { FaRegUser } from "react-icons/fa"
import { LuLogOut } from "react-icons/lu"
const SettingsPage = () => {
  const { data, isLoading } = useGetMe()
  const { mutate: logout } = useLogout()
  const links = [
    {
      id: 1,
      icon: <FaRegUser className="size-5" />,
      name: "Edit Profile",
      href: "/settings/profile",
    },
    {
      id: 2,
      icon: <AtSign className="size-5" />,
      name: "handle",
      href: "/settings/handle",
    },
    {
      id: 3,
      icon: <Lock className="size-5" />,
      name: "Password",
      href: "/settings/password",
    },
    {
      id: 4,
      icon: <HelpCircle className="size-5" />,
      name: "Help",
      href: "https://x.com/damnGruz",
    },
    {
      id: 5,
      icon: <Info className="size-5" />,
      name: "About",
      href: "https://github.com/rinkitadhana/Cuez/blob/master/README.md",
    },
  ]
  return (
    <MainWrapper>
      <PageHead title="Settings" />
      <Header title="Settings" />
      <div className="flex items-center justify-center py-8 border-b border-zinc-700">
        {isLoading ? (
          <Loader2 className="size-10 animate-spin" />
        ) : (
          <div className=" flex flex-col items-center gap-1.5">
            <SafeImage
              kind="avatar"
              src={data?.user.profileImg || ""}
              alt="profile"
              width={100}
              height={100}
              className="rounded-full size-[100px] object-cover select-none"
            />
            <div className="flex flex-col items-center -space-y-0.5">
              <h1 className="text-3xl font-bold">
                {data?.user?.fullName || "Deleted User"}
              </h1>
              <p className="text-sm text-zinc-400">@{data?.user?.username}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col border-b border-zinc-700">
        {links.map((link) => (
          <Link href={link.href} key={link.id}>
            <div className="flex items-center justify-between font-semibold hover:bg-zinc-800 cursor-pointer transition-all duration-200 py-3 px-4">
              <div className=" flex items-center gap-3">
                {link.icon}
                <p>{link.name}</p>
              </div>

              <ChevronRight className="size-5" />
            </div>
          </Link>
        ))}
      </div>
      <div
        onClick={() => logout()}
        className="flex items-center gap-3 text-red-500 font-semibold py-3 px-4 cursor-pointer transition-all duration-200 hover:bg-zinc-800"
      >
        <LuLogOut className="size-5" /> Logout
      </div>
    </MainWrapper>
  )
}

export default SettingsPage
