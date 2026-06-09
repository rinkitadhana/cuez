"use client"
import Input from "@/components/Input"
import PageHead from "@/components/pageComponents/PageHead"
import { useSendOtp, useRegister } from "@/hooks/useAuth"
import Footer from "@/layout/Footer"
import useMessageStore from "@/store/messageStore"
import {
  Eye,
  EyeOff,
  Hash,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const SignUp = () => {
  const { setMessage } = useMessageStore()
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true)
  const [timer, setTimer] = useState<number>(0)
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<boolean>(false)
  const [usernameError, setUsernameError] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<boolean>(false)
  const [otpError, setOtpError] = useState<boolean>(false)
  const { mutate: sendOtp } = useSendOtp()
  const { mutate: register, isPending: isRegistering } = useRegister()
  const [formData, setFormData] = useState<{
    email: string
    username: string
    password: string
    otp: string
  }>({
    email: "",
    username: "",
    password: "",
    otp: "",
  })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSendOTP = () => {
    if (formData.email == "") {
      setEmailError(true)
      setTimeout(() => {
        setEmailError(false)
      }, 5000)
    } else {
      setIsButtonDisabled(true)
      setEmailError(false)
      setTimer(30)
      sendOtp(formData.email, {
        onError: () => {
          setIsButtonDisabled(false)
        },
      })
    }
  }

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (formData.username == "") {
      setUsernameError(true)
      setTimeout(() => {
        setUsernameError(false)
      }, 5000)
    }
    if (formData.email == "") {
      setEmailError(true)
      setTimeout(() => {
        setEmailError(false)
      }, 5000)
    }
    if (formData.password == "") {
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
    if (formData.otp == "") {
      setOtpError(true)
      setTimeout(() => {
        setOtpError(false)
      }, 5000)
    }
    if (!passwordsMatch) {
      setMessage("Password doesn't match!", "error")
      return
    }
    register(formData)
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
    if (formData.password) {
      if (confirmPassword) {
        setPasswordsMatch(formData.password === confirmPassword)
      } else {
        setPasswordsMatch(false)
      }
    } else {
      setPasswordsMatch(true)
    }
  }, [formData.password, confirmPassword])

  return (
    <section className="flex flex-col py-4 h-screen">
      <PageHead title="SignUp / Cuez" />
      <div className="flex-grow sin-screen ">
        <form className=" flex flex-col gap-6" onSubmit={handleSignup}>
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
              Please enter all required credentials and a valid email address.
            </p>
          </div>
          <div className=" flex flex-col gap-4">
            <Input
              name="username"
              text="Username"
              type="text"
              value={formData.username}
              error={usernameError}
              onChange={handleChange}
              ficon={<UserRound strokeWidth={1.5} />}
            />
            <Input
              name="email"
              text="Email address"
              type="email"
              value={formData.email}
              error={emailError}
              onChange={handleChange}
              ficon={<Mail strokeWidth={1.5} />}
            />
            <Input
              name="password"
              text="Password"
              type="password"
              value={formData.password}
              error={passwordError}
              onChange={handleChange}
              ficon={<LockKeyhole strokeWidth={1.5} />}
              licon1={<Eye strokeWidth={1.5} />}
              licon2={<EyeOff strokeWidth={1.5} />}
            />
            <Input
              name="confirmPassword"
              text="Confirm password"
              type="password"
              value={confirmPassword}
              error={!passwordsMatch || passwordError}
              onChange={(e) => setConfirmPassword(e.target.value)}
              ficon={<LockKeyhole strokeWidth={1.5} />}
              licon1={<Eye strokeWidth={1.5} />}
              licon2={<EyeOff strokeWidth={1.5} />}
            />
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1">
                <Input
                  name="otp"
                  text="Code"
                  type="text"
                  value={formData.otp}
                  error={otpError}
                  onChange={handleChange}
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
            <button disabled={isRegistering} type="submit" className="blue-btn">
              {isRegistering ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" />
                </div>
              ) : (
                "Sign up"
              )}
            </button>
            <div className="  flex justify-between">
              <Link
                href="forgot-password"
                className=" text-mainclr hover:text-mainclr/80 transition duration-200 cursor-pointer"
              >
                forgot password?
              </Link>
              <Link
                href="/login"
                className=" text-mainclr hover:text-mainclr/80 transition duration-200 cursor-pointer"
              >
                Log in
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
      </div>
      <Footer />
    </section>
  )
}

export default SignUp
