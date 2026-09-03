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

  async redirects() {
    return [
      {
        /* The homepage CRM grew into the whole site's content editor and moved
           to /admin/content. Bookmarks and open tabs still point at the old
           path, so send them on rather than 404. */
        source: "/admin/homepage",
        destination: "/admin/content",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
