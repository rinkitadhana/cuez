"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import UserInfo from "@/components/pageComponents/UserInfo"
import LoadMore from "@/components/LoadMore"
import {
  useGetFollowers,
  useGetFollowing,
  useGetUserProfile,
} from "@/hooks/useUser"
import { User } from "@/types/User"

const FollowListPage = () => {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [type, setType] = useState<"followers" | "following">("followers")
  const requestedTab = searchParams.get("tab")
  useEffect(() => {
    setType(requestedTab === "following" ? "following" : "followers")
  }, [requestedTab])
  const { data: profileData } = useGetUserProfile(username)
  const profile = profileData?.user
  const followers = useGetFollowers(username, type === "followers")
  const following = useGetFollowing(username, type === "following")
  const list = type === "followers" ? followers : following
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-zinc-700 bg-bgClr px-4">
        <button
          onClick={() => router.back()}
          aria-label="Back to profile"
          className="rounded-xl p-2 hover:bg-zinc-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-semibold">
            {profile?.fullName || username}
          </h1>
          <p className="truncate text-xs text-zinc-400">@{username}</p>
        </div>
      </header>
      <nav className="sticky top-[60px] z-10 flex border-b border-zinc-700 bg-bgClr">
        {(["followers", "following"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setType(tab)
              router.replace(`/${username}/followers?tab=${tab}`, {
                scroll: false,
              })
            }}
            aria-current={type === tab ? "page" : undefined}
            className={`relative flex-1 py-3.5 text-center font-semibold capitalize transition-colors hover:bg-zinc-800/50 ${
              type === tab ? "text-white" : "text-zinc-500"
            }`}
          >
            {tab}
            {type === tab && (
              <span className="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-sky-500" />
            )}
          </button>
        ))}
      </nav>
      <div className="flex flex-col gap-5 p-4">
        {list.isPending ? (
          <p className="py-4 text-center text-zinc-400">Loading...</p>
        ) : list.items.length === 0 ? (
          <p className="py-4 text-center text-zinc-400">
            No {type} yet
          </p>
        ) : (
          <>
            {list.items.map((person: User) => (
              <UserInfo key={person._id} user={person} />
            ))}
            <LoadMore
              hasNextPage={!!list.hasNextPage}
              isFetchingNextPage={list.isFetchingNextPage}
              fetchNextPage={list.fetchNextPage}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default FollowListPage
