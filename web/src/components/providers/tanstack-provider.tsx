"use client"
import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import axios from "axios"

interface TanstackProviderProps {
  children: React.ReactNode
}

export const TanstackProvider = ({ children }: TanstackProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Retry network/server errors, but not "not found" or other
            // client errors: retrying those only delays the error screen.
            retry: (failureCount, error) => {
              const status = axios.isAxiosError(error)
                ? error.response?.status
                : undefined
              if (status && status >= 400 && status < 500) return false
              return failureCount < 2
            },
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
