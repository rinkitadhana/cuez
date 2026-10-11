"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import config from "@/config/config"
import { useGoBack } from "@/hooks/useGoBack"
import { useRouter } from "next/navigation"
import { AtSign, Check, Info, LoaderCircle, UserRound } from "lucide-react"
import MainWrapper from "@/layout/MainWrapper"
import Header from "../settingComponent/Header"
import { useGetMe } from "@/hooks/useAuth"
import { useUpdateUserProfile } from "@/hooks/useUser"
import PageHead from "@/components/pageComponents/PageHead"

const HandlePage = () => {
  const router = useRouter()
  const goBack = useGoBack("/settings")
  const { data: authUser } = useGetMe()
  const { mutate: updateUserProfile, isPending: isUpdating } =
    useUpdateUserProfile()

  const [username, setUsername] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")
  const [error, setError] = useState("")
  const [isAvailable, setIsAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    if (authUser?.user) {
      setUsername(authUser.user.username)
      setOriginalUsername(authUser.user.username)
    }

    // Set base URL safely on client side
    setBaseUrl(window.location.origin)
  }, [authUser])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setUsername(value)
    setError("")
    setIsAvailable(false)
  }

  // Ask the server (format, reserved names, taken) shortly after typing stops.
  const latestCheck = useRef("")
  const checkUsernameAvailability = async (value = username) => {
    latestCheck.current = value
    if (!value) {
      setError("Username cannot be empty")
      return false
    }
    if (value === originalUsername) {
      setIsAvailable(true)
      return true
    }
    setIsChecking(true)
    try {
      const { data } = await axios.get<{ available: boolean; message: string }>(
        `${config.backendUrl}/user/username-available`,
        { params: { username: value }, withCredentials: true }
      )
      // Ignore answers for something the user has since changed.
      if (latestCheck.current !== value) return false
      setIsAvailable(data.available)
      setError(data.available ? "" : data.message)
      return data.available
    } catch {
      setError("Couldn't check this username. Try again.")
      return false
    } finally {
      if (latestCheck.current === value) setIsChecking(false)
    }
  }

  useEffect(() => {
    if (!username || username === originalUsername) {
      setIsChecking(false)
      return
    }
    const timer = setTimeout(() => checkUsernameAvailability(username), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, originalUsername])

  const updateUsername = async () => {
    if (username === originalUsername) {
      goBack()
      return
    }
    if (!isAvailable && !(await checkUsernameAvailability())) return

    updateUserProfile(
      { username },
      {
        onSuccess: () => {
          router.push(`/${username}`)
        },
      }
    )
  }

  return (
    <MainWrapper>
      <PageHead title="Handle / Cuez" />
      <Header title="Username" />

      <div className="flex flex-col px-6 py-4">
        <div className="mb-5">
          <h2 className="text-xl font-semibold mb-2">Update your username</h2>
          <p className="text-zinc-400 text-sm">
            Your @username is unique and appears in your profile URL. It helps
            people find and mention you.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Username</label>
            <div
              className={`flex flex-row border rounded-xl gap-3 py-2 px-4 ${
                error
                  ? "border-red-500"
                  : "border-zinc-500 focus-within:border-mainclr"
              } transition-colors duration-200`}
            >
              <AtSign size={20} className="text-zinc-500" />
              <input
                name="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                maxLength={20}
                className="w-full placeholder:text-zinc-500 bg-transparent outline-none placeholder:select-none"
                placeholder="Choose a username"
              />
              {isChecking && (
                <LoaderCircle size={20} className="animate-spin" />
              )}
              {isAvailable && !isChecking && (
                <Check size={20} className="text-green-500" />
              )}
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-1 text-red-500 text-sm">
                <Info size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <div className="flex items-start gap-2">
              <UserRound size={20} className="mt-0.5 text-zinc-400" />
              <div>
                <h3 className="font-semibold">Username requirements</h3>
                <ul className="text-sm text-zinc-400 mt-1 space-y-1">
                  <li>• Only letters, numbers, and underscores</li>
                  <li>• 3 to 20 characters</li>
                  <li>• Cannot contain spaces or special characters</li>
                  <li>• Must be unique</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 select-none mt-2">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl border font-semibold border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={updateUsername}
              disabled={isUpdating || isChecking || !!error || !username}
              className={`px-4 py-2 rounded-xl font-semibold flex items-center justify-center min-w-20 ${
                isUpdating || isChecking || !!error || !username
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-mainclr hover:bg-mainclr/80"
              } transition-colors`}
            >
              {isUpdating ? (
                <LoaderCircle size={23} className="animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>

          <div className="pt-6 border-t border-zinc-700 mt-4">
            <h3 className="font-medium mb-3">Your profile URL</h3>
            <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700 text-zinc-400 text-sm break-all">
              {baseUrl}/{username}
            </div>
          </div>
        </div>
      </div>
    </MainWrapper>
  )
}

export default HandlePage
