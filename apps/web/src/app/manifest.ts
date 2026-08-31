import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SUPER GONGIK",
    short_name: "SUPER GONGIK",
    description: "사회복무요원을 위한 개인 복무 관리 도구",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#071a3d",
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
