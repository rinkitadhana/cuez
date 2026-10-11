"use client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { FaGithub, FaRegStar, FaStar } from "react-icons/fa"
import { GoRepoForked } from "react-icons/go"

const REPO = "rinkitadhana/cuez"

interface RepoResponse {
  stargazers_count: number
  forks_count: number
}

const useRepoStats = () =>
  useQuery({
    queryKey: ["github-repo", REPO],
    queryFn: async () => {
      const { data } = await axios.get<RepoResponse>(
        `https://api.github.com/repos/${REPO}`
      )
      return data
    },
    // Unauthenticated GitHub API is limited to 60 req/hour per IP.
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`

const GithubStar = () => {
  const { data, isLoading } = useRepoStats()

  return (
    <div className="border rounded-xl border-zinc-700 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-9 rounded-lg bg-zinc-800 border border-zinc-700">
          <FaGithub className="text-lg" />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="font-bold leading-tight">Cuez is open source</h2>
          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline truncate"
          >
            github.com/{REPO}
          </a>
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        Built in public. If you like it, a star helps a lot.
      </p>

      <div className="flex items-center gap-2">
        <a
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group/star flex flex-1 items-stretch rounded-xl border border-zinc-700 overflow-hidden select-none text-sm font-semibold hover:border-zinc-500 transition-colors duration-200"
        >
          <span className="flex flex-1 items-center justify-center gap-2 px-3 py-2 bg-zinc-800 group-hover/star:bg-zinc-700 transition-colors duration-200">
            <FaRegStar className="group-hover/star:hidden" />
            <FaStar className="hidden group-hover/star:block text-yellow-400" />
            Star
          </span>
          <span className="flex items-center justify-center min-w-12 px-3 border-l border-zinc-700 tabular-nums">
            {isLoading ? (
              <span className="w-4 h-3 rounded bg-zinc-700 animate-pulse" />
            ) : data ? (
              formatCount(data.stargazers_count)
            ) : (
              "–"
            )}
          </span>
        </a>
        {data && (
          <a
            href={`https://github.com/${REPO}/fork`}
            target="_blank"
            rel="noopener noreferrer"
            title="Forks"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 transition-colors duration-200 tabular-nums"
          >
            <GoRepoForked />
            {formatCount(data.forks_count)}
          </a>
        )}
      </div>
    </div>
  )
}

export default GithubStar
