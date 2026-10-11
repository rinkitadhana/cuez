"use client"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import MobileMenu from "@/layout/MobileMenu"
import MobileNavbar from "./MobileNavbar"
import LeftSidebar from "./sidebars/LeftSidebar"
import RightSidebar from "./sidebars/RightSidebar"
import PostButton from "@/components/pageComponents/PostButton"

// Page frame shared by every (main) route. It lives in the layout so the
// sidebars stay mounted across navigation (no flicker, hover state kept);
// only the middle column changes.
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  // Chat uses the full width (no right sidebar); an open conversation is
  // full-screen on mobile.
  const wide = pathname === "/chat" || pathname.startsWith("/chat/")
  const hideMobileNav = pathname.startsWith("/chat/")

  // Each page starts at the top, as it did when every page had its own frame.
  const centerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    centerRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      <main
        className={`flex justify-center lg:w-[1200px] w-full mx-auto gap-4 overflow-visible ${
          hideMobileNav ? "h-dvh md:h-screen" : "h-screen"
        }`}
      >
        <div className="lg:w-[17%] md:w-[25%] w-full h-full hidden md:block md:pl-4">
          <LeftSidebar />
        </div>
        {wide ? (
          <div className="relative lg:w-[83%] md:w-full w-full md:border-x md:border-zinc-700 overflow-hidden">
            {children}
          </div>
        ) : (
          <>
            <div
              ref={centerRef}
              className="relative lg:w-[53%] md:w-full w-full md:border-x md:border-zinc-700 overflow-y-auto overflow-x-visible scrollbar-hide"
            >
              <PostButton />
              {children}
            </div>
            <div className="lg:w-[30%] pr-4 w-full h-full overflow-y-auto overflow-x-visible scrollbar-hide md:hidden hidden lg:hidden xl:block">
              <RightSidebar />
            </div>
          </>
        )}
      </main>
      {!hideMobileNav && <MobileNavbar />}
      <MobileMenu />
    </>
  )
}

export default AppShell
