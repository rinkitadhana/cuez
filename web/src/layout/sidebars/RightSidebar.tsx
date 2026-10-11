"use client"
import { SearchBox } from "@/components/pageComponents/SearchBox"
import { usePathname } from "next/navigation"
import Link from "next/link"
import SuggestedUsers from "@/components/pageComponents/SuggestedUsers"
import FeedbackForm from "@/components/FeedbackForm"
// import BetaNotification from "@/components/pageComponents/BetaNotification"
import GithubStar from "@/components/pageComponents/GithubStar"
import Offer from "@/components/pageComponents/Offer"
import { useIsLoggedIn } from "@/hooks/useAuth"
const RightSidebar = () => {
  const pathname = usePathname()
  const isLoggedIn = useIsLoggedIn()

  if (!isLoggedIn) {
    return (
      <section className="flex flex-col gap-4 my-4 w-full">
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">New to Cuez?</h2>
            <p className="text-sm text-zinc-400">
              Sign up now to post, comment and follow other programmers.
            </p>
          </div>
          <Link
            href="/signup"
            className="w-full text-center py-2 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/80 transition-all duration-200"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="w-full text-center py-2 rounded-xl border border-zinc-700 font-semibold hover:bg-zinc-800 transition-all duration-200"
          >
            Log in
          </Link>
        </div>
        <GithubStar />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 my-4 w-full">
      {!pathname.includes("/search") && <SearchBox />}
      {/* <BetaNotification /> */}
      <SuggestedUsers />
      <Offer />
      <FeedbackForm />
      <GithubStar />
    </section>
  )
}

export default RightSidebar
