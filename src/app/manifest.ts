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
    icons: [{ src: "/comparemytrip-logo.png", sizes: "2172x724", type: "image/png" }],
  };
}

