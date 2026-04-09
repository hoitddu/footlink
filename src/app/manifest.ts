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
        src: "/footlink_logo.png",
        sizes: "1536x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
