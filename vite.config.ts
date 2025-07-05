import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/prop-buddy-tool/",
  plugins: [
    react(),
    VitePWA({
      base: '/prop-buddy-tool/',
      registerType: "autoUpdate",
      manifest: {
        name: "Prop Buddy",
        short_name: "PropBuddy",
        description: "Smart property insights: school zones + transport",
        start_url: "/prop-buddy-tool/",
        scope: "/prop-buddy-tool/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        share_target: {
          action: "/?shared=true",
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_ORS_API_KEY": JSON.stringify(process.env.VITE_ORS_API_KEY),
  },
});
