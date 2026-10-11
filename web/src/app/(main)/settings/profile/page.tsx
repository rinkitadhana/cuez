"use client"

import { useState, useRef, ChangeEvent, useEffect } from "react"
import { useGoBack } from "@/hooks/useGoBack"
import { useGetMe } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import SafeImage from "@/components/media/SafeImage"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"
import MainWrapper from "@/layout/MainWrapper"
import { useUpdateUserProfile } from "@/hooks/useUser"
import PageHead from "@/components/pageComponents/PageHead"

interface UpdateProfileData {
  fullName: string
  bio: string
  link: string
  location: string
  profileImg?: string
  coverImg?: string
}

const ProfilePage = () => {
  const router = useRouter()
  const goBack = useGoBack("/settings")
  const { data: authUser, isLoading } = useGetMe()
  const { mutate: updateUserProfile, isPending: isUpdating } =
    useUpdateUserProfile()
  const [formData, setFormData] = useState<UpdateProfileData>({
    fullName: "",
    bio: "",
    link: "",
    location: "",
    profileImg: "",
    coverImg: "",
  })

  const [profileImgPreview, setProfileImgPreview] = useState<string | null>(
    null
  )
  const [coverImgPreview, setCoverImgPreview] = useState<string | null>(null)

  const profileImgRef = useRef<HTMLInputElement>(null)
  const coverImgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authUser?.user) {
      setFormData({
        fullName: authUser.user.fullName,
        bio: authUser.user.bio,
        link: authUser.user.link,
        location: authUser.user.location,
        profileImg: authUser.user.profileImg,
        coverImg: authUser.user.coverImg,
      })
      setProfileImgPreview(authUser.user.profileImg || null)
      setCoverImgPreview(authUser.user.coverImg || null)
    }
  }, [authUser])

  const updateProfile = () => {
    // Profile changes are applied optimistically, so go straight to it.
    updateUserProfile(formData)
    router.push(`/${authUser?.user?.username}`)
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "profileImg" | "coverImg"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      if (type === "profileImg") {
        setProfileImgPreview(base64String)
        setFormData((prev) => ({ ...prev, profileImg: base64String }))
      } else {
        setCoverImgPreview(base64String)
        setFormData((prev) => ({ ...prev, coverImg: base64String }))
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <MainWrapper>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-mainclr border-t-transparent"></div>
        </div>
      </MainWrapper>
    )
  }

  return (
    <MainWrapper>
      <PageHead title="Edit Profile / Cuez" />
      <div className="flex flex-col min-h-screen">
        <div className="flex sticky top-0 z-50 bg-bgClr items-center justify-between border-b border-zinc-700 px-4 h-[60px]">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 select-none hover:bg-zinc-800 rounded-xl w-fit cursor-pointer opacity-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold">Edit Profile</h1>
          </div>
          <button
            onClick={updateProfile}
            disabled={isUpdating}
            className="px-4 py-1 select-none bg-mainclr hover:bg-mainclr/80 disabled:bg-mainclr/50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors duration-200"
          >
            {isUpdating ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              "Save"
            )}
          </button>
        </div>

        <div className="relative mb-[80px] select-none">
          <div className="relative h-[200px] w-full">
            <SafeImage
              kind="cover"
              src={
                coverImgPreview ||
                authUser?.user?.coverImg ||
                "/img/cover/default.webp"
              }
              alt="Cover"
              fill
              className="object-cover bg-white"
            />
            <button
              onClick={() => coverImgRef.current?.click()}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-xl transition-colors duration-200"
            >
              <Camera size={26} />
            </button>
            <input
              ref={coverImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e, "coverImg")}
            />
          </div>

          <div className="absolute -bottom-[60px] left-5">
            <div className="relative h-[120px] w-[120px]">
              <SafeImage
                kind="avatar"
                src={
                  profileImgPreview ||
                  authUser?.user?.profileImg ||
                  "/img/pfp/default.webp"
                }
                alt="Profile"
                width={120}
                height={120}
                className="rounded-xl bg-white size-[120px] object-cover shadow-lg border-4 border-bgClr"
              />
              <button
                onClick={() => profileImgRef.current?.click()}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-xl transition-colors duration-200"
              >
                <Camera size={26} />
              </button>
              <input
                ref={profileImgRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, "profileImg")}
              />
            </div>
          </div>
        </div>

        <form className="flex flex-col px-6 pt-4  space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className=" text-sm font-medium">Full Name</label>
                <div className="flex flex-row border rounded-xl gap-3 py-2 px-4 border-zinc-500 focus-within:border-mainclr transition-colors duration-200">
                  <input
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full placeholder:text-zinc-500 bg-transparent outline-none placeholder:select-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Bio</label>
              <div className="flex flex-row border rounded-xl gap-3 py-2 px-4 border-zinc-500 focus-within:border-mainclr transition-colors duration-200">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full placeholder:text-zinc-500 bg-transparent outline-none placeholder:select-none resize-none min-h-[60px]"
                  placeholder="Tell us about yourself"
                  rows={1}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto"
                    e.currentTarget.style.height =
                      e.currentTarget.scrollHeight + "px"
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Location</label>
                <div className="flex flex-row border rounded-xl gap-3 py-2 px-4 border-zinc-500 focus-within:border-mainclr transition-colors duration-200">
                  <input
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full placeholder:text-zinc-500 bg-transparent outline-none placeholder:select-none"
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Website</label>
                <div className="flex flex-row border rounded-xl gap-3 py-2 px-4 border-zinc-500 focus-within:border-mainclr transition-colors duration-200">
                  <input
                    name="link"
                    type="text"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full placeholder:text-zinc-500 bg-transparent outline-none placeholder:select-none"
                    placeholder="Enter your website"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainWrapper>
  )
}

export default ProfilePage
