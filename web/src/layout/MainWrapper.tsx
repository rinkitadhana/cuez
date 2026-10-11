import MobileMenu from "@/layout/MobileMenu"
import MobileNavbar from "./MobileNavbar"
import LeftSidebar from "./sidebars/LeftSidebar"
import RightSidebar from "./sidebars/RightSidebar"
import PostButton from "@/components/pageComponents/PostButton"

const MainWrapper = ({
  children,
  wide = false,
  hideMobileNav = false,
}: {
  children: React.ReactNode
  // Full-width content without the right sidebar (used by chat).
  wide?: boolean
  hideMobileNav?: boolean
}) => {
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
            <div className="relative lg:w-[53%] md:w-full w-full md:border-x md:border-zinc-700 overflow-y-auto overflow-x-visible scrollbar-hide">
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

export default MainWrapper
