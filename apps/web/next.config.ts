import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
