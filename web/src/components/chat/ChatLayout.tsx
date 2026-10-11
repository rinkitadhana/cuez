"use client"
import { MessageSquarePlus } from "lucide-react"
import { Suspense, useState } from "react"
import PageHead from "@/components/pageComponents/PageHead"
import ConversationList from "./ConversationList"
import ChatThread from "./ChatThread"
import NewMessageModal from "./NewMessageModal"

// Two panes on desktop (list + thread, like X). On mobile it's one or the
// other: the list at /chat, a full-screen thread at /chat/[id].
const ChatLayout = ({ conversationId }: { conversationId: string | null }) => {
  const [isNewOpen, setIsNewOpen] = useState(false)
  return (
    <>
      <PageHead title="Messages / Cuez" />
      <div className="flex h-full min-h-0">
        <div
          className={`${
            conversationId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-[320px] lg:w-[360px] shrink-0 md:border-r md:border-zinc-700 min-h-0`}
        >
          <ConversationList activeId={conversationId} />
        </div>
        <div
          className={`${
            conversationId ? "flex" : "hidden md:flex"
          } flex-col flex-1 min-w-0 min-h-0`}
        >
          {conversationId ? (
            <Suspense>
              <ChatThread
                key={conversationId}
                conversationId={conversationId}
              />
            </Suspense>
          ) : (
            <div className="flex flex-col items-start justify-center h-full max-w-sm mx-auto gap-2 px-8">
              <h2 className="text-3xl font-bold">Select a message</h2>
              <p className="text-zinc-400">
                Choose from your existing conversations, start a new one, or
                just keep swimming.
              </p>
              <button
                onClick={() => setIsNewOpen(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/85 transition-colors"
              >
                <MessageSquarePlus className="size-5" /> New message
              </button>
            </div>
          )}
        </div>
      </div>
      <NewMessageModal open={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </>
  )
}

export default ChatLayout
