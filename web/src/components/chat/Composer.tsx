"use client"
import { useEffect, useRef, useState } from "react"
import { ImagePlus, SendHorizontal, SmilePlus, X } from "lucide-react"
import SafeImage from "@/components/media/SafeImage"
import EmojiPickerPortal from "@/components/pageComponents/EmojiPickerPortal"
import useMessageStore from "@/store/messageStore"
import { getSocket } from "@/lib/socket"
import { ChatMessage } from "@/types/Chat"
import { SendMessageInput } from "@/hooks/useChat"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const TYPING_PING_MS = 2500

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const Composer = ({
  conversationId,
  replyTo,
  replyToName,
  onCancelReply,
  onSend,
}: {
  conversationId: string
  replyTo: ChatMessage | null
  replyToName: string
  onCancelReply: () => void
  onSend: (input: Omit<SendMessageInput, "clientId">) => void
}) => {
  const { setMessage } = useMessageStore()
  const [text, setText] = useState("")
  const [img, setImg] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const lastTypingPing = useRef(0)

  // Fresh draft per conversation.
  useEffect(() => {
    setText("")
    setImg(null)
    textareaRef.current?.focus()
  }, [conversationId])

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  useEffect(() => {
    if (!showEmoji) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !emojiPickerRef.current?.contains(target) &&
        !emojiButtonRef.current?.contains(target)
      ) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [showEmoji])

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const pingTyping = () => {
    const now = Date.now()
    if (now - lastTypingPing.current < TYPING_PING_MS) return
    lastTypingPing.current = now
    getSocket().emit("chat:typing", { conversationId })
  }

  const canSend = !!text.trim() || !!img

  const send = () => {
    if (!canSend) return
    onSend({ text: text.trim() || undefined, img: img || undefined, replyTo })
    setText("")
    setImg(null)
    onCancelReply()
    lastTypingPing.current = 0
    requestAnimationFrame(resize)
  }

  const pickImage = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("Only images can be sent", "error")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage("Image must be under 8MB", "error")
      return
    }
    setImg(await toDataUrl(file))
    textareaRef.current?.focus()
  }

  return (
    <div className="shrink-0 border-t border-zinc-700 bg-bgClr px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      {replyTo && (
        <div className="flex items-start gap-2 mb-2 px-1">
          <div className="flex-1 min-w-0 border-l-2 border-mainclr pl-2">
            <p className="text-xs font-semibold text-zinc-300">
              Replying to {replyToName}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {replyTo.text || (replyTo.img ? "Photo" : "")}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="p-1 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {img && (
        <div className="relative w-fit mb-2 ml-1">
          <SafeImage
            src={img}
            alt="Selected image"
            width={0}
            height={0}
            sizes="200px"
            className="w-auto h-auto max-h-40 max-w-[12rem] rounded-xl border border-zinc-800 object-cover"
          />
          <button
            onClick={() => setImg(null)}
            aria-label="Remove image"
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-black"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1 rounded-2xl bg-zinc-800/80 border border-zinc-700 focus-within:border-zinc-500 px-1.5 py-1 transition-colors">
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Add photo"
          className="p-2 rounded-full text-mainclr hover:bg-mainclr/15 shrink-0"
        >
          <ImagePlus className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickImage(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        <button
          ref={emojiButtonRef}
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Add emoji"
          className="p-2 rounded-full text-mainclr hover:bg-mainclr/15 shrink-0 hidden sm:block"
        >
          <SmilePlus className="size-5" />
        </button>
        <EmojiPickerPortal
          isOpen={showEmoji}
          onClose={() => setShowEmoji(false)}
          onEmojiClick={({ emoji }) => {
            setText((t) => t + emoji)
            textareaRef.current?.focus()
          }}
          buttonRef={emojiButtonRef}
          pickerRef={emojiPickerRef}
          position="top"
        />
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            resize()
            if (e.target.value) pingTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              send()
            }
            if (e.key === "Escape" && replyTo) onCancelReply()
          }}
          onPaste={(e) => {
            const file = Array.from(e.clipboardData.files).find((f) =>
              f.type.startsWith("image/")
            )
            if (file) {
              e.preventDefault()
              pickImage(file)
            }
          }}
          placeholder="Start a new message"
          maxLength={10000}
          className="flex-1 resize-none bg-transparent px-1.5 py-2 text-[15px] leading-snug placeholder:text-zinc-500 focus:outline-none max-h-40 scrollbar-hide"
        />
        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send"
          className="p-2 rounded-full text-mainclr hover:bg-mainclr/15 disabled:text-zinc-600 disabled:hover:bg-transparent shrink-0 transition-colors"
        >
          <SendHorizontal className="size-5" />
        </button>
      </div>
    </div>
  )
}

export default Composer
