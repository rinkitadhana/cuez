"use client"
import MainWrapper from "@/layout/MainWrapper"
import Header from "./profileComponent/Header"
import Image from "next/image"
import { Calendar, Link, Loader2, MapPin, X } from "lucide-react"
import {
  useFollowUnfollowUser,
  useGetFollowsYou,
  useGetUserProfile,
  useIsFollowing,
} from "@/hooks/useUser"
import { useParams } from "next/navigation"
import { useGetMe } from "@/hooks/useAuth"
import GetUserPost from "./profileComponent/GetUserPost"
import GetLikedPost from "./profileComponent/GetLikedPost"
import { useState } from "react"
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton"
import NoUser from "@/components/notAvailable/NoUser"
import GetUsersList from "./profileComponent/GetUsersList"
import FollowsYou from "@/components/pageComponents/FollowsYou"
import PageHead from "@/components/pageComponents/PageHead"
import { useRequireAuth } from "@/hooks/useRequireAuth"
const UserProfile = () => {
  const { username } = useParams()
  const [response, setResponse] = useState<string>("user-posts")
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false)
  const { data, isLoading, isError } = useGetUserProfile(username as string)
  const { data: authUser } = useGetMe()
  const { requireAuth } = useRequireAuth()
  const { mutate: followUnfollowUser, isPending: isFollowUnfollowPending } =
    useFollowUnfollowUser()
  const { data: followsYou } = useGetFollowsYou(data?.user._id || "")
  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const [userType, setUserType] = useState<"followers" | "following">(
    "followers"
  )
  const { data: isFollowing } = useIsFollowing(data?.user._id || "")
  const user = data?.user
  const owner = authUser?.user._id === user?._id
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", { month: "long", year: "numeric" })
  }
  const handleFollowUnfollow = () => {
    requireAuth("follow", () => followUnfollowUser(user?._id || ""))
  }
  const formatLink = (link: string) => {
    if (link.startsWith("https://")) {
      return link.slice(8)
    }
    if (link.startsWith("http://")) {
      return link.slice(7)
    }
    return link
  }

  return (
    <MainWrapper>
      <PageHead title={`${user?.fullName} (${user?.username}) / Cuez`} />
      <div>
        <Header />
        {isLoading ? (
          <ProfileSkeleton />
        ) : isError ? (
          <NoUser />
        ) : (
          <>
            <div className="rounded-xl relative mb-[60px] select-none">
              <Image
                src={user?.coverImg || ""}
                className="w-full h-[160px] md:h-[200px] object-cover bg-white cursor-pointer hover:brightness-90 transition-all duration-200"
                alt="profile"
                width={1000}
                height={1000}
                onClick={() => setIsCoverImageModalOpen(true)}
              />
              <Image
                src={user?.profileImg || ""}
                className="absolute -bottom-[60px] bg-white left-5 size-[120px] object-cover rounded-xl border-4 border-bgClr cursor-pointer hover:brightness-90 transition-all duration-200"
                alt="profile"
                width={1000}
                height={1000}
                onClick={() => setIsImageModalOpen(true)}
              />
              {!owner && (
                <>
                  {isFollowing?.isFollowing ? (
                    <button
                      onClick={handleFollowUnfollow}
                      className="absolute -bottom-[50px] right-5 bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-all duration-200 px-4 py-1.5 rounded-xl"
                    >
                      {isFollowUnfollowPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Following"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowUnfollow}
                      className="absolute -bottom-[50px] right-5 bg-mainclr text-white font-semibold hover:bg-mainclr/80 transition-all duration-200 px-4 py-1.5 rounded-xl"
                    >
                      {isFollowUnfollowPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Follow"
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="px-5 py-3 flex flex-col gap-2.5">
              <div className="flex flex-col">
                <div className="flex gap-2 items-center">
                  <h1 className="text-2xl font-semibold">{user?.fullName}</h1>
                  {user?.cuezBadge && (
                    <div
                      title="Cuez Badge"
                      className="flex items-center border border-zinc-700 rounded-md p-0.5 bg-white select-none"
                    >
                      <Image
                        src="/img/icon/cuez-logo.png"
                        alt="cuez-logo"
                        width={20}
                        height={20}
                        className="rounded-full bg-white object-cover size-[14px] select-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <p className="text-sm text-zinc-400 -mt-0.5">
                    @{user?.username}
                  </p>
                  {followsYou?.followsYou && <FollowsYou />}
                </div>
              </div>
              <p className="">{user?.bio}</p>
              <div className="flex flex-wrap gap-3 items-center text-sm text-zinc-400">
                <div className="flex gap-1 items-center">
                  <MapPin size={14} /> {user?.location}
                </div>
                {user?.link && (
                  <div className="flex gap-1 items-center">
                    <Link size={14} />{" "}
                    <a
                      href={`https://${formatLink(user?.link || "")}`}
                      target="_blank"
                      className="text-blue-500 hover:underline"
                      rel="noopener noreferrer"
                    >
                      {formatLink(user?.link || "")}
                    </a>
                  </div>
                )}
                <div className="flex gap-1 items-center">
                  <Calendar size={14} /> Joined{" "}
                  {formatDate(user?.createdAt || "")}
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => {
                    setUserType("following")
                    setIsUsersListOpen(true)
                  }}
                  className="flex gap-1 hover:underline"
                >
                  <span>{user?.followings.length}</span>{" "}
                  <span className="text-zinc-400">Following</span>
                </button>
                <button
                  onClick={() => {
                    setUserType("followers")
                    setIsUsersListOpen(true)
                  }}
                  className="flex gap-1 hover:underline"
                >
                  <span>{user?.followers.length}</span>{" "}
                  <span className="text-zinc-400">Followers</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center mt-3  py-2.5 border-b border-zinc-700">
              <div className="flex border items-center rounded-xl w-fit border-zinc-700 select-none">
                <button
                  onClick={() => setResponse("user-posts")}
                  className={`${
                    response === "user-posts" && "bg-zinc-800"
                  } px-4 py-1 font-medium bg-bgClr border-r border-zinc-700 text-sm hover:bg-zinc-800 rounded-l-xl cursor-pointer transition-all duration-200`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setResponse("liked-posts")}
                  className={`${
                    response === "liked-posts" && "bg-zinc-800"
                  } px-4 py-1 font-medium bg-bgClr hover:bg-zinc-800 text-sm rounded-r-xl cursor-pointer transition-all duration-200`}
                >
                  Likes
                </button>
              </div>
            </div>
            {response === "user-posts" && <GetUserPost />}
            {response === "liked-posts" && <GetLikedPost />}
          </>
        )}
      </div>

      {isImageModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsImageModalOpen(false)
          }}
          className="fixed inset-0 bg-bgClr/80 backdrop-blur-sm flex justify-center items-center z-[10000]"
        >
          <div className="rounded-xl flex justify-center items-center">
            <Image
              src={user?.profileImg || ""}
              alt="Profile image"
              width={800}
              height={800}
              quality={100}
              className="rounded-xl w-[400px] h-[400px] select-none bg-white object-cover"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsImageModalOpen(false)
            }}
            className="absolute top-4 right-4 text-white hover:bg-zinc-700/50 rounded-xl p-2 transition-all duration-200"
          >
            <X />
          </button>
        </div>
      )}
      {isCoverImageModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setIsCoverImageModalOpen(false)
          }}
          className="fixed inset-0 bg-bgClr/80 backdrop-blur-sm flex justify-center items-center z-[10000]"
        >
          <div className="w-[95%] h-[600px] rounded-xl flex justify-center items-center">
            <Image
              src={user?.coverImg || ""}
              alt="Cover image"
              width={1920}
              height={1080}
              className="rounded-xl max-w-full select-none bg-white max-h-full object-cover"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCoverImageModalOpen(false)
            }}
            className="absolute top-4 right-4 text-white hover:bg-zinc-700/50 rounded-xl p-2 transition-all duration-200"
          >
            <X />
          </button>
        </div>
      )}
      {user && (
        <GetUsersList
          user={user}
          type={userType}
          isOpen={isUsersListOpen}
          onClose={() => setIsUsersListOpen(false)}
        />
      )}
    </MainWrapper>
  )
}

export default UserProfile
