import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 4096,
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
