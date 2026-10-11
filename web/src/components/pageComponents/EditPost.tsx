"use client"
import { ImagePlus, LoaderCircle, SmilePlus, X } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { MdOutlineVideoCameraBack } from "react-icons/md"
import EmojiPicker from "emoji-picker-react"
import { Theme, EmojiStyle } from "emoji-picker-react"
import { useGetMe } from "@/hooks/useAuth"
import { useEditPost } from "@/hooks/usePost"
import { Post } from "@/types/Post"

const EditPost = ({ post }: { post: Post }) => {
  const [formData, setFormData] = useState<{
    text?: string
    img?: string
    video?: string
  }>({
    text: post.text || "",
    img: post.img || "",
    video: post.video || "",
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [emojiPosition, setEmojiPosition] = useState<"top" | "bottom">("bottom")
  const [selectedFiles, setSelectedFiles] = useState<{
    imageFile?: File
    videoFile?: File
  }>({})
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const warningRef = useRef<HTMLDivElement>(null)
  const { data: authUser } = useGetMe()
  const { mutate: editPost, isPending: isLoading } = useEditPost()

  const hasMedia = !!formData.img || !!formData.video
  const originalPost = {
    text: post.text || "",
    img: post.img || "",
    video: post.video || "",
  }
  const hasChanges =
    formData.text !== originalPost.text ||
    formData.img !== originalPost.img ||
    formData.video !== originalPost.video

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        if (hasChanges) {
          setShowWarning(true)
        } else {
          setIsModalOpen(false)
        }
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
      if (
        warningRef.current &&
        !warningRef.current.contains(event.target as Node)
      ) {
        setShowWarning(false)
      }
    }

    if (isModalOpen || showEmojiPicker || showWarning) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isModalOpen, showEmojiPicker, showWarning, formData, hasChanges])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const postData = { ...formData }

      if (selectedFiles.imageFile) {
        const base64Image = await convertFileToBase64(selectedFiles.imageFile)
        postData.img = base64Image
      }

      if (selectedFiles.videoFile) {
        const base64Video = await convertFileToBase64(selectedFiles.videoFile)
        postData.video = base64Video
      }

      // The edit is applied to the post immediately; reopen on failure.
      setIsModalOpen(false)
      setShowWarning(false)
      editPost(
        { postId: post._id, postData },
        { onError: () => setIsModalOpen(true) }
      )
    } catch (error) {
      console.error("Error processing files:", error)
    }
  }

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setFormData((prev) => ({
      ...prev,
      text: (prev.text || "") + emojiObject.emoji,
    }))
  }

  const handleDiscard = () => {
    setIsModalOpen(false)
    setShowWarning(false)
  }

  const handleCancel = () => {
    setShowWarning(false)
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
    e.stopPropagation()

    if (!showEmojiPicker) {
      if (emojiPickerRef.current) {
        const rect = emojiPickerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceNeeded = 400

        if (spaceBelow < spaceNeeded) {
          setEmojiPosition("top")
        } else {
          setEmojiPosition("bottom")
        }
      }
    }

    setShowEmojiPicker(!showEmojiPicker)
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsModalOpen(true)
        }}
        className="py-1 px-3 text-left hover:bg-zinc-700 rounded-lg transition-all duration-200 w-full"
      >
        Edit post
      </button>

      {isModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="fixed inset-0 bg-bgClr/50 backdrop-blur-sm flex justify-center z-[100] py-10"
        >
          <div
            ref={modalRef}
            className="bg-bgClr border border-zinc-700 w-full max-w-[600px] rounded-xl p-4 h-fit"
          >
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex justify-between items-center sticky top-0 bg-bgClr z-10 py-2">
                <Image
                  src={authUser?.user.profileImg || "/img/pfp/default.webp"}
                  alt="profile"
                  width={32}
                  height={32}
                  className="rounded-lg size-9 select-none"
                />
                <div className="flex gap-2 items-center">
                  <button
                    type="submit"
                    disabled={
                      (!formData.text?.trim() &&
                        !formData.img &&
                        !formData.video) ||
                      isLoading ||
                      !hasChanges
                    }
                    className="px-4 py-1 bg-mainclr text-white font-semibold rounded-xl hover:bg-mainclr/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-4">
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    <div>
                      <textarea
                        value={formData.text}
                        name="text"
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                          e.target.style.height = "auto"
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder="What's happening?"
                        className="w-full bg-transparent border-none outline-none resize-none text-lg placeholder:text-zinc-500 min-h-[120px]"
                        rows={3}
                        autoFocus
                        onFocus={(e) => {
                          const value = e.target.value
                          e.target.value = ""
                          e.target.value = value
                        }}
                      />
                    </div>
                    {(formData.img || formData.video) && (
                      <div className="relative w-full">
                        <div className="relative">
                          {formData.img ? (
                            <Image
                              src={formData.img}
                              alt="Selected image"
                              className="w-full h-auto max-h-[400px] object-contain rounded-2xl border border-zinc-800 bg-zinc-900"
                              width={0}
                              height={0}
                              sizes="600px"
                            />
                          ) : (
                            <video
                              src={formData.video}
                              controls
                              className="w-full max-h-[400px] rounded-2xl border border-zinc-800 bg-black"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearMedia()
                            }}
                            className="absolute top-2 right-2 bg-black/50 text-white px-2 py-2 rounded-full hover:bg-black/70 transition-all duration-200"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                          1/1
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sticky bottom-0 bg-bgClr z-10 py-2">
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
                          size={20}
                          className={hasMedia ? "opacity-50" : ""}
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
                          size={22}
                          className={hasMedia ? "opacity-50" : ""}
                        />
                      </label>
                      <div
                        ref={emojiPickerRef}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleEmojiPicker(e)
                        }}
                        className={`${
                          showEmojiPicker
                            ? "bg-zinc-700 cursor-not-allowed"
                            : "hover:bg-zinc-700 bg-zinc-800 "
                        } p-1.5 rounded-xl transition-all duration-200 border border-zinc-700  cursor-pointer`}
                      >
                        <SmilePlus size={20} />
                        {showEmojiPicker && (
                          <div
                            className={`absolute ${
                              emojiPosition === "bottom"
                                ? "top-full mt-2"
                                : "bottom-full mb-2"
                            } left-0 z-20`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EmojiPicker
                              onEmojiClick={onEmojiClick}
                              theme={Theme.DARK}
                              searchPlaceholder="Search emoji..."
                              width={350}
                              height={400}
                              emojiStyle={EmojiStyle.NATIVE}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWarning && (
        <div
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="fixed inset-0 bg-bgClr/50 backdrop-blur-sm flex justify-center items-center z-[10000]"
        >
          <div
            ref={warningRef}
            className="bg-bgClr border border-zinc-700 w-full max-w-[400px] rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Discard changes?</h2>
            <p className="text-zinc-400 mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancel()
                }}
                className="px-4 py-1.5 rounded-xl font-semibold hover:bg-zinc-800 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDiscard()
                }}
                className="px-4 py-1.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EditPost
