import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { devtools as tanstackDevtools } from "@tanstack/devtools-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

if (process.env.VERCEL) {
  process.env.NITRO_PRESET = "vercel";
}

export default defineConfig({
  plugins: [
    // TanStack devtools (dev-only, should be first)
    tanstackDevtools(),
    // TanStack Start framework plugin
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { 
        entry: "server",
        preset: process.env.VERCEL ? "vercel" : undefined,
      },
    }),
    // React JSX transform
    react(),
    // Tailwind CSS v4 Vite plugin
    tailwindcss(),
    // Resolve TypeScript path aliases (e.g. @/*)
    tsconfigPaths(),
  ],
  resolve: {
    // Deduplicate React and TanStack packages to avoid version conflicts
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});
