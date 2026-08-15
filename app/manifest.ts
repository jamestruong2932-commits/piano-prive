import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Piano Privé",
    short_name: "Piano Privé",
    description: "Luyện tập piano với nhận diện nốt qua microphone",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1712",
    theme_color: "#0e1712",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
