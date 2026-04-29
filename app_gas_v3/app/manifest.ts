import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Porta Moneta GAS",
    short_name: "PM GAS",
    description: "Ordini settimanali del Gruppo di Acquisto Solidale",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#f5a623",
    orientation: "portrait",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
