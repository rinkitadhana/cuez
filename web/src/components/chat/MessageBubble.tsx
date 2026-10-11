"use client"
import { useEffect, useRef, useState } from "react"
import { Reply, SmilePlus, Trash2 } from "lucide-react"
import SafeImage from "@/components/media/SafeImage"
import MediaLightbox from "@/components/media/MediaLightbox"
import { ChatMessage } from "@/types/Chat"
import { formatMessageTime } from "@/lib/chatTime"

export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"]

const replySnippet = (reply: NonNullable<ChatMessage["replyTo"]>) =>
  reply.deleted ? "Message deleted" : reply.text || (reply.img ? "Photo" : "")

const MessageBubble = ({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  otherName,
  meId,
  footer,
  onReply,
  onReact,
  onUnsend,
  highlighted = false,
}: {
  message: ChatMessage
  // Briefly ringed after jumping here from search.
  highlighted?: boolean
  isMine: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
  otherName: string
  meId?: string
  // Status/time line shown under the bubble (e.g. "Seen", "Failed").
  footer?: React.ReactNode
  onReply: () => void
  onReact: (emoji: string) => void
  onUnsend: () => void
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pending = !!message.status

  // Tap elsewhere to dismiss (touch devices have no hover).
  useEffect(() => {
    if (!showActions && !showReactions) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setShowActions(false)
        setShowReactions(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
    }
  }, [showActions, showReactions])

  const myReaction = message.reactions.find((r) => r.user === meId)?.emoji
  const reactionCounts = message.reactions.reduce<Record<string, number>>(
    (acc, r) => ((acc[r.emoji] = (acc[r.emoji] || 0) + 1), acc),
    {}
  )

  // Rounded like X: the tail corner is tight, and so is the corner joining
  // a bubble to the one above it in the same group.
  const corners = isMine
    ? `rounded-2xl rounded-br-md ${isFirstInGroup ? "" : "rounded-tr-md"}`
    : `rounded-2xl rounded-bl-md ${isFirstInGroup ? "" : "rounded-tl-md"}`

  const actions = !message.deleted && !pending && (
    <div
      className={`relative flex items-center gap-0.5 self-center transition-opacity ${
        showActions || showReactions
          ? "opacity-100"
          : "opacity-0 group-hover/msg:opacity-100"
      }`}
    >
      <button
        onClick={() => setShowReactions((v) => !v)}
        aria-label="React"
        className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
      >
        <SmilePlus className="size-4" />
      </button>
      <button
        onClick={() => {
          onReply()
          setShowActions(false)
        }}
        aria-label="Reply"
        className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
      >
        <Reply className="size-4" />
      </button>
      {isMine && (
        <button
          onClick={() => {
            onUnsend()
            setShowActions(false)
          }}
          aria-label="Unsend"
          title="Unsend"
          className="p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
        >
          <Trash2 className="size-4" />
        </button>
      )}
      {showReactions && (
        <div
          className={`absolute bottom-full mb-1 ${
            isMine ? "right-0" : "left-0"
          } z-20 flex items-center gap-0.5 rounded-full border border-zinc-700 bg-zinc-900 px-1.5 py-1 shadow-xl shadow-black/40`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji)
                setShowReactions(false)
                setShowActions(false)
              }}
              className={`size-8 rounded-full text-lg leading-none hover:bg-zinc-800 hover:scale-110 transition-transform ${
                myReaction === emoji ? "bg-zinc-700" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div
      ref={ref}
      id={`msg-${message._id}`}
      className={`group/msg flex flex-col rounded-2xl transition-colors duration-700 ${
        isMine ? "items-end" : "items-start"
      } ${isFirstInGroup ? "mt-3" : "mt-0.5"} ${
        highlighted ? "bg-mainclr/15 ring-1 ring-mainclr/40" : ""
      }`}
    >
      {message.replyTo && (
        <div
          className={`flex flex-col max-w-[75%] mb-0.5 ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          <span className="text-xs text-zinc-500 px-1 mb-0.5">
            {isMine ? "You" : otherName} replied to{" "}
            {message.replyTo.sender === meId
              ? isMine
                ? "yourself"
                : "you"
              : isMine
              ? otherName
              : "themselves"}
          </span>
          <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-1.5 line-clamp-2 break-words">
            {replySnippet(message.replyTo)}
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-1 max-w-full ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          onClick={() => setShowActions((v) => !v)}
          className={`relative max-w-[min(75vw,28rem)] ${
            pending ? "opacity-70" : ""
          }`}
        >
          {message.deleted ? (
            <div
              className={`${corners} px-3.5 py-2 text-sm italic text-zinc-500 border border-zinc-800`}
            >
              {isMine ? "You unsent a message" : "Message deleted"}
            </div>
          ) : (
            <div className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
              {message.img && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!pending) setLightboxOpen(true)
                  }}
                  className="block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                >
                  <SafeImage
                    src={message.img}
                    alt="Photo"
                    width={0}
                    height={0}
                    sizes="320px"
                    className="w-auto h-auto max-w-[min(70vw,18rem)] max-h-80 object-cover"
                  />
                </button>
              )}
              {message.text && (
                <div
                  className={`${corners} px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words ${
                    isMine ? "bg-mainclr text-white" : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          )}

          {Object.keys(reactionCounts).length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (myReaction) onReact(myReaction)
              }}
              title={myReaction ? "Remove your reaction" : undefined}
              className={`absolute -bottom-3 ${
                isMine ? "right-2" : "left-2"
              } flex items-center gap-0.5 rounded-full border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-xs`}
            >
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji}>
                  {emoji}
                  {count > 1 && <span className="ml-0.5 text-zinc-400">{count}</span>}
                </span>
              ))}
            </button>
          )}
        </div>
        {actions}
      </div>

      {(footer || isLastInGroup) && (
        <div
          className={`text-xs text-zinc-500 px-1 ${
            Object.keys(reactionCounts).length ? "mt-4" : "mt-1"
          }`}
        >
          {footer ?? formatMessageTime(message.createdAt)}
        </div>
      )}
      {!footer && !isLastInGroup && Object.keys(reactionCounts).length > 0 && (
        <div className="h-3" />
      )}

      {message.img && (
        <MediaLightbox
          src={message.img}
          alt="Photo"
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}

export default MessageBubble
