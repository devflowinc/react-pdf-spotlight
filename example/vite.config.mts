import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 8888,
  },
  resolve: {
    alias: {
      "react-pdf-spotlight": "../../component/src/index.tsx",
    },
  },
});
