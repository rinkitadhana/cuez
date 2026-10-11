import PostStructure from "@/components/pageComponents/PostStructure"
import { useGetUserReplies } from "@/hooks/usePost"
import { useParams } from "next/navigation"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import NoProfilePosts from "@/components/notAvailable/NoProfilePosts"
import LoadMore from "@/components/LoadMore"

// Replies tab, like X: each reply under the post it answers, joined by a
// thread line.
const GetUserReplies = () => {
  const { username } = useParams()
  const {
    items,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetUserReplies(username as string)

  if (isLoading) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    )
  }

  if (error) return <div>{error.message}</div>

  if (items.length === 0) {
    return <NoProfilePosts title="No replies yet" />
  }

  return (
    <div>
      {items.map((reply) => (
        <div key={reply._id}>
          {reply.parentPost ? (
            <div className="relative">
              <PostStructure post={reply.parentPost} inThread />
              {/* Line from the parent's avatar down to the reply's avatar. */}
              <div className="absolute left-[35px] top-[60px] -bottom-4 w-0.5 bg-zinc-700 z-10 pointer-events-none" />
            </div>
          ) : (
            <p className="px-4 pt-3 -mb-2 text-sm text-zinc-500">
              Replying to a deleted post
            </p>
          )}
          <PostStructure post={reply} />
        </div>
      ))}
      <LoadMore
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  )
}

export default GetUserReplies
