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
    cloudflare: {
      pages: {
        routes: {
          exclude: [
            "/",
            "/about",
            "/licenses",
            "/llms.txt",
            "/robots.txt",
            "/sitemap.xml",
            "/favicon.svg",
            "/favicon.ico",
            "/og-image.png",
            "/og-image.svg"
          ]
        }
      }
    }
  },
  vite: {
    plugins: [visualizer({ filename: "dist/stats.html" })]
  }
});
