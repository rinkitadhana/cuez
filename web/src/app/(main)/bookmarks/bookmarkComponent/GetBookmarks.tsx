"use client"

import { useGetBookmarkedPosts } from "@/hooks/usePost"
import PostStructure from "@/components/pageComponents/PostStructure"
import NoBookmark from "./NoBookmark"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import LoadMore from "@/components/LoadMore"

const GetBookmarks = () => {
  const { items, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetBookmarkedPosts()
  return (
    <div>
      {isLoading ? (
        <div>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : items.length === 0 ? (
        <NoBookmark />
      ) : (
        <>
          {items.map((post) => (
            <PostStructure key={post._id} post={post} />
          ))}
          <LoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </>
      )}
    </div>
  )
}

export default GetBookmarks
