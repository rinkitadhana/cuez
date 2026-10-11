"use client"
import Link from "next/link"
import { FiFeather } from "react-icons/fi"
import { usePathname } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"

const PostButton = () => {
  const pathname = usePathname()
  const { isLoggedIn, requireAuth } = useRequireAuth()
  return (
    <div className="fixed md:hidden bottom-16 right-5 z-50">
      {pathname !== "/post" ? (
        <Link
          href="/post"
          onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault()
              requireAuth("post")
            }
          }}
          className="bg-mainclr/80 text-white font-semibold p-2.5 rounded-full flex items-center gap-2"
        >
          <FiFeather className="size-7" />
        </Link>
      ) : (
        <></>
      )}
    </div>
  )
}

export default PostButton
