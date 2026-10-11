// Usernames are part of profile URLs (cuez.app/<username>), so they must be
// URL-safe and must not shadow an app route.
const RESERVED = new Set([
  "api",
  "home",
  "search",
  "notifications",
  "chat",
  "bookmarks",
  "settings",
  "post",
  "more",
  "jobs",
  "projects",
  "login",
  "signup",
  "forgot-password",
  "explore",
  "admin",
  "help",
])

export const normalizeUsername = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

// Returns an error message, or null if the username is acceptable.
export const validateUsername = (username: string): string | null => {
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3-20 characters: letters, numbers and underscores only."
  }
  if (RESERVED.has(username)) return "That username isn't available."
  return null
}
