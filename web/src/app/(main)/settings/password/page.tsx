"use client"

import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  LoaderCircle,
  Shield,
} from "lucide-react"
import MainWrapper from "@/layout/MainWrapper"
import Header from "../settingComponent/Header"
import { useUpdateUserProfile } from "@/hooks/useUser"
import Input from "@/components/Input"
import useMessageStore from "@/store/messageStore"
import PageHead from "@/components/pageComponents/PageHead"

const PasswordPage = () => {
  const { setMessage } = useMessageStore()
  const { mutate: updateUserProfile, isPending: isUpdating } =
    useUpdateUserProfile()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  const [currentPasswordError, setCurrentPasswordError] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState(false)

  useEffect(() => {
    if (newPassword && confirmPassword) {
      setPasswordsMatch(newPassword === confirmPassword)
    } else {
      setPasswordsMatch(true)
    }
  }, [newPassword, confirmPassword])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate form
    let hasError = false

    if (!currentPassword) {
      setCurrentPasswordError(true)
      hasError = true
    }

    if (!newPassword) {
      setNewPasswordError(true)
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError(true)
      hasError = true
    }

    if (!passwordsMatch) {
      setMessage("New passwords don't match!", "error")
      hasError = true
    }

    if (hasError) return

    // Submit form
    updateUserProfile({
      currentPassword,
      newPassword,
    })
  }

  return (
    <MainWrapper>
      <PageHead title="Password / Cuez" />
      <Header title="Password" />

      <div className="flex flex-col p-4">
        <div className="bg-zinc-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} className="text-mainclr" />
            <h2 className="font-semibold">Password Security</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Protect your account with a strong password. For maximum security,
            use a unique password that you don&apos;t use for other accounts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            text="Current Password"
            type="password"
            value={currentPassword}
            error={currentPasswordError}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setCurrentPasswordError(false)
            }}
            ficon={<Lock strokeWidth={1.5} />}
            licon1={<Eye strokeWidth={1.5} />}
            licon2={<EyeOff strokeWidth={1.5} />}
          />

          <Input
            text="New Password"
            type="password"
            value={newPassword}
            error={newPasswordError}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setNewPasswordError(false)
            }}
            ficon={<LockKeyhole strokeWidth={1.5} />}
            licon1={<Eye strokeWidth={1.5} />}
            licon2={<EyeOff strokeWidth={1.5} />}
          />

          <Input
            text="Confirm New Password"
            type="password"
            value={confirmPassword}
            error={confirmPasswordError || !passwordsMatch}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setConfirmPasswordError(false)
            }}
            ficon={<LockKeyhole strokeWidth={1.5} />}
            licon1={<Eye strokeWidth={1.5} />}
            licon2={<EyeOff strokeWidth={1.5} />}
          />

          {!passwordsMatch && (
            <p className="text-red-500 text-sm -mt-2">
              Passwords don&apos;t match
            </p>
          )}

          <div className="flex items-center mt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className=" text-center  bg-mainclr hover:bg-mainclr/70 cursor-pointer transition duration-200 rounded-xl flex items-center select-none font-semibold justify-center py-2 px-4"
            >
              {isUpdating ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-zinc-700 pt-6">
          <h3 className="font-semibold mb-2">Password Requirements</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Include at least one uppercase letter</li>
            <li>• Include at least one number</li>
            <li>• Include at least one special character</li>
          </ul>
        </div>
      </div>
    </MainWrapper>
  )
}

export default PasswordPage
