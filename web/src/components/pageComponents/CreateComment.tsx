import { ImagePlus, Loader2, SmilePlus, X } from "lucide-react"
import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useGetMe } from "@/hooks/useAuth"
import { MdOutlineVideoCameraBack } from "react-icons/md"
import EmojiPickerPortal from "./EmojiPickerPortal"
import { useCreateReply } from "@/hooks/usePost"
import { useParams } from "next/navigation"
import useMessageStore from "@/store/messageStore"
import { useRequireAuth } from "@/hooks/useRequireAuth"

const CreateComment = ({ commentActive }: { commentActive: boolean }) => {
  const { data: authUser } = useGetMe()
  const { isLoggedIn, requireAuth } = useRequireAuth()
  const { mutate: createReply, isPending: isReplyPending } = useCreateReply()
  const { setMessage } = useMessageStore()
  const [formData, setFormData] = useState<{
    text?: string
    img?: string
    video?: string
  }>({
    text: "",
    img: "",
    video: "",
  })
  const { id: postId } = useParams()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiPosition, setEmojiPosition] = useState<"top" | "bottom">("bottom")
  const [selectedFiles, setSelectedFiles] = useState<{
    imageFile?: File
    videoFile?: File
  }>({})
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasMedia = !!formData.img || !!formData.video

  useEffect(() => {
    if (commentActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [commentActive])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't do anything if the emoji button was clicked
      if (
        emojiButtonRef.current === event.target ||
        emojiButtonRef.current?.contains(event.target as Node)
      ) {
        return
      }

      // Check if the click is inside the emoji picker
      const emojiPickerElement = document.querySelector(
        '[data-name="emoji-picker"]'
      )
      if (
        emojiPickerElement &&
        emojiPickerElement.contains(event.target as Node)
      ) {
        return
      }

      // Close the picker if clicked elsewhere
      setShowEmojiPicker(false)
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmitReply = async () => {
    if (!formData.text && !formData.img && !formData.video) {
      setMessage("Please add some content to your reply", "error")
      return
    }

    try {
      const replyData = { ...formData }

      if (selectedFiles.imageFile) {
        const base64Image = await convertFileToBase64(selectedFiles.imageFile)
        replyData.img = base64Image
      }
      if (selectedFiles.videoFile) {
        const base64Video = await convertFileToBase64(selectedFiles.videoFile)
        replyData.video = base64Video
      }

      // The reply shows up in the list right away, so clear the box now and
      // put the draft back if the server rejects it.
      const draft = { formData, selectedFiles }
      setFormData({ text: "", img: "", video: "" })
      setSelectedFiles({})
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
      createReply(
        { postData: replyData, parentId: postId as string },
        {
          onError: () => {
            setFormData(draft.formData)
            setSelectedFiles(draft.selectedFiles)
          },
        }
      )
    } catch (error) {
      setMessage(`Failed to upload media ${error}`, "error")
    }
  }

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setFormData((prev) => ({
      ...prev,
      text: (prev.text || "") + emojiObject.emoji,
    }))
  }

  const clearMedia = () => {
    setFormData((prev) => ({
      ...prev,
      img: "",
      video: "",
    }))
    setSelectedFiles({})
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFiles({ imageFile: file })
      setFormData((prev) => ({
        ...prev,
        img: URL.createObjectURL(file),
        video: "",
      }))
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFiles({ videoFile: file })
      setFormData((prev) => ({
        ...prev,
        video: URL.createObjectURL(file),
        img: "",
      }))
    }
  }

  const toggleEmojiPicker = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (showEmojiPicker) {
      setShowEmojiPicker(false)
      return
    }

    // Only calculate position when opening
    if (emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceNeeded = 400

      if (spaceBelow < spaceNeeded) {
        setEmojiPosition("top")
      } else {
        setEmojiPosition("bottom")
      }
    }

    setShowEmojiPicker(true)
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-between gap-3 p-4 border-y bg-zinc-800/20 border-zinc-700 w-full">
        <p className="text-sm text-zinc-400">Log in to join the conversation.</p>
        <button
          onClick={() => requireAuth("comment")}
          className="px-4 py-1.5 rounded-xl bg-mainclr text-white text-sm font-semibold hover:bg-mainclr/80 transition-all duration-200"
        >
          Reply
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-5 p-4 border-y bg-zinc-800/20 border-zinc-700 w-full">
      <div className="flex items-center justify-between w-full">
        <Image
          src={authUser?.user.profileImg || ""}
          alt="user avatar"
          width={32}
          height={32}
          className="rounded-xl size-9 select-none object-cover bg-white"
        />
      </div>

      <form className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-3">
          <textarea
            id="comment-input"
            ref={textareaRef}
            value={formData.text || ""}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, text: e.target.value }))
              // Auto-resize the textarea
              e.target.style.height = "auto"
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            className="w-full bg-transparent border border-gray-600 rounded-lg px-2 py-2 focus:outline-none resize-none scrollbar-hide"
            placeholder="Post your reply..."
            rows={2}
          />

          {hasMedia && (
            <div className="relative mt-2">
              {formData.img && (
                <div className="relative rounded-lg overflow-hidden">
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 bg-black rounded-full p-1 z-10"
                  >
                    <X className="size-5" />
                  </button>
                  <Image
                    src={formData.img}
                    alt="Selected image"
                    width={0}
                    height={0}
                    sizes="600px"
                    className="w-full h-auto max-h-[300px] object-contain rounded-2xl border border-zinc-800 bg-zinc-900"
                  />
                </div>
              )}
              {formData.video && (
                <div className="relative rounded-lg overflow-hidden">
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 z-10"
                  >
                    <X className="size-5" />
                  </button>
                  <video
                    src={formData.video}
                    controls
                    className="w-full max-h-[300px] rounded-2xl border border-zinc-800 bg-black"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2.5 text-zinc-100">
            <label
              className={`p-1.5 ${
                hasMedia
                  ? " bg-zinc-700 cursor-not-allowed"
                  : "hover:bg-zinc-700 bg-zinc-800 "
              } rounded-xl transition-all duration-200 border border-zinc-700  cursor-pointer`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={hasMedia}
              />
              <ImagePlus
                size={18}
                className={hasMedia ? "opacity-50" : ""}
                aria-label="Add image"
              />
            </label>

            <label
              className={`p-1.5 ${
                hasMedia
                  ? " bg-zinc-700 cursor-not-allowed"
                  : "hover:bg-zinc-700 bg-zinc-800 "
              } rounded-xl transition-all duration-200 border border-zinc-700  cursor-pointer`}
            >
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
                disabled={hasMedia}
              />
              <MdOutlineVideoCameraBack
                size={18}
                className={hasMedia ? "opacity-50" : ""}
                aria-label="Add video"
              />
            </label>

            <button
              ref={emojiButtonRef}
              onClick={toggleEmojiPicker}
              type="button"
              className={`${
                showEmojiPicker
                  ? "bg-zinc-700 cursor-not-allowed"
                  : "hover:bg-zinc-700 bg-zinc-800 "
              } p-1.5 rounded-xl transition-all duration-200 border border-zinc-700  cursor-pointer`}
            >
              <SmilePlus size={18} />
              {showEmojiPicker && (
                <EmojiPickerPortal
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  position={emojiPosition}
                  onEmojiClick={onEmojiClick}
                  buttonRef={emojiButtonRef}
                />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmitReply}
            disabled={isReplyPending || (!formData.text && !hasMedia)}
            className={`flex gap-1 items-center px-4 py-1.5 rounded-xl font-semibold ${
              isReplyPending || (!formData.text && !hasMedia)
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-mainclr text-white hover:bg-mainclr/80 transition-colors"
            }`}
          >
            {isReplyPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Reply"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateComment
