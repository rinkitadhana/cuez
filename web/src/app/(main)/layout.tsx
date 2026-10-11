"use client"

import AuthGuard from "@/components/AuthGuard"
import AppShell from "@/layout/AppShell"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
