import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FootLink",
    short_name: "FootLink",
    description: "FootLink, the fastest way to join mercenary futsal and soccer matches in Suwon.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1e15",
    theme_color: "#0e1e15",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
