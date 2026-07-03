import { defineConfig } from "@solidjs/start/config";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    prerender: {
      routes: ["/", "/about", "/licenses", "/404"],
      crawlLinks: false,
      autoSubfolderIndex: false,
    },
  },
  vite: {
    plugins: [visualizer({ filename: "dist/stats.html" })]
  }
});
