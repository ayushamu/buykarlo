import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuyKarlo - AMU Student Marketplace",
    short_name: "BuyKarlo",
    description:
      "Buy and sell trusted campus deals with verified students at Aligarh Muslim University.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f9ff",
    theme_color: "#1c16cf",
    icons: [
      {
        src: "/brand/buykarlo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/buykarlo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
