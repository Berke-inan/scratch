import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5238";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
