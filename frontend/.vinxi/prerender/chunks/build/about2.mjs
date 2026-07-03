import { ssr, ssrHydrationKey, escape, createComponent } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/dist/server.js';
import { A } from './components-CbtQCEIg.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/dist/server.js';
import '../nitro/nitro.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/destr/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/nitropack/node_modules/h3/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/hookable/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/ofetch/dist/node.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/node-mock-http/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/ufo/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/drivers/fs.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/ohash/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/klona/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/defu/dist/defu.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/scule/dist/index.mjs';
import 'node:async_hooks';
import 'file:///srv/pdf2zh-web/v2/node_modules/unctx/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/radix3/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/vinxi/lib/app-fetch.js';
import 'file:///srv/pdf2zh-web/v2/node_modules/vinxi/lib/app-manifest.js';
import 'node:fs';
import 'node:url';
import 'file:///srv/pdf2zh-web/v2/node_modules/pathe/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/cookie-es/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/storage/dist/storage.js';
import 'file:///srv/pdf2zh-web/v2/node_modules/h3/dist/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/seroval/dist/esm/production/index.mjs';
import 'file:///srv/pdf2zh-web/v2/node_modules/seroval-plugins/dist/esm/production/web.mjs';

var l = ["<div", ' style="padding:32px;max-width:800px;margin:0 auto;"><h1 style="color:var(--accent);margin-bottom:24px;">\u5229\u7528\u5236\u9650\u3068\u6CE8\u610F\u4E8B\u9805</h1><!--$-->', '<!--/--><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u3053\u306E\u30B5\u30A4\u30C8\u306B\u3064\u3044\u3066</h2><p>pdf2zh\u306E\u516C\u5F0FWeb UI\u3067\u3059\u3002\u304A\u597D\u307F\u306ELLM Provider\u3092\u4F7F\u3063\u3066PDF\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u3092\u591A\u8A00\u8A9E\u306B\u7FFB\u8A33\u3067\u304D\u307E\u3059\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u5229\u7528\u5236\u9650</h2><p><strong>\u30B2\u30B9\u30C8\u5229\u7528:</strong></p><ul><li>\u6700\u5927PDF\u30B5\u30A4\u30BA: 5 MiB</li><li>1\u65E5\u306E\u5909\u63DB\u4E0A\u9650: 3\u56DE</li></ul><p><strong>\u30ED\u30B0\u30A4\u30F3\u4E2D:</strong></p><ul><li>\u6700\u5927PDF\u30B5\u30A4\u30BA: 20 MiB</li><li>1\u65E5\u306E\u5909\u63DB\u4E0A\u9650: 10\u56DE</li></ul></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">API\u30AD\u30FC\u306B\u3064\u3044\u3066</h2><p>OpenAI\u4E92\u63DB\u306E\u30B5\u30FC\u30D3\u30B9\uFF08SiliconFlow\u3001OpenAI\u3001DeepSeek\u306A\u3069\uFF09\u306EAPI\u30AD\u30FC\u3092\u3054\u81EA\u8EAB\u3067\u767B\u9332\u3057\u3066\u5229\u7528\u3067\u304D\u307E\u3059\u3002API\u30AD\u30FC\u306F\u6697\u53F7\u5316\u3055\u308C\u3066\u4FDD\u5B58\u3055\u308C\u3001\u3042\u306A\u305F\u306E\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u7FFB\u8A33\u306E\u307F\u306B\u4F7F\u7528\u3055\u308C\u307E\u3059\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u5916\u90E8\u30B5\u30FC\u30D3\u30B9\u3068\u6CE8\u610F\u4E8B\u9805</h2><p>\u672C\u30B5\u30FC\u30D3\u30B9\u3067\u306F\u5916\u90E8\u306ELLM Provider\u3092\u5229\u7528\u3057\u307E\u3059\u3002\u5229\u7528\u306B\u3042\u305F\u3063\u3066\u306F\u5404Provider\u306E\u5229\u7528\u898F\u7D04\u3084\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC\u306B\u540C\u610F\u3057\u305F\u3082\u306E\u3068\u307F\u306A\u3055\u308C\u307E\u3059\u3002\u6A5F\u5BC6\u60C5\u5831\u3084\u500B\u4EBA\u60C5\u5831\u306E\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306F\u304A\u63A7\u3048\u304F\u3060\u3055\u3044\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u30C7\u30FC\u30BF\u4FDD\u6301\u671F\u9593</h2><p>\u30B2\u30B9\u30C8\u5229\u7528\u306E\u30D5\u30A1\u30A4\u30EB\u306F\u7D0424\u6642\u9593\u3067\u524A\u9664\u3055\u308C\u307E\u3059\u3002\u30ED\u30B0\u30A4\u30F3\u30E6\u30FC\u30B6\u30FC\u306E\u5C65\u6B74\u306F7\u65E5\u9593\u4FDD\u6301\u3055\u308C\u307E\u3059\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u7981\u6B62\u4E8B\u9805</h2><p>\u30B7\u30B9\u30C6\u30E0\u306E\u60AA\u7528\u3001\u4E0D\u6B63\u306A\u30B9\u30AF\u30EC\u30A4\u30D4\u30F3\u30B0\u3001\u5229\u7528\u5236\u9650\u306E\u610F\u56F3\u7684\u306A\u56DE\u907F\u306A\u3069\u306F\u56FA\u304F\u7981\u3058\u3089\u308C\u3066\u3044\u307E\u3059\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u30E9\u30A4\u30BB\u30F3\u30B9</h2><p>\u3053\u306E\u30A2\u30D7\u30EA\u306E\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u3001\u304A\u3088\u3073\u5229\u7528\u3057\u3066\u3044\u308B\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u30E9\u30A4\u30BB\u30F3\u30B9\u306B\u3064\u3044\u3066\u306F\u3001\u4EE5\u4E0B\u306E\u30DA\u30FC\u30B8\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002</p><!--$-->', "<!--/--></div></div>"];
function s() {
  return ssr(l, ssrHydrationKey(), escape(createComponent(A, { href: "/", style: "display: inline-block; margin-bottom: 24px; color: var(--accent); text-decoration: none;", children: "\u2190 \u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u753B\u9762\u3078\u623B\u308B" })), escape(createComponent(A, { href: "/licenses", style: "display: inline-block; margin-top: 16px; color: var(--accent);", children: "\u30E9\u30A4\u30BB\u30F3\u30B9\u3092\u898B\u308B" })));
}

export { s as default };
//# sourceMappingURL=about2.mjs.map
