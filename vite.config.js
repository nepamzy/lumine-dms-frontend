import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest (a custom src/sw.js, see there) instead of the
      // default generateSW — needed so the service worker can also handle
      // push/notificationclick events, not just precaching/offline.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: "auto",
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "favicon-16x16.png", "apple-touch-icon.png"],
      manifest: {
        name: "Lumine",
        short_name: "Lumine",
        description: "Lumine yoghurt from Bonchris Industry Nig. Ltd — order online, track deliveries.",
        theme_color: "#0A2D6F",
        background_color: "#F8F7F4",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
