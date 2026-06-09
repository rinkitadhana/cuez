"use client"
import Input from "@/components/Input"
import PageHead from "@/components/pageComponents/PageHead"
import { useResetPassword, useSendOtp, useVerifyOtp } from "@/hooks/useAuth"
import Footer from "@/layout/Footer"
import useMessageStore from "@/store/messageStore"
import {
  Eye,
  EyeOff,
  Hash,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const ForgotPassword = () => {
  const { setMessage } = useMessageStore()
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true)
  const [otp, setOtp] = useState<string>("")
  const [timer, setTimer] = useState<number>(0)
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<boolean>(false)
  const [otpError, setOtpError] = useState<boolean>(false)
  const [token, setToken] = useState<string>("")
  const [otpVerified, setOtpVerified] = useState<boolean>(false)

  const isLoggingIn = false
  const { mutate: sendOtp } = useSendOtp()
  const { mutate: verifyOtp } = useVerifyOtp()
  const { mutate: resetPassword } = useResetPassword()

  const handleSendOTP = () => {
    if (email == "") {
      setEmailError(true)
      setTimeout(() => {
        setEmailError(false)
      }, 5000)
    } else {
      setIsButtonDisabled(true)
      setEmailError(false)
      setTimer(30)
      sendOtp(email, {
        onError: () => {
          setIsButtonDisabled(false)
        },
      })
    }
  }

  const handleVerifyOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (email == "") {
      setEmailError(true)
      setTimeout(() => {
        setEmailError(false)
      }, 5000)
    }
    if (otp == "") {
      setOtpError(true)
      setTimeout(() => {
        setOtpError(false)
      }, 5000)
    }
    verifyOtp(
      { email, otp },
      {
        onSuccess: (data) => {
          setToken(data.token)
          setOtpVerified(true)
        },
      }
    )
  }

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password == "") {
      setPasswordError(true)
      setTimeout(() => {
        setPasswordError(false)
      }, 5000)
    }
    if (confirmPassword == "") {
      setPasswordError(true)
      setTimeout(() => {
        setPasswordError(false)
      }, 5000)
    }
    if (!passwordsMatch) {
      setMessage("Password doesn't match!", "error")
      return
    }
    resetPassword({ password, token })
  }

  const formatTimer = (time: number): string => {
    return time < 10 ? `0${time}` : `${time}`
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          const newTimer = prevTimer - 1
          return newTimer
        })
      }, 1000)
    } else {
      setIsButtonDisabled(false)
    }
    return () => clearInterval(interval)
  }, [timer])

  useEffect(() => {
    if (password) {
      if (confirmPassword) {
        setPasswordsMatch(password === confirmPassword)
      } else {
        setPasswordsMatch(false)
      }
    } else {
      setPasswordsMatch(true)
    }
  }, [password, confirmPassword])

  return (
    <section className="flex flex-col py-4 h-screen">
      <PageHead title="Forgot Password / Cuez" />
      <div className="flex-grow sin-screen ">
        {otpVerified ? (
          <form className=" flex flex-col gap-6" onSubmit={handleResetPassword}>
            <div className=" flex flex-col gap-4">
              <Image
                className=" h-auto w-[200px] select-none"
                src="/img/icon/cuez-name.png"
                width={500}
                height={150}
                priority
                alt="company_logo"
              />
              {/* <h1 className=" text-mainclr text-5xl font-bold">Cuez</h1> */}
              <p>Please enter a new password and confirm it to continue.</p>
            </div>
            <div className=" flex flex-col gap-4">
              <Input
                text="Password"
                type="password"
                value={password}
                error={passwordError}
                onChange={(e) => setPassword(e.target.value)}
                ficon={<LockKeyhole strokeWidth={1.5} />}
                licon1={<Eye strokeWidth={1.5} />}
                licon2={<EyeOff strokeWidth={1.5} />}
              />
              <Input
                text="Confirm password"
                type="password"
                value={confirmPassword}
                error={!passwordsMatch || passwordError}
                onChange={(e) => setConfirmPassword(e.target.value)}
                ficon={<LockKeyhole strokeWidth={1.5} />}
                licon1={<Eye strokeWidth={1.5} />}
                licon2={<EyeOff strokeWidth={1.5} />}
              />
            </div>
            <div className=" flex flex-col gap-4">
              <button disabled={isLoggingIn} className="blue-btn" type="submit">
                {isLoggingIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin" />
                  </div>
                ) : (
                  "Reset password"
                )}
              </button>{" "}
              <div className="  flex justify-end">
                <Link
                  href="/login"
                  className=" text-mainclr hover:text-mainclr/80 transition duration-200 cursor-pointer"
                >
                  Back to Log in
                </Link>
              </div>
            </div>
          </form>
        ) : (
          <form className=" flex flex-col gap-6" onSubmit={handleVerifyOtp}>
            <div className=" flex flex-col gap-4">
              <Image
                className=" h-auto w-[200px] select-none"
                src="/img/icon/cuez-name.png"
                width={500}
                height={150}
                priority
                alt="company_logo"
              />
              {/* <h1 className=" text-mainclr text-5xl font-bold">Cuez</h1> */}
              <p>
                Enter your registered email address and the correct OTP to
                continue.
              </p>
            </div>
            <div className=" flex flex-col gap-4">
              <Input
                text="Email address"
                type="email"
                value={email}
                error={emailError}
                onChange={(e) => setEmail(e.target.value)}
                ficon={<Mail strokeWidth={1.5} />}
              />

              <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                  <Input
                    text="Code"
                    type="text"
                    value={otp}
                    error={otpError}
                    onChange={(e) => setOtp(e.target.value)}
                    ficon={<Hash strokeWidth={1.5} />}
                  />
                </div>
                <button
                  className={` ${
                    isButtonDisabled ? "trans-btn-n " : "trans-btn"
                  }`}
                  onClick={handleSendOTP}
                  disabled={isButtonDisabled}
                  type="button"
                >
                  {isButtonDisabled
                    ? `Resend in ${formatTimer(timer)}s`
                    : "Send code"}
                </button>
              </div>
            </div>
            <div className=" flex flex-col gap-4">
              <button className="blue-btn" type="submit">
                {isLoggingIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin" />
                  </div>
                ) : (
                  "Continue"
                )}
              </button>{" "}
              <div className="  flex justify-end">
                <Link
                  href="/login"
                  className=" text-mainclr hover:text-mainclr/80 transition duration-200 cursor-pointer"
                >
                  Back to Log in
                </Link>
              </div>
            </div>
            {isButtonDisabled ? (
              <div className=" text-sm text-center text-zinc-400">
                Check spam if you don&apos;t see the code.
              </div>
            ) : (
              <></>
            )}
          </form>
        )}
      </div>
      <Footer />
    </section>
  )
}

export default ForgotPassword
