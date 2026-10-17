import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "/FitCircle/",
  plugins: [react()],
  resolve: { alias: {
    "@": path.resolve(import.meta.dirname, "client/src"),
  } },
  root: path.resolve(import.meta.dirname, "client"),
  build: { outDir: path.resolve(import.meta.dirname, "dist"), emptyOutDir: true },
});
