import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      // @libsql/hrana-client imports cross-fetch que usa node:http internamente
      // (ClientRequest, processHeader) — incompatível com Cloudflare Workers/Miniflare.
      // Este shim substitui por globalThis.fetch nativo do Workers.
      "cross-fetch": new URL("./src/lib/cross-fetch-shim.ts", import.meta.url)
        .pathname,
    },
  },
  ssr: {
    resolve: {
      // Força @libsql/client a usar a exportação web/worker em vez de Node.js
      conditions: ["workerd", "worker", "browser"],
      externalConditions: ["workerd", "worker"],
    },
  },
  server: {
    port: 3000,
    watch: {
      ignored: ["**/routeTree.gen.ts"],
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})
