// app.config.ts
import { defineConfig } from "@solidjs/start/config";
var app_config_default = defineConfig({
  server: {
    preset: "cloudflare-pages",
    prerender: {
      routes: ["/", "/about", "/licenses", "/404"],
      crawlLinks: false,
      autoSubfolderIndex: false
    }
  }
});
export {
  app_config_default as default
};
