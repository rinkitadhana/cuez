import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Page not found / Cuez" }

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center bg-bgClr">
      <Image
        src="/img/icon/cuez-logo.png"
        alt="Cuez"
        width={56}
        height={56}
        className="size-14"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">This page doesn&apos;t exist</h1>
        <p className="text-zinc-400">
          The link may be broken, or the page may have been removed.
        </p>
      </div>
      <Link
        href="/home"
        className="px-5 py-2.5 rounded-xl bg-mainclr text-white font-semibold hover:bg-mainclr/85 transition-colors"
      >
        Go home
      </Link>
    </main>
  )
}
