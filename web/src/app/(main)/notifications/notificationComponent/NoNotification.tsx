import { Bell } from "lucide-react"

const NoNotification = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-400">
      <div className="relative mb-6">
        <Bell className="w-16 h-16 animate-pulse" />
      </div>
      <h3 className="text-xl font-medium mb-2">No notifications yet</h3>
      <p className="text-sm text-zinc-500">
        When you get notifications, they&apos;ll appear here
      </p>
    </div>
  )
}

export default NoNotification
