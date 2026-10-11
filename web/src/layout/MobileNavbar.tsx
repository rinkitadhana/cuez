"use client"
import { useGetMe } from "@/hooks/useAuth"
import { useGetUnreadNotificationsCount } from "@/hooks/useNotification"
import { Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import ChatBadge from "@/components/chat/ChatBadge"
import { usePathname } from "next/navigation"
import NextLink from "next/link"
import { BsBell, BsBellFill } from "react-icons/bs"
import { TiThMenu, TiThMenuOutline } from "react-icons/ti"
import { IoBookmarks, IoBookmarksOutline } from "react-icons/io5"
import { MdChatBubble, MdChatBubbleOutline } from "react-icons/md"
import {
  RiHome2Fill,
  RiHome2Line,
  RiSearchFill,
  RiSearchLine,
} from "react-icons/ri"

/**
 * MobileNavbar component for bottom navigation on mobile devices
 * Displays navigation links with active state indicators
 */
const MobileNavbar = () => {
  const { isLoading: isLoadingUser } = useGetMe()
  const { isLoggedIn, requireAuth } = useRequireAuth()
  const {
    data: unreadNotificationsCount,
    isLoading: isUnreadNotificationsCountLoading,
  } = useGetUnreadNotificationsCount()

  const pathname = usePathname()

  // Navigation links configuration
  const links = [
    {
      href: "/home",
      label: "Home",
      public: true,
      icon: {
        filled: <RiHome2Fill className="text-2xl" />,
        outline: <RiHome2Line className="text-2xl" />,
      },
    },
    {
      href: "/search",
      label: "Search",
      public: true,
      icon: {
        filled: <RiSearchFill className="text-2xl" />,
        outline: <RiSearchLine className="text-2xl" />,
      },
    },
    // {
    //   href: "/projects",
    //   label: "Projects",
    //   icon: {
    //     filled: <IoFolderOpen className="text-2xl" />,
    //     outline: <IoFolderOpenOutline className="text-2xl" />,
    //   },
    // },
    // {
    //   href: "/discussions",
    //   label: "Discussions",
    //   icon: {
    //     filled: <BiSolidChat className="text-2xl" />,
    //     outline: <BiChat className="text-2xl" />,
    //   },
    // },
    {
      href: "/notifications",
      label: "Notifications",
      icon: {
        filled: (
          <div className="relative">
            <BsBellFill className="text-2xl" />
            {renderNotificationBadge()}
          </div>
        ),
        outline: (
          <div className="relative">
            <BsBell className="text-2xl" />
            {renderNotificationBadge()}
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
            <MdChatBubble className="text-2xl" />
            <ChatBadge />
          </div>
        ),
        outline: (
          <div className="relative">
            <MdChatBubbleOutline className="text-2xl" />
            <ChatBadge />
          </div>
        ),
      },
    },
    {
      href: "/bookmarks",
      label: "Bookmarks",
      icon: {
        filled: <IoBookmarks className="text-2xl" />,
        outline: <IoBookmarksOutline className="text-2xl" />,
      },
    },
    {
      href: `/more`,
      label: "More",
      icon: {
        filled: <TiThMenu className="text-2xl" />,
        outline: <TiThMenuOutline className="text-2xl" />,
      },
    },
    // {
    //   href: "/settings",
    //   label: "Settings",
    //   icon: {
    //     filled: <IoSettingsSharp className="text-2xl" />,
    //     outline: <IoSettingsOutline className="text-2xl" />,
    //   },
    // },
  ]

  function renderNotificationBadge() {
    if (isUnreadNotificationsCountLoading) {
      return (
        <div className="absolute -top-2 -right-1.5">
          <Loader2 className="animate-spin" size={12} />
        </div>
      )
    }

    if (unreadNotificationsCount?.count && unreadNotificationsCount.count > 0) {
      return (
        <div className="absolute -top-2 -right-1.5 bg-mainclr text-white rounded-full min-w-[16px] h-4 flex items-center justify-center">
          <span className="text-[10px] font-bold">
            {unreadNotificationsCount.count > 99
              ? "99+"
              : unreadNotificationsCount.count}
          </span>
        </div>
      )
    }

    return null
  }

  const isLinkActive = (href: string) => {
    if (href === "/home" && pathname === "/") return true
    return pathname === href || (href !== "/home" && pathname?.startsWith(href))
  }

  if (isLoadingUser) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-bgClr border-t border-zinc-700 h-14 flex items-center justify-center">
        <Loader2 className="animate-spin text-mainclr" size={24} />
      </div>
    )
  }

  return (
    <nav className="sticky md:hidden bottom-0 left-0 right-0 bg-bgClr border-t border-zinc-700 z-50">
      <div className="max-w-screen-lg mx-auto px-6 py-1">
        <div className="flex justify-between items-center">
          {links.map((link) => {
            const isActive = isLinkActive(link.href)

            return (
              <NextLink
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (!isLoggedIn && !link.public) {
                    e.preventDefault()
                    requireAuth("page")
                  }
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-1 transition-colors ${
                  isActive
                    ? "text-mainclr"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                aria-label={link.label}
                title={link.label}
              >
                <div className="relative">
                  {isActive ? link.icon.filled : link.icon.outline}
                </div>
                <span className="text-[10px] mt-1 hidden sm:block">
                  {link.label}
                </span>
              </NextLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default MobileNavbar
