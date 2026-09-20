import { defineConfig } from "vite";
import { devtools as tanstackDevtools } from "@tanstack/devtools-vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  plugins: [
    tanstackDevtools(),
    nitro(),
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    react(),
  ],
});
