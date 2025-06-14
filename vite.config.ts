import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/prop-buddy-tool/", // ✅ Ensure this matches your GitHub repo name
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_ORS_API_KEY": JSON.stringify(process.env.VITE_ORS_API_KEY),
  },
})
