import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Package photography imported from tourbazaar.in is served from the
       operators' Supabase storage bucket, so next/image has to be told the
       host is allowed before it will optimise those files. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xlmpzwkmxtabihhmgzhi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
