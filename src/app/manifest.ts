import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CompareMyTrip",
    short_name: "CompareMyTrip",
    description:
      "Compare curated travel packages, itineraries, inclusions and prices.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#facc15",
    icons: [
      { src: "/icons/cloud-plane-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/cloud-plane-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
