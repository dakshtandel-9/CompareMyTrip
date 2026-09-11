import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["google-gax", "protobufjs", "@google-cloud/firestore"],
  webpack(config) {
    // Client components also render on the server. Firebase's Node client entry
    // imports gRPC/protobuf code generation, which workerd forbids during requests.
    // Use the browser transport for the client SDK; Firebase Admin stays server-only.
    config.resolve.alias["@firebase/firestore$"] = path.join(
      process.cwd(), "node_modules/@firebase/firestore/dist/index.esm.js",
    );
    return config;
  },
  // Node tracing otherwise omits jose's workerd/browser export used by Firebase Admin.
  outputFileTracingIncludes: {
    "/*": ["node_modules/jwks-rsa/node_modules/jose/dist/browser/**/*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self'; connect-src 'self' https:; frame-src https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net; form-action 'self' https://secure.payu.in https://test.payu.in; frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
  trailingSlash: false,
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
      {
        source: "/packages/adventure-track",
        destination: "/packages?category=Adventure",
        permanent: true,
      },
      {
        source: "/account/saved",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/faqs",
        destination: "/#faq",
        permanent: true,
      },
      {
        source: "/deals",
        destination: "/packages?deals=1",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
