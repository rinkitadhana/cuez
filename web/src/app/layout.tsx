import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "../styles/globals.css"
import { TanstackProvider } from "@/components/providers/tanstack-provider"
import Message from "@/components/Messages"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  description: "Cuez - A social media app for programmers",
  icons: {
    icon: {
      url: "/img/icon/cuez-logo.png",
      type: "image/png",
    },
  },
  openGraph: {
    title: "Cuez",
    description: "A social media app for programmers",
    url: "https://cuez.vercel.app",
    siteName: "Cuez",
    images: [
      {
        url: "/img/OG/Cuez.png",
        width: 1200,
        height: 630,
        alt: "Cuez - A social media app for programmers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuez",
    description: "A social media app for programmers",
    images: ["/img/OG/Cuez.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanstackProvider>
          <Message />
          {children}
        </TanstackProvider>
      </body>
    </html>
  )
}
