import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "confConf — confraternizações e amigo secreto",
    short_name: "confConf",
    description: "Organize confraternizações e amigos secretos sem dor de cabeça.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ecdc",
    theme_color: "#f4ecdc",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
