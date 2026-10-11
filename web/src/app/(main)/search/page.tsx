"use client"
import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SearchX, X } from "lucide-react"
import MainWrapper from "@/layout/MainWrapper"
import MenuButton from "@/layout/MenuButton"
import PageHead from "@/components/pageComponents/PageHead"
import PostStructure from "@/components/pageComponents/PostStructure"
import UserInfo from "@/components/pageComponents/UserInfo"
import PostSkeleton from "@/components/skeletons/PostSkeleton"
import LoadMore from "@/components/LoadMore"
import { useDebounce } from "@/hooks/useDebounce"
import { useSearchPosts, useSearchUsers } from "@/hooks/useSearch"

type Tab = "posts" | "people"

const tabs: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "people", label: "People" },
]

const EmptyState = ({ q }: { q: string }) => (
  <div className="flex flex-col items-center text-center gap-2 px-6 py-16">
    {q ? (
      <>
        <SearchX className="size-10 text-zinc-500 mb-2" />
        <h2 className="text-xl font-semibold break-all">
          No results for &ldquo;{q}&rdquo;
        </h2>
        <p className="text-sm text-zinc-400">
          Try searching for something else, or check your spelling.
        </p>
      </>
    ) : (
      <>
        <Search className="size-10 text-zinc-500 mb-2" />
        <h2 className="text-xl font-semibold">Search Cuez</h2>
        <p className="text-sm text-zinc-400">
          Find posts, replies and people.
        </p>
      </>
    )}
  </div>
)

const PostResults = ({ q }: { q: string }) => {
  const { items, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSearchPosts(q)
  if (isLoading) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    )
  }
  if (items.length === 0) return <EmptyState q={q} />
  return (
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
  )
}

const PeopleResults = ({ q }: { q: string }) => {
  const { items, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSearchUsers(q)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="size-11 rounded-xl bg-zinc-800" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-32 rounded bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (items.length === 0) return <EmptyState q={q} />
  return (
    <div className="flex flex-col">
      {items.map((user) => (
        <div
          key={user._id}
          className="px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-200"
        >
          <UserInfo user={user} />
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

const SearchPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q")?.trim() || ""
  const tab: Tab = searchParams.get("f") === "people" ? "people" : "posts"
  const [input, setInput] = useState(q)
  const debounced = useDebounce(input.trim(), 350)

  const searchUrl = (term: string, f: Tab) => {
    const params = new URLSearchParams()
    if (term) params.set("q", term)
    if (f === "people") params.set("f", "people")
    const qs = params.toString()
    return qs ? `/search?${qs}` : "/search"
  }

  // Push what's typed into the URL (which drives the results), but only when
  // the typed value changes, so outside navigation isn't overwritten.
  const lastDebounced = useRef(debounced)
  useEffect(() => {
    if (debounced === lastDebounced.current) return
    lastDebounced.current = debounced
    if (debounced !== q) router.replace(searchUrl(debounced, tab))
  }, [debounced, q, tab, router])

  // Pick up searches started elsewhere without clobbering in-progress typing.
  useEffect(() => {
    setInput((prev) => (prev.trim() === q ? prev : q))
  }, [q])

  const setTab = (next: Tab) => router.replace(searchUrl(q, next))

  return (
    <>
      <PageHead title={q ? `${q} - Search / Cuez` : "Search / Cuez"} />
      <div className="sticky top-0 z-20 bg-bgClr">
        <div className="flex items-center gap-3 px-4 h-[60px] border-b border-zinc-700">
          <MenuButton />
          <div className="relative flex-1">
            <input
              autoFocus={!q}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.replace(searchUrl(input.trim(), tab))
                }
              }}
              placeholder="Search Cuez"
              className="w-full px-4 py-1.5 pl-10 pr-9 placeholder:text-zinc-400 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-mainclr transition-colors duration-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400 pointer-events-none" />
            {input && (
              <button
                onClick={() => setInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        {q && (
          <div className="flex border-b border-zinc-700">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-zinc-900 ${
                  tab === id ? "text-white" : "text-zinc-400"
                }`}
              >
                <span
                  className={`relative pb-3 ${
                    tab === id
                      ? "after:absolute after:-bottom-0 after:left-0 after:right-0 after:h-1 after:rounded-full after:bg-mainclr"
                      : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!q ? (
        <EmptyState q="" />
      ) : tab === "people" ? (
        <PeopleResults key={q} q={q} />
      ) : (
        <PostResults key={q} q={q} />
      )}
    </>
  )
}

const Page = () => (
  <MainWrapper>
    <Suspense>
      <SearchPage />
    </Suspense>
  </MainWrapper>
)

export default Page
