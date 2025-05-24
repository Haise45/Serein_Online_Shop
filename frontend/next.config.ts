import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
    ],
  },
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:8080/api/v1/:path*",
          },
        ]
      : [
          {
            source: "/api/:path*",
            destination: "https://online-store-pb1l.onrender.com/api/v1/:path*",
          },
        ];
  },
};

export default nextConfig;
