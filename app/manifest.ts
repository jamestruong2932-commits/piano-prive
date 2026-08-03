import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Piano Privé",
    short_name: "Piano Privé",
    description: "Luyện tập piano với nhận diện nốt qua microphone",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e4",
    theme_color: "#1f3d2e",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
