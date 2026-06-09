import dotenv from "dotenv"
dotenv.config()

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Refusing to start with an insecure default.`
    )
  }
  return value
}

export const JWT_SECRET = requireEnv("JWT_SECRET")
export const JWT_SECRET_RESET = requireEnv("JWT_SECRET_RESET")
