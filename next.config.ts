import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "temp-website-media.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "nh-website-media.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;