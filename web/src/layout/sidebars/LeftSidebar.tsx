"use client"

import CreatePost from "@/components/pageComponents/CreatePost"
import Image from "next/image"
import SafeImage from "@/components/media/SafeImage"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState, useEffect, useRef } from "react"
import { BsBell, BsBellFill } from "react-icons/bs"
import { FaRegUser, FaUser } from "react-icons/fa"
import { useLogout, useGetMe } from "@/hooks/useAuth"
import {
  IoBookmarks,
  IoBookmarksOutline,
  // IoFolderOpen,
  // IoFolderOpenOutline,
  IoSettingsOutline,
  IoSettingsSharp,
} from "react-icons/io5"
import { LuLogOut } from "react-icons/lu"
import {
  MdChatBubble,
  MdChatBubbleOutline,
  // MdOutlineWork,
  // MdWorkOutline,
} from "react-icons/md"
import {
  RiHome2Fill,
  RiHome2Line,
  RiSearchFill,
  RiSearchLine,
} from "react-icons/ri"
import { SlOptions } from "react-icons/sl"
import { useGetUnreadNotificationsCount } from "@/hooks/useNotification"
import { Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import ChatBadge from "@/components/chat/ChatBadge"

const LeftSidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { mutate: logout, isPending: isLogoutPending } = useLogout()
  const { data: me, isLoading: isMeLoading } = useGetMe()
  const { isLoggedIn, requireAuth } = useRequireAuth()
  const {
    data: unreadNotificationsCount,
    isLoading: isUnreadNotificationsCountLoading,
  } = useGetUnreadNotificationsCount()

  const handleLogout = () => {
    logout()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Nested pages (e.g. /settings/profile, /chat/<id>) keep their section lit.
  const isActive = (href: string) =>
    pathname === href || (href !== "/home" && pathname.startsWith(href + "/"))

  const links = [
    {
      href: "/home",
      label: "Home",
      public: true,
      icon: {
        filled: <RiHome2Fill className="text-xl" />,
        outline: <RiHome2Line className="text-xl" />,
      },
    },
    {
      href: "/search",
      label: "Search",
      public: true,
      icon: {
        filled: <RiSearchFill className="text-xl" />,
        outline: <RiSearchLine className="text-xl" />,
      },
    },
    // {
    //   href: "/projects",
    //   label: "Projects",
    //   icon: {
    //     filled: <IoFolderOpen className="text-xl" />,
    //     outline: <IoFolderOpenOutline className="text-xl" />,
    //   },
    // },
    // {
    //   href: "/jobs",
    //   label: "Jobs",
    //   icon: {
    //     filled: <MdOutlineWork className="text-xl" />,
    //     outline: <MdWorkOutline className="text-xl" />,
    //   },
    // },
    {
      href: "/notifications",
      label: "Notifications",
      icon: {
        filled: (
          <div className="relative">
            <BsBellFill className="text-xl" />
            {isUnreadNotificationsCountLoading ? (
              <div className="absolute -top-2 -right-1.5">
                <Loader2 className="animate-spin" size={12} />
              </div>
            ) : unreadNotificationsCount?.count &&
              unreadNotificationsCount.count > 0 ? (
              <div className="absolute -top-2 -right-1.5 bg-mainclr rounded-full min-w-[16px] h-4 flex items-center justify-center">
                <span className="text-[10px] font-bold">
                  {unreadNotificationsCount.count > 99
                    ? "99+"
                    : unreadNotificationsCount.count}
                </span>
              </div>
            ) : null}
          </div>
        ),
        outline: (
          <div className="relative">
            <BsBell className="text-xl" />
            {isUnreadNotificationsCountLoading ? (
              <div className="absolute -top-2 -right-1.5">
                <Loader2 className="animate-spin" size={12} />
              </div>
            ) : unreadNotificationsCount?.count &&
              unreadNotificationsCount.count > 0 ? (
              <div className="absolute -top-2 -right-1.5 bg-mainclr rounded-full min-w-[16px] h-4 flex items-center justify-center">
                <span className="text-[10px] font-bold">
                  {unreadNotificationsCount.count > 99
                    ? "99+"
                    : unreadNotificationsCount.count}
                </span>
              </div>
            ) : null}
          </div>
        ),
      },
    },
    {
      href: "/chat",
      label: "Chat",
      icon: {
        filled: (
          <div className="relative">
            <MdChatBubble className="text-xl" />
            <ChatBadge />
          </div>
        ),
        outline: (
          <div className="relative">
            <MdChatBubbleOutline className="text-xl" />
            <ChatBadge />
          </div>
        ),
      },
    },
    {
      href: "/bookmarks",
      label: "Bookmarks",
      icon: {
        filled: <IoBookmarks className="text-xl" />,
        outline: <IoBookmarksOutline className="text-xl" />,
      },
    },
    {
      href: `/${me?.user.username}`,
      label: "Profile",
      icon: {
        filled: <FaUser className="text-xl" />,
        outline: <FaRegUser className="text-xl" />,
      },
    },
    {
      href: "/settings",
      label: "Settings",
      icon: {
        filled: <IoSettingsSharp className="text-xl" />,
        outline: <IoSettingsOutline className="text-xl" />,
      },
    },
  ]

  return (
    <div className="w-full flex flex-col justify-between py-4 select-none h-screen">
      <div className="flex flex-col gap-3">
        <div className="relative" ref={menuRef}>
          {isMeLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={22} />
              <p className="text-sm">Loading...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="flex flex-col gap-2 p-3 rounded-2xl border border-zinc-700">
              <p className="text-sm font-semibold">New to Cuez?</p>
              <Link
                href="/login"
                className="w-full text-center text-sm py-1.5 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/80 transition-all duration-200"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="w-full text-center text-sm py-1.5 rounded-xl border border-zinc-700 font-semibold hover:bg-zinc-800 transition-all duration-200"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div
              onClick={() => setIsOpen(!isOpen)}
              className={` flex cursor-pointer items-center justify-between gap-2 w-full -ml-1  rounded-2xl group/pfp  transition-all duration-200 py-2 px-2 select-none      
              ${isOpen ? "bg-zinc-800 ml-0" : "hover:ml-0 hover:bg-zinc-800"}`}
            >
              <div className="flex items-center gap-2">
                <SafeImage
                  kind="avatar"
                  src={me?.user.profileImg}
                  alt="Profile picture"
                  width={36}
                  height={36}
                  className="rounded-xl size-9 bg-white object-cover"
                />
                <div
                  className={`opacity-0  transition-all duration-200 ${
                    isOpen ? "opacity-100" : "group-hover/pfp:opacity-100"
                  }`}
                >
                  <h1 className="font-semibold text-sm truncate">
                    {me?.user.fullName}
                  </h1>
                  <p className="text-xs text-zinc-400 truncate">
                    @{me?.user.username}
                  </p>
                </div>
              </div>
              <div className="px-1">
                <SlOptions
                  className={`opacity-0  ${
                    isOpen ? "opacity-80" : "group-hover/pfp:opacity-80"
                  } transition-all duration-200`}
                />
              </div>
            </div>
          )}

          {isOpen && (
            <div className="absolute top-16 left-0 w-full bg-zinc-800 cursor-pointer flex flex-col gap-1 p-2 select-none rounded-2xl">
              {/* <Link
                href="/"
                className="font-semibold flex items-center gap-2 px-2.5 py-2.5 rounded-xl hover:bg-zinc-500/20 transition-colors duration-200"
              >
                <IoMdAdd className=" text-xl" />
                <p className="text-sm">Add account</p>
              </Link> */}
              <button
                onClick={handleLogout}
                className="font-semibold flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-zinc-500/20 transition-colors duration-200"
              >
                {isLogoutPending ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <LuLogOut className="" />
                    <p className="text-sm">Logout</p>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 select-none">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (!isLoggedIn && !link.public) {
                  e.preventDefault()
                  requireAuth("page")
                }
              }}
              className="font-medium flex items-center gap-2 py-2.5 group/nav-link"
              style={{ fontWeight: isActive(link.href) ? "600" : "normal" }}
            >
              {isActive(link.href) ? link.icon.filled : link.icon.outline}
              <span className="group-hover/nav-link:ml-1.5 transition-all duration-200">
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
        <CreatePost />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Image
            src="/img/icon/cuez-logo.png"
            alt="Cuez Logo"
            width={32}
            height={32}
            className="size-9"
          />
          <div className="flex flex-col gap-0">
            <span className="font-bold text-2xl bg-mainclr bg-clip-text text-transparent">
              Cuez
            </span>
            <p className="text-xs text-zinc-300 -mt-1">for everyone.</p>
          </div>
        </div>
        <div className="flex gap-1 items-center text-xs text-zinc-400">
          {[
            { label: "Contact", href: "https://x.com/damnGruz" },
            {
              label: "Help",
              href: "https://www.youtube.com/watch?v=QDia3e12czc",
            },
            {
              label: "Legal",
              href: "https://www.youtube.com/watch?v=QDia3e12czc",
            },
            {
              label: "Terms",
              href: "https://www.youtube.com/watch?v=QDia3e12czc",
            },
          ].map((item, i) => (
            <span key={item.label} className="flex gap-1 items-center">
              {i > 0 && " • "}
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:underline hover:text-zinc-100 transition-opacity duration-200"
              >
                {item.label}
              </a>
            </span>
          ))}
        </div>
        <p className="text-xs text-zinc-300 mt-0.5">
          © Cuez 2025, All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LeftSidebar
