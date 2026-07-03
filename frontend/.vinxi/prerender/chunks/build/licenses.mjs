import { ssr, ssrHydrationKey, escape, createComponent, ssrAttribute, isServer } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/dist/server.js';
import { createResource, Show, For } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/dist/server.js';
import { A } from './components-Bpi7F98j.mjs';
import './routing-Bi5-inpe.mjs';

var m = ["<div", ">\u8AAD\u307F\u8FBC\u307F\u4E2D...</div>"], g = ["<div", ' style="display:flex;flex-direction:column;gap:16px;">', "</div>"], v = ["<div", ' style="padding:32px;max-width:800px;margin:0 auto;"><h1 style="color:var(--accent);margin-bottom:24px;">\u30E9\u30A4\u30BB\u30F3\u30B9</h1><!--$-->', '<!--/--><div class="panel" style="margin-bottom:24px;padding:24px;border-left:4px solid var(--danger);"><h2 style="margin-top:0;color:var(--danger);">\u91CD\u8981\u306A\u30E9\u30A4\u30BB\u30F3\u30B9\u4E0A\u306E\u6CE8\u610F</h2><p>\u3053\u306E\u30A2\u30D7\u30EA\u306F\u5909\u63DB\u51E6\u7406\u306B pdf2zh-next \u306A\u3069\u306EOSS\u3092\u5229\u7528\u3057\u3066\u3044\u307E\u3059\u3002</p><p><strong>pdf2zh-next \u306F AGPL-3.0 \u30E9\u30A4\u30BB\u30F3\u30B9</strong>\u3067\u63D0\u4F9B\u3055\u308C\u3066\u3044\u307E\u3059\u3002</p><p style="margin-top:16px;">\u3053\u306E\u30A2\u30D7\u30EA\u81EA\u4F53\u306E\u72EC\u81EA\u30B3\u30FC\u30C9\u306F MIT License \u3068\u3057\u3066\u63D0\u4F9B\u3057\u307E\u3059\u304C\u3001 AGPL\u30E9\u30A4\u30BB\u30F3\u30B9\u306E\u30B3\u30F3\u30DD\u30FC\u30CD\u30F3\u30C8\u3092\u5229\u7528\u3059\u308B\u90E8\u5206\u306B\u306F\u3001\u5404OSS\u306E\u30E9\u30A4\u30BB\u30F3\u30B9\u6761\u4EF6\u304C\u9069\u7528\u3055\u308C\u307E\u3059\u3002</p><div style="margin-top:16px;">\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u3092\u898B\u308B: <br><a href="https://github.com/oligamiq/pdf2zh-web-translator" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;">https://github.com/oligamiq/pdf2zh-web-translator</a></div></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u3053\u306E\u30A2\u30D7\u30EA\u306E\u30E9\u30A4\u30BB\u30F3\u30B9</h2><p>\u3053\u306E\u30A2\u30D7\u30EA\u306E\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u306F MIT License \u306E\u3082\u3068\u3067\u63D0\u4F9B\u3055\u308C\u307E\u3059\u3002</p><p>\u305F\u3060\u3057\u3001\u5229\u7528\u3057\u3066\u3044\u308B\u5916\u90E8\u30E9\u30A4\u30D6\u30E9\u30EA\u3084\u30B5\u30FC\u30D3\u30B9\u306B\u306F\u3001\u305D\u308C\u305E\u308C\u306E\u30E9\u30A4\u30BB\u30F3\u30B9\u30FB\u5229\u7528\u898F\u7D04\u304C\u9069\u7528\u3055\u308C\u307E\u3059\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u7FFB\u8A33\u5BFE\u8C61PDF\u306E\u6A29\u5229\u306B\u3064\u3044\u3066\u306E\u6CE8\u610F</h2><p>\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3059\u308BPDF\u306E\u8457\u4F5C\u6A29\u30FB\u5229\u7528\u6A29\u306F\u5229\u7528\u8005\u81EA\u8EAB\u304C\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p><p>\u6A29\u5229\u4E0A\u554F\u984C\u306E\u3042\u308BPDF\u3084\u3001\u7B2C\u4E09\u8005\u306B\u9001\u4FE1\u3067\u304D\u306A\u3044\u6587\u66F8\u306F\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002</p></div><div class="panel" style="margin-bottom:24px;padding:24px;"><h2 style="margin-top:0;color:var(--accent);">\u4E3B\u8981\u306A\u4F9D\u5B58\u30E9\u30A4\u30D6\u30E9\u30EA</h2><p style="margin-bottom:16px;">\u3053\u306E\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306F\u4EE5\u4E0B\u306E\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u3092\u5229\u7528\u3057\u3066\u3044\u307E\u3059\u3002</p><!--$-->', "<!--/--><!--$-->", "<!--/--></div></div>"], h = ["<a", ' target="_blank" rel="noopener noreferrer" style="font-size:0.85em;color:var(--accent);text-decoration:underline;">', "</a>"], x = ["<div", ' style="border:1px solid var(--border);padding:16px;border-radius:8px;background:var(--bg-surface-hover);"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><div style="font-weight:bold;"><!--$-->', '<!--/--> <span style="font-weight:normal;font-size:0.9em;opacity:0.7;">v<!--$-->', '<!--/--></span></div><div style="font-size:0.8em;padding:2px 6px;background:var(--bg-body);border-radius:4px;">', '</div></div><div style="font-size:0.9em;margin-bottom:4px;">License: <strong>', "</strong></div><!--$-->", "<!--/--></div>"];
const y = async () => {
  if (isServer) return [];
  try {
    const t = await fetch("/third-party-licenses.json");
    if (!t.ok) throw new Error("Failed to fetch licenses");
    return await t.json();
  } catch (t) {
    return console.error(t), [];
  }
};
function $() {
  const [t] = createResource(y);
  return ssr(v, ssrHydrationKey(), escape(createComponent(A, { href: "/", style: "display: inline-block; margin-bottom: 24px; color: var(--accent); text-decoration: none;", children: "\u2190 \u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u753B\u9762\u3078\u623B\u308B" })), escape(createComponent(Show, { get when() {
    return t.loading;
  }, get children() {
    return ssr(m, ssrHydrationKey());
  } })), escape(createComponent(Show, { get when() {
    return t() && t().length > 0;
  }, get children() {
    return ssr(g, ssrHydrationKey(), escape(createComponent(For, { get each() {
      return t();
    }, children: (r) => ssr(x, ssrHydrationKey(), escape(r.name), escape(r.version), escape(r.type), escape(r.license), escape(createComponent(Show, { get when() {
      return r.url;
    }, get children() {
      return ssr(h, ssrHydrationKey() + ssrAttribute("href", escape(r.url, true), false), escape(r.url));
    } }))) })));
  } })));
}

export { $ as default };
//# sourceMappingURL=licenses.mjs.map
