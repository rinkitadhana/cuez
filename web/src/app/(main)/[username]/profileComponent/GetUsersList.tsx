import UserInfo from "@/components/pageComponents/UserInfo"
import { useGetFollowing, useGetFollowers } from "@/hooks/useUser"
import { User } from "@/types/User"
import { X } from "lucide-react"
import LoadMore from "@/components/LoadMore"

const GetUsersList = ({
  user,
  type,
  isOpen,
  onClose,
}: {
  user: User
  type: "followers" | "following"
  isOpen: boolean
  onClose: () => void
}) => {
  // Only fetch the list that's actually open.
  const followers = useGetFollowers(
    user.username,
    isOpen && type === "followers"
  )
  const following = useGetFollowing(
    user.username,
    isOpen && type === "following"
  )
  const {
    items: data,
    isPending: isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = type === "followers" ? followers : following

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 md:px-0 px-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bgClr rounded-xl w-[450px] max-h-[80vh] border border-zinc-700 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-zinc-700 flex justify-center relative">
          <h2 className="text-lg font-semibold">
            {type === "followers" ? "Followers" : "Following"}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-2 p-1.5 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-5 p-4">
          {isLoading ? (
            <p className="text-center text-zinc-400 py-4">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-center text-zinc-400 py-4">
              No {type === "followers" ? "followers" : "following"} yet
            </p>
          ) : (
            <>
              {data.map((user: User) => (
                <div key={user._id}>
                  <UserInfo user={user} />
                </div>
              ))}
              <LoadMore
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GetUsersList
