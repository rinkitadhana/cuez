"use client"
import PostItem from "@/components/pageComponents/PostItem"
import { useGetPosts } from "@/hooks/usePost"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import NoPosts from "@/components/notAvailable/NoPosts"
import LoadMore from "@/components/LoadMore"
const GetPosts = () => {
  const { items, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPosts()

  return (
    <section>
      {isLoading ? (
        <div className="flex flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          {items.map((post) => (
            <PostItem key={post._id} post={post} />
          ))}
          <LoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </>
      ) : (
        <NoPosts />
      )}
    </section>
  )
}

export default GetPosts
