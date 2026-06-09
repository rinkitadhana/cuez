import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    domains: ["www.shutterstock.com", "flowbite.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
