import type { NextConfig } from "next";

function getBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    return "http://localhost:5238";
  }

  let sanitized = raw.replace(/\/+$/, "");

  // Protokol belirtilmemişse https:// (localhost için http://) ekle
  if (!/^https?:\/\//i.test(sanitized)) {
    sanitized = sanitized.startsWith("localhost") || sanitized.startsWith("127.0.0.1")
      ? `http://${sanitized}`
      : `https://${sanitized}`;
  }

  return sanitized;
}

const backendUrl = getBackendUrl();

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
