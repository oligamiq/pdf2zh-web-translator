// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import { visualizer } from "rollup-plugin-visualizer";
var app_config_default = defineConfig({
  server: {
    preset: "cloudflare-pages",
    prerender: {
      routes: ["/", "/about", "/licenses", "/404"],
      crawlLinks: false,
      autoSubfolderIndex: false
    }
  },
  vite: {
    plugins: [visualizer({ filename: "dist/stats.html" })]
  }
});
export {
  app_config_default as default
};
