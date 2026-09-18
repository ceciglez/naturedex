import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naturedex",
    short_name: "Naturedex",
    description: "Catch what's really out there.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#a3c596",
    theme_color: "#452435",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
