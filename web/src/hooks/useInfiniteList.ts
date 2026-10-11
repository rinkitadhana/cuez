import config from "../config/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"

const PAGE_SIZE = 20

type Page<K extends string, T> = { [key in K]: T[] } & {
  nextCursor?: string | null
}

// Cursor-paginated list from the API. `items` is every loaded page flattened;
// call fetchNextPage (usually via <LoadMore />) to get the next one.
export const useInfiniteList = <T, K extends string>({
  queryKey,
  path,
  itemsKey,
  enabled = true,
}: {
  queryKey: unknown[]
  path: string
  itemsKey: K
  enabled?: boolean
}) => {
  const query = useInfiniteQuery<Page<K, T>, AxiosError>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get<Page<K, T>>(config.backendUrl + path, {
        params: { limit: PAGE_SIZE, cursor: pageParam ?? undefined },
        withCredentials: true,
      })
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled,
  })

  const items = query.data?.pages.flatMap((page) => page[itemsKey] ?? []) ?? []

  return { ...query, items }
}
