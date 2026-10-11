import { useFollowUnfollowUser } from "@/hooks/useUser"
import Image from "next/image"
import React from "react"
import { User } from "@/types/User"
import { useGetMe } from "@/hooks/useAuth"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRouter } from "next/navigation"
import CuezBadge from "./CuezBadge"
import FollowsYou from "./FollowsYou"
const UserInfo = ({ user }: { user: User }) => {
  const router = useRouter()
  const { mutate: followUnfollowUser } = useFollowUnfollowUser()
  const { data: authUser } = useGetMe()
  const { requireAuth } = useRequireAuth()
  // Derived from cached data so optimistic updates show instantly.
  const meId = authUser?.user._id
  const isFollowing = !!authUser?.user.followings.includes(user._id)
  const followsYou = !!meId && !!user.followings?.includes(meId)
  const handleFollowUnfollowUser = () => {
    requireAuth("follow", () => followUnfollowUser(user._id))
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2 truncate">
        <Image
          src={user?.profileImg || "/img/pfp/default.webp"}
          alt={user?.username || "default"}
          width={50}
          height={50}
          className="size-11 rounded-xl cursor-pointer select-none object-cover hover:brightness-90 bg-white transition-all duration-200"
          onClick={() => router.push(`/${user.username}`)}
        />
        <div>
          <div className="flex items-center gap-1">
            <div
              onClick={() => router.push(`/${user.username}`)}
              className="font-semibold cursor-pointer hover:underline"
            >
              {user.fullName || "Deleted User"}
            </div>
            {user.cuezBadge && <CuezBadge />}
          </div>
          <div className="flex items-center gap-1">
            <p className="text-sm text-zinc-400">
              @{user.username || "DeletedUser"}
            </p>
            {followsYou && <FollowsYou />}
          </div>
        </div>
      </div>
      <div className="flex items-center pl-4 select-none">
        {meId !== user._id && (
          <button onClick={handleFollowUnfollowUser}>
            {isFollowing ? (
              <div className="font-semibold px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-800/80 transition-all duration-200">
                Following
              </div>
            ) : (
              <div className="font-semibold px-4 py-1.5 rounded-xl bg-mainclr hover:bg-mainclr/80 transition-all duration-200">
                Follow
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default UserInfo
