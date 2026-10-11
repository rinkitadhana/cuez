"use client"

import { FileQuestion } from "lucide-react"

const NoProfilePosts = ({ title = "No Posts Available" }: { title?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[30vh] text-zinc-400">
      <div className="relative mb-6">
        <FileQuestion className="w-16 h-16 animate-pulse" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-zinc-700 rounded-full" />
      </div>
      <h3 className="text-xl font-medium mb-2 text-center">{title}</h3>
      <p className="text-sm text-zinc-500 text-center">
        There&apos;s nothing to see here at the moment!
      </p>
    </div>
  )
}

export default NoProfilePosts
