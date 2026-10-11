import PostStructure from "@/components/pageComponents/PostStructure"
import { useGetLikedPosts } from "@/hooks/usePost"
import { useParams } from "next/navigation"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import NoProfilePosts from "@/components/notAvailable/NoProfilePosts"
import LoadMore from "@/components/LoadMore"

const GetLikedPost = () => {
  const { username } = useParams()
  const {
    items,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetLikedPosts(username as string)

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

  if (items.length === 0) return <NoProfilePosts />

  return (
    <div>
      {items.map((post) => (
        <PostStructure key={post._id} post={post} />
      ))}
      <LoadMore
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  )
}

export default GetLikedPost
