import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { generateBuildInfo } from "./scripts/release/build";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { licenseInventory, packageRoot, productionRoots } from "./scripts/third-party-licenses";
const build = generateBuildInfo();


export default defineConfig({
  base: "/FitCircle/",
  define: { __FITCIRCLE_BUILD__: JSON.stringify(build) },
  plugins: [react(), {
    name: "fitcircle-license-notices",
    configureServer(server) {
      server.middlewares.use("/FitCircle/third-party-licenses.json", (_req, res) => {
        try { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(licenseInventory(productionRoots()))); }
        catch (error) { res.statusCode = 500; res.end(String(error)); }
      });
    },
    generateBundle(_options, bundle) {
      this.emitFile({ type: "asset", fileName: "build-info.json", source: JSON.stringify(build) });
      const roots = new Set<string>();
      for (const chunk of Object.values(bundle)) if (chunk.type === "chunk") {
        for (const id of Object.keys(chunk.modules)) {
          const root = packageRoot(id);
          if (root) roots.add(root);
          // Vite injects browser preload helpers: attribute their source, too.
          else if (/vite\/(?:preload-helper|modulepreload-polyfill)/.test(id)) roots.add(path.dirname(require.resolve("vite/package.json")));
        }
      }
      this.emitFile({ type: "asset", fileName: "third-party-licenses.json", source: JSON.stringify(licenseInventory(roots), null, 2) });
    },
  }],
  resolve: { alias: {
    "@": path.resolve(import.meta.dirname, "client/src"),
  } },
  root: path.resolve(import.meta.dirname, "client"),
  build: { outDir: path.resolve(import.meta.dirname, "dist"), emptyOutDir: true },
});
