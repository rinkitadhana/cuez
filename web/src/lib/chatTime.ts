const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const isSameDay = (a: string, b: string) =>
  sameDay(new Date(a), new Date(b))

// Conversation list: "now", "5m", "3h", "Mon", "Oct 3", "Oct 3, 2024".
export const formatListTime = (iso: string | null) => {
  if (!iso) return ""
  const date = new Date(iso)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 6 * 86400) {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
}

// Thread day separators: "Today", "Yesterday", "Monday, Oct 3".
export const formatDayLabel = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, now)) return "Today"
  if (sameDay(date, yesterday)) return "Yesterday"
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
}

export const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
