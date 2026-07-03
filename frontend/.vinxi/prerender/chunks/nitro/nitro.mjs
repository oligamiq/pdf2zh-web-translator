import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import destr from 'file:///srv/pdf2zh-web/v2/node_modules/destr/dist/index.mjs';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, createError, sendRedirect, proxyRequest, getRequestURL, setResponseStatus, getResponseHeader, setResponseHeaders, send, getRequestHeader, removeResponseHeader, appendResponseHeader, setResponseHeader, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler } from 'file:///srv/pdf2zh-web/v2/node_modules/nitropack/node_modules/h3/dist/index.mjs';
import { createHooks } from 'file:///srv/pdf2zh-web/v2/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file:///srv/pdf2zh-web/v2/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file:///srv/pdf2zh-web/v2/node_modules/node-mock-http/dist/index.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, decodePath, withLeadingSlash, withoutTrailingSlash } from 'file:///srv/pdf2zh-web/v2/node_modules/ufo/dist/index.mjs';
import { createStorage, prefixStorage } from 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/drivers/fs.mjs';
import unstorage_47drivers_47fs_45lite from 'file:///srv/pdf2zh-web/v2/node_modules/unstorage/drivers/fs-lite.mjs';
import { digest } from 'file:///srv/pdf2zh-web/v2/node_modules/ohash/dist/index.mjs';
import { klona } from 'file:///srv/pdf2zh-web/v2/node_modules/klona/dist/index.mjs';
import defu, { defuFn } from 'file:///srv/pdf2zh-web/v2/node_modules/defu/dist/defu.mjs';
import { snakeCase } from 'file:///srv/pdf2zh-web/v2/node_modules/scule/dist/index.mjs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext } from 'file:///srv/pdf2zh-web/v2/node_modules/unctx/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file:///srv/pdf2zh-web/v2/node_modules/radix3/dist/index.mjs';
import _hYdI8xyDQXRr30yF0EwSfcBLsXu09fpbMP5T7QTNug from 'file:///srv/pdf2zh-web/v2/node_modules/vinxi/lib/app-fetch.js';
import _cZCug1TeEb5qkU2MJJ_2HsMQxECEIK6zPf5RJh2LPE from 'file:///srv/pdf2zh-web/v2/node_modules/vinxi/lib/app-manifest.js';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'file:///srv/pdf2zh-web/v2/node_modules/pathe/dist/index.mjs';
import { parseSetCookie } from 'file:///srv/pdf2zh-web/v2/node_modules/cookie-es/dist/index.mjs';
import { sharedConfig, lazy, createComponent, createMemo, useContext, createContext, createSignal, createRenderEffect, on, runWithOwner, getOwner, startTransition, resetErrorBoundaries, batch, untrack, catchError, ErrorBoundary, Suspense, onCleanup, createUniqueId, children, Show, createRoot } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/dist/server.js';
import { renderToString, isServer, getRequestEvent, ssrElement, escape, mergeProps, ssr, renderToStream, createComponent as createComponent$1, ssrHydrationKey, NoHydration, useAssets, Hydration, ssrAttribute, HydrationScript, delegateEvents, spread } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/dist/server.js';
import { provideRequestEvent } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/storage/dist/storage.js';
import { eventHandler as eventHandler$1, H3Event, getRequestIP, parseCookies, getResponseStatus, getResponseStatusText, getCookie, setCookie, getResponseHeader as getResponseHeader$1, setResponseHeader as setResponseHeader$1, removeResponseHeader as removeResponseHeader$1, getResponseHeaders, getRequestURL as getRequestURL$1, getRequestWebStream, setResponseStatus as setResponseStatus$1, appendResponseHeader as appendResponseHeader$1, setHeader, sendRedirect as sendRedirect$1 } from 'file:///srv/pdf2zh-web/v2/node_modules/h3/dist/index.mjs';
import { fromJSON, Feature, crossSerializeStream, getCrossReferenceHeader, toCrossJSONStream } from 'file:///srv/pdf2zh-web/v2/node_modules/seroval/dist/esm/production/index.mjs';
import { AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin } from 'file:///srv/pdf2zh-web/v2/node_modules/seroval-plugins/dist/esm/production/web.mjs';

const serverAssets = [{"baseName":"server","dir":"/srv/pdf2zh-web/v2/frontend/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));
storage.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/srv/pdf2zh-web/v2/frontend"}));
storage.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/srv/pdf2zh-web/v2/frontend"}));
storage.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/srv/pdf2zh-web/v2/frontend/.vinxi"}));
storage.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/srv/pdf2zh-web/v2/frontend/.vinxi/cache"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const inlineAppConfig = {};



const appConfig$1 = defuFn(inlineAppConfig);

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/"
  },
  "nitro": {
    "routeRules": {
      "/_build/assets/**": {
        "headers": {
          "cache-control": "public, immutable, max-age=31536000"
        }
      }
    }
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  {
    return _sharedRuntimeConfig;
  }
}
_deepFreeze(klona(appConfig$1));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

const nitroAsyncContext = getContext("nitro-app", {
  asyncContext: true,
  AsyncLocalStorage: AsyncLocalStorage 
});

function isPathInScope(pathname, base) {
  let canonical;
  try {
    const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
    canonical = new URL(pre, "http://_").pathname;
  } catch {
    return false;
  }
  return !base || canonical === base || canonical.startsWith(base + "/");
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const appConfig = {"name":"vinxi","routers":[{"name":"public","type":"static","base":"/","dir":"./public","root":"/srv/pdf2zh-web/v2/frontend","order":0,"outDir":"/srv/pdf2zh-web/v2/frontend/.vinxi/build/public"},{"name":"ssr","type":"http","link":{"client":"client"},"handler":"src/entry-server.tsx","extensions":["js","jsx","ts","tsx"],"target":"server","root":"/srv/pdf2zh-web/v2/frontend","base":"/","outDir":"/srv/pdf2zh-web/v2/frontend/.vinxi/build/ssr","order":1},{"name":"client","type":"client","base":"/_build","handler":"src/entry-client.tsx","extensions":["js","jsx","ts","tsx"],"target":"browser","root":"/srv/pdf2zh-web/v2/frontend","outDir":"/srv/pdf2zh-web/v2/frontend/.vinxi/build/client","order":2},{"name":"server-fns","type":"http","base":"/_server","handler":"../node_modules/@solidjs/start/dist/runtime/server-handler.js","target":"server","root":"/srv/pdf2zh-web/v2/frontend","outDir":"/srv/pdf2zh-web/v2/frontend/.vinxi/build/server-fns","order":3}],"server":{"compressPublicAssets":{"brotli":true},"routeRules":{"/_build/assets/**":{"headers":{"cache-control":"public, immutable, max-age=31536000"}}},"experimental":{"asyncContext":true},"preset":"cloudflare-pages","prerender":{"crawlLinks":false,"autoSubfolderIndex":false}},"root":"/srv/pdf2zh-web/v2/frontend"};
					const buildManifest = {"ssr":{"_components-CbtQCEIg.js":{"file":"assets/components-CbtQCEIg.js","name":"components","imports":["_routing-BHSIbT1K.js"]},"_routing-BHSIbT1K.js":{"file":"assets/routing-BHSIbT1K.js","name":"routing"},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CbtQCEIg.js","_routing-BHSIbT1K.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"about.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CbtQCEIg.js","_routing-BHSIbT1K.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"app.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CbtQCEIg.js","_routing-BHSIbT1K.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"licenses.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CbtQCEIg.js","_routing-BHSIbT1K.js"]},"virtual:$vinxi/handler/ssr":{"file":"ssr.js","name":"ssr","src":"virtual:$vinxi/handler/ssr","isEntry":true,"imports":["_routing-BHSIbT1K.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css"],"css":["assets/ssr-DYKmZOZr.css"]}},"client":{"_components-Bh2K9uJB.js":{"file":"assets/components-Bh2K9uJB.js","name":"components","imports":["_web-DEVfh2BD.js","_routing-pxEtRcSi.js"]},"_routing-pxEtRcSi.js":{"file":"assets/routing-pxEtRcSi.js","name":"routing","imports":["_web-DEVfh2BD.js"]},"_web-DEVfh2BD.js":{"file":"assets/web-DEVfh2BD.js","name":"web"},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"assets/_...404_-BjsEZ_2M.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-DEVfh2BD.js","_components-Bh2K9uJB.js","_routing-pxEtRcSi.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"assets/about-DMemmlN5.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-DEVfh2BD.js","_components-Bh2K9uJB.js","_routing-pxEtRcSi.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"assets/app-DBjZ4gQW.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-DEVfh2BD.js"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"assets/index-B9saUkdg.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-DEVfh2BD.js","_components-Bh2K9uJB.js","_routing-pxEtRcSi.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"assets/licenses-B728W6nd.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-DEVfh2BD.js","_components-Bh2K9uJB.js","_routing-pxEtRcSi.js"]},"virtual:$vinxi/handler/client":{"file":"assets/client-DC6sNOUh.js","name":"client","src":"virtual:$vinxi/handler/client","isEntry":true,"imports":["_web-DEVfh2BD.js","_routing-pxEtRcSi.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css"],"css":["assets/client-DYKmZOZr.css"]}},"server-fns":{"_components-Bpi7F98j.js":{"file":"assets/components-Bpi7F98j.js","name":"components","imports":["_routing-Bi5-inpe.js"]},"_routing-Bi5-inpe.js":{"file":"assets/routing-Bi5-inpe.js","name":"routing"},"_server-fns-BxQkARz8.js":{"file":"assets/server-fns-BxQkARz8.js","name":"server-fns","dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/app.tsx"]},"src/app.tsx":{"file":"assets/app-BKliNqmb.js","name":"app","src":"src/app.tsx","isDynamicEntry":true,"imports":["_server-fns-BxQkARz8.js","_routing-Bi5-inpe.js"],"css":["assets/app-DYKmZOZr.css"]},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-Bpi7F98j.js","_routing-Bi5-inpe.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"about.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-Bpi7F98j.js","_routing-Bi5-inpe.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"app.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-Bpi7F98j.js","_routing-Bi5-inpe.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"licenses.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-Bpi7F98j.js","_routing-Bi5-inpe.js"]},"virtual:$vinxi/handler/server-fns":{"file":"server-fns.js","name":"server-fns","src":"virtual:$vinxi/handler/server-fns","isEntry":true,"imports":["_server-fns-BxQkARz8.js"]}}};

					const routeManifest = {"ssr":{},"client":{},"server-fns":{}};

        function createProdApp(appConfig) {
          return {
            config: { ...appConfig, buildManifest, routeManifest },
            getRouter(name) {
              return appConfig.routers.find(router => router.name === name)
            }
          }
        }

        function plugin(app) {
          const prodApp = createProdApp(appConfig);
          globalThis.app = prodApp;
        }

const chunks = {};
			 



			 function app() {
				 globalThis.$$chunks = chunks;
			 }

const plugins = [
  plugin,
_hYdI8xyDQXRr30yF0EwSfcBLsXu09fpbMP5T7QTNug,
_cZCug1TeEb5qkU2MJJ_2HsMQxECEIK6zPf5RJh2LPE,
app
];

const assets = {};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _zYMrMB = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
function _e$1(e) {
  let r;
  const t = _(e), n = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(t, { ...n, body: e.node.req.body }) : new Request(t, { ...n, get body() {
    return r || (r = Ge(e), r);
  } });
}
function Ne(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: _e$1(e), url: _(e) }, e.web.request;
}
function Me$1() {
  return Qe();
}
const U$1 = /* @__PURE__ */ Symbol("$HTTPEvent");
function je(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[U$1]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function u(e) {
  return function(...r) {
    var _a;
    let t = r[0];
    if (je(t)) r[0] = t instanceof H3Event || t.__is_event__ ? t : t[U$1];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = Me$1(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      r.unshift(t);
    }
    return e(...r);
  };
}
const _ = u(getRequestURL$1), ze = u(getRequestIP), S = u(setResponseStatus$1), E$1 = u(getResponseStatus), De$1 = u(getResponseStatusText), y$1 = u(getResponseHeaders), q$1 = u(getResponseHeader$1), We$1 = u(setResponseHeader$1), N = u(appendResponseHeader$1), Be = u(parseCookies), Je = u(getCookie), Xe = u(setCookie), h = u(setHeader), Ge = u(getRequestWebStream), Ke = u(removeResponseHeader$1), Ve = u(Ne);
function Ze() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Qe() {
  return Ze().use().event;
}
const w = "Invariant Violation", { setPrototypeOf: Ye = function(e, r) {
  return e.__proto__ = r, e;
} } = Object;
class T extends Error {
  constructor(r = w) {
    super(typeof r == "number" ? `${w}: ${r} (see https://github.com/apollographql/invariant-packages)` : r);
    __publicField$1(this, "framesToPop", 1);
    __publicField$1(this, "name", w);
    Ye(this, T.prototype);
  }
}
function et(e, r) {
  if (!e) throw new T(r);
}
const v = "solidFetchEvent";
function tt(e) {
  return { request: Ve(e), response: ot(e), clientAddress: ze(e), locals: {}, nativeEvent: e };
}
function rt(e) {
  return { ...e };
}
function st(e) {
  if (!e.context[v]) {
    const r = tt(e);
    e.context[v] = r;
  }
  return e.context[v];
}
function H$1(e, r) {
  for (const [t, n] of r.entries()) N(e, t, n);
}
class nt {
  constructor(r) {
    __publicField$1(this, "event");
    this.event = r;
  }
  get(r) {
    const t = q$1(this.event, r);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(r) {
    return this.get(r) !== null;
  }
  set(r, t) {
    return We$1(this.event, r, t);
  }
  delete(r) {
    return Ke(this.event, r);
  }
  append(r, t) {
    N(this.event, r, t);
  }
  getSetCookie() {
    const r = q$1(this.event, "Set-Cookie");
    return Array.isArray(r) ? r : [r];
  }
  forEach(r) {
    return Object.entries(y$1(this.event)).forEach(([t, n]) => r(Array.isArray(n) ? n.join(", ") : n, t, this));
  }
  entries() {
    return Object.entries(y$1(this.event)).map(([r, t]) => [r, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(y$1(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(y$1(this.event)).map((r) => Array.isArray(r) ? r.join(", ") : r)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function ot(e) {
  return { get status() {
    return E$1(e);
  }, set status(r) {
    S(e, r);
  }, get statusText() {
    return De$1(e);
  }, set statusText(r) {
    S(e, E$1(e), r);
  }, headers: new nt(e) };
}
const M$1 = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_...404_.mjs'), import: () => import('../build/_...404_.mjs') }, path: "/*404", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/[...404].tsx" }, { page: true, $component: { src: "src/routes/about.tsx?pick=default&pick=$css", build: () => import('../build/about.mjs'), import: () => import('../build/about.mjs') }, path: "/about", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/about.tsx" }, { page: true, $component: { src: "src/routes/app.tsx?pick=default&pick=$css", build: () => import('../build/app.mjs'), import: () => import('../build/app.mjs') }, path: "/app", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index.mjs'), import: () => import('../build/index.mjs') }, path: "/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/licenses.tsx?pick=default&pick=$css", build: () => import('../build/licenses.mjs'), import: () => import('../build/licenses.mjs') }, path: "/licenses", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/licenses.tsx" }], at = it(M$1.filter((e) => e.page));
function it(e) {
  function r(t, n, o, a) {
    const i = Object.values(t).find((c) => o.startsWith(c.id + "/"));
    return i ? (r(i.children || (i.children = []), n, o.slice(i.id.length)), t) : (t.push({ ...n, id: o, path: o.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return e.sort((t, n) => t.path.length - n.path.length).reduce((t, n) => r(t, n, n.path, n.path), []);
}
function ct(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
createRouter({ routes: M$1.reduce((e, r) => {
  if (!ct(r)) return e;
  let t = r.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (n, o) => `**:${o}`).split("/").map((n) => n.startsWith(":") || n.startsWith("*") ? n : encodeURIComponent(n)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (e[t]) throw new Error(`Duplicate API routes for "${t}" found at "${e[t].route.path}" and "${r.path}"`);
  return e[t] = { route: r }, e;
}, {}) });
var lt$1 = " ";
const pt$1 = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(lt$1), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function dt$1(e, r) {
  let { tag: t, attrs: { key: n, ...o } = { key: void 0 }, children: a } = e;
  return pt$1[t]({ attrs: { ...o, nonce: r }, key: n, children: a });
}
function ft$1(e, r, t, n = "default") {
  return lazy(async () => {
    var _a;
    {
      const a = (await e.import())[n], c = (await ((_a = r.inputs) == null ? void 0 : _a[e.src].assets())).filter((l) => l.tag === "style" || l.attrs.rel === "stylesheet");
      return { default: (l) => [...c.map((g) => dt$1(g)), createComponent(a, l)] };
    }
  });
}
function j$1() {
  function e(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && ft$1(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(e) : void 0 };
  }
  return at.map(e);
}
let P;
const Ft$1 = isServer ? () => getRequestEvent().routes : () => P || (P = j$1());
function ht$1(e) {
  const r = Je(e.nativeEvent, "flash");
  if (r) try {
    let t = JSON.parse(r);
    if (!t || !t.result) return;
    const n = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], o = t.error ? new Error(t.result) : t.result;
    return { input: n, url: t.url, pending: false, result: t.thrown ? void 0 : o, error: t.thrown ? o : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    Xe(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function gt$1(e) {
  const r = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await r.json(), assets: [...await r.inputs[r.handler].assets()], router: { submission: ht$1(e) }, routes: j$1(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const mt$1 = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function Rt$1(e) {
  return e.status && mt$1.has(e.status) ? e.status : 302;
}
const yt$1 = {}, k = [AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin], St$1 = 64, z = Feature.RegExp;
function D$1(e) {
  const r = new TextEncoder().encode(e), t = r.length, n = t.toString(16), o = "00000000".substring(0, 8 - n.length) + n, a = new TextEncoder().encode(`;0x${o};`), i = new Uint8Array(12 + t);
  return i.set(a), i.set(r, 12), i;
}
function A(e, r) {
  return new ReadableStream({ start(t) {
    crossSerializeStream(r, { scopeId: e, plugins: k, onSerialize(n, o) {
      t.enqueue(D$1(o ? `(${getCrossReferenceHeader(e)},${n})` : n));
    }, onDone() {
      t.close();
    }, onError(n) {
      t.error(n);
    } });
  } });
}
function bt$1(e) {
  return new ReadableStream({ start(r) {
    toCrossJSONStream(e, { disabledFeatures: z, depthLimit: St$1, plugins: k, onParse(t) {
      r.enqueue(D$1(JSON.stringify(t)));
    }, onDone() {
      r.close();
    }, onError(t) {
      r.error(t);
    } });
  } });
}
async function C(e) {
  return fromJSON(JSON.parse(e), { plugins: k, disabledFeatures: z });
}
async function wt$1(e) {
  const r = st(e), t = r.request, n = t.headers.get("X-Server-Id"), o = t.headers.get("X-Server-Instance"), a = t.headers.has("X-Single-Flight"), i = new URL(t.url);
  let c, d;
  if (n) et(typeof n == "string", "Invalid server function"), [c, d] = decodeURIComponent(n).split("#");
  else if (c = i.searchParams.get("id"), d = i.searchParams.get("name"), !c || !d) return new Response(null, { status: 404 });
  const l = yt$1[c];
  let g;
  if (!l) return new Response(null, { status: 404 });
  g = await l.importer();
  const W = g[l.functionName];
  let f = [];
  if (!o || e.method === "GET") {
    const s = i.searchParams.get("args");
    if (s) {
      const p = await C(s);
      for (const m of p) f.push(m);
    }
  }
  if (e.method === "POST") {
    const s = t.headers.get("content-type"), p = e.node.req, m = p instanceof ReadableStream, B = p.body instanceof ReadableStream, J = m && p.locked || B && p.body.locked, X = m ? p : p.body, b = J ? t : new Request(t, { ...t, body: X });
    t.headers.get("x-serialized") ? f = await C(await b.text()) : (s == null ? void 0 : s.startsWith("multipart/form-data")) || (s == null ? void 0 : s.startsWith("application/x-www-form-urlencoded")) ? f.push(await b.formData()) : (s == null ? void 0 : s.startsWith("application/json")) && (f = await b.json());
  }
  try {
    let s = await provideRequestEvent(r, async () => (sharedConfig.context = { event: r }, r.locals.serverFunctionMeta = { id: c + "#" + d }, W(...f)));
    if (a && o && (s = await L$1(r, s)), s instanceof Response) {
      if (s.headers && s.headers.has("X-Content-Raw")) return s;
      o && (s.headers && H$1(e, s.headers), s.status && (s.status < 300 || s.status >= 400) && S(e, s.status), s.customBody ? s = await s.customBody() : s.body == null && (s = null));
    }
    if (!o) return F$1(s, t, f);
    return h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), A(o, s);
    return bt$1(s);
  } catch (s) {
    if (s instanceof Response) a && o && (s = await L$1(r, s)), s.headers && H$1(e, s.headers), s.status && (!o || s.status < 300 || s.status >= 400) && S(e, s.status), s.customBody ? s = s.customBody() : s.body == null && (s = null), h(e, "X-Error", "true");
    else if (o) {
      const p = s instanceof Error ? s.message : typeof s == "string" ? s : "true";
      h(e, "X-Error", p.replace(/[\r\n]+/g, ""));
    } else s = F$1(s, t, f, true);
    return o ? (h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), A(o, s)) : s;
  }
}
function F$1(e, r, t, n) {
  const o = new URL(r.url), a = e instanceof Error;
  let i = 302, c;
  return e instanceof Response ? (c = new Headers(e.headers), e.headers.has("Location") && (c.set("Location", new URL(e.headers.get("Location"), o.origin + "").toString()), i = Rt$1(e))) : c = new Headers({ Location: new URL(r.headers.get("referer")).toString() }), e && c.append("Set-Cookie", `flash=${encodeURIComponent(JSON.stringify({ url: o.pathname + o.search, result: a ? e.message : e, thrown: n, error: a, input: [...t.slice(0, -1), [...t[t.length - 1].entries()]] }))}; Secure; HttpOnly;`), new Response(null, { status: i, headers: c });
}
let $$1;
function vt$1(e) {
  var _a;
  const r = new Headers(e.request.headers), t = Be(e.nativeEvent), n = e.response.headers.getSetCookie();
  r.delete("cookie");
  let o = false;
  return ((_a = e.nativeEvent.node) == null ? void 0 : _a.req) && (o = true, e.nativeEvent.node.req.headers.cookie = ""), n.forEach((a) => {
    if (!a) return;
    const { maxAge: i, expires: c, name: d, value: l } = parseSetCookie(a);
    if (i != null && i <= 0) {
      delete t[d];
      return;
    }
    if (c != null && c.getTime() <= Date.now()) {
      delete t[d];
      return;
    }
    t[d] = l;
  }), Object.entries(t).forEach(([a, i]) => {
    r.append("cookie", `${a}=${i}`), o && (e.nativeEvent.node.req.headers.cookie += `${a}=${i};`);
  }), r;
}
async function L$1(e, r) {
  let t, n = new URL(e.request.headers.get("referer")).toString();
  r instanceof Response && (r.headers.has("X-Revalidate") && (t = r.headers.get("X-Revalidate").split(",")), r.headers.has("Location") && (n = new URL(r.headers.get("Location"), new URL(e.request.url).origin + "").toString()));
  const o = rt(e);
  return o.request = new Request(n, { headers: vt$1(e) }), await provideRequestEvent(o, async () => {
    await gt$1(o), $$1 || ($$1 = (await import('../build/app-BKliNqmb.mjs')).default), o.router.dataOnly = t || true, o.router.previousUrl = e.request.headers.get("referer");
    try {
      renderToString(() => {
        sharedConfig.context.event = o, $$1();
      });
    } catch (c) {
      console.log(c);
    }
    const a = o.router.data;
    if (!a) return r;
    let i = false;
    for (const c in a) a[c] === void 0 ? delete a[c] : i = true;
    return i && (r instanceof Response ? r.customBody && (a._$value = r.customBody()) : (a._$value = r, r = new Response(null, { status: 200 })), r.customBody = () => a, r.headers.set("X-Single-Flight", "true")), r;
  });
}
const Lt$1 = eventHandler$1(wt$1);

function ge() {
  let t = /* @__PURE__ */ new Set();
  function e(r) {
    return t.add(r), () => t.delete(r);
  }
  let n = false;
  function s(r, o) {
    if (n) return !(n = false);
    const a = { to: r, options: o, defaultPrevented: false, preventDefault: () => a.defaultPrevented = true };
    for (const c of t) c.listener({ ...a, from: c.location, retry: (f) => {
      f && (n = true), c.navigate(r, { ...o, resolve: false });
    } });
    return !a.defaultPrevented;
  }
  return { subscribe: e, confirm: s };
}
let I$1;
function Q$1() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), I$1 = window.history.state._depth;
}
isServer || Q$1();
function Fe(t) {
  return { ...t, _depth: window.history.state && window.history.state._depth };
}
function qe(t, e) {
  let n = false;
  return () => {
    const s = I$1;
    Q$1();
    const r = s == null ? null : I$1 - s;
    if (n) {
      n = false;
      return;
    }
    r && e(r) ? (n = true, window.history.go(-r)) : t();
  };
}
const ye = /^(?:[a-z0-9]+:)?\/\//i, we = /^\/+|(\/)\/+$/g, ve = "http://sr";
function E(t, e = false) {
  const n = t.replace(we, "$1");
  return n ? e || /^[?#]/.test(n) ? n : "/" + n : "";
}
function q(t, e, n) {
  if (ye.test(e)) return;
  const s = E(t), r = n && E(n);
  let o = "";
  return !r || e.startsWith("/") ? o = s : r.toLowerCase().indexOf(s.toLowerCase()) !== 0 ? o = s + r : o = r, (o || "/") + E(e, !o);
}
function Re(t, e) {
  if (t == null) throw new Error(e);
  return t;
}
function Pe(t, e) {
  return E(t).replace(/\/*(\*.*)?$/g, "") + E(e);
}
function V$1(t) {
  const e = {};
  return t.searchParams.forEach((n, s) => {
    s in e ? Array.isArray(e[s]) ? e[s].push(n) : e[s] = [e[s], n] : e[s] = n;
  }), e;
}
function xe(t, e, n) {
  const [s, r] = t.split("/*", 2), o = s.split("/").filter(Boolean), a = o.length;
  return (c) => {
    const f = c.split("/").filter(Boolean), h = f.length - a;
    if (h < 0 || h > 0 && r === void 0 && !e) return null;
    const l = { path: a ? "" : "/", params: {} }, m = (d) => n === void 0 ? void 0 : n[d];
    for (let d = 0; d < a; d++) {
      const p = o[d], y = p[0] === ":", v = y ? f[d] : f[d].toLowerCase(), C = y ? p.slice(1) : p.toLowerCase();
      if (y && W(v, m(C))) l.params[C] = v;
      else if (y || !W(v, C)) return null;
      l.path += `/${v}`;
    }
    if (r) {
      const d = h ? f.slice(-h).join("/") : "";
      if (W(d, m(r))) l.params[r] = d;
      else return null;
    }
    return l;
  };
}
function W(t, e) {
  const n = (s) => s === t;
  return e === void 0 ? true : typeof e == "string" ? n(e) : typeof e == "function" ? e(t) : Array.isArray(e) ? e.some(n) : e instanceof RegExp ? e.test(t) : false;
}
function be(t) {
  const [e, n] = t.pattern.split("/*", 2), s = e.split("/").filter(Boolean);
  return s.reduce((r, o) => r + (o.startsWith(":") ? 2 : 3), s.length - (n === void 0 ? 0 : 1));
}
function Y$1(t) {
  const e = /* @__PURE__ */ new Map(), n = getOwner();
  return new Proxy({}, { get(s, r) {
    return e.has(r) || runWithOwner(n, () => e.set(r, createMemo(() => t()[r]))), e.get(r)();
  }, getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  }, ownKeys() {
    return Reflect.ownKeys(t());
  }, has(s, r) {
    return r in t();
  } });
}
function Z$1(t) {
  let e = /(\/?\:[^\/]+)\?/.exec(t);
  if (!e) return [t];
  let n = t.slice(0, e.index), s = t.slice(e.index + e[0].length);
  const r = [n, n += e[1]];
  for (; e = /^(\/\:[^\/]+)\?/.exec(s); ) r.push(n += e[1]), s = s.slice(e[0].length);
  return Z$1(s).reduce((o, a) => [...o, ...r.map((c) => c + a)], []);
}
const Ae = 100, Ce = createContext(), ee = createContext(), D = () => Re(useContext(Ce), "<A> and 'use' router primitives can be only used inside a Route."), Ee = () => useContext(ee) || D().base, We = (t) => {
  const e = Ee();
  return createMemo(() => e.resolvePath(t()));
}, $e = (t) => {
  const e = D();
  return createMemo(() => {
    const n = t();
    return n !== void 0 ? e.renderPath(n) : n;
  });
}, Ie = () => D().location;
function Le(t, e = "") {
  const { component: n, preload: s, load: r, children: o, info: a } = t, c = !o || Array.isArray(o) && !o.length, f = { key: t, component: n, preload: s || r, info: a };
  return te(t.path).reduce((h, l) => {
    for (const m of Z$1(l)) {
      const d = Pe(e, m);
      let p = c ? d : d.split("/*", 1)[0];
      p = p.split("/").map((y) => y.startsWith(":") || y.startsWith("*") ? y : encodeURIComponent(y)).join("/"), h.push({ ...f, originalPath: l, pattern: p, matcher: xe(p, !c, t.matchFilters) });
    }
    return h;
  }, []);
}
function Se(t, e = 0) {
  return { routes: t, score: be(t[t.length - 1]) * 1e4 - e, matcher(n) {
    const s = [];
    for (let r = t.length - 1; r >= 0; r--) {
      const o = t[r], a = o.matcher(n);
      if (!a) return null;
      s.unshift({ ...a, route: o });
    }
    return s;
  } };
}
function te(t) {
  return Array.isArray(t) ? t : [t];
}
function Oe(t, e = "", n = [], s = []) {
  const r = te(t);
  for (let o = 0, a = r.length; o < a; o++) {
    const c = r[o];
    if (c && typeof c == "object") {
      c.hasOwnProperty("path") || (c.path = "");
      const f = Le(c, e);
      for (const h of f) {
        n.push(h);
        const l = Array.isArray(c.children) && c.children.length === 0;
        if (c.children && !l) Oe(c.children, h.pattern, n, s);
        else {
          const m = Se([...n], s.length);
          s.push(m);
        }
        n.pop();
      }
    }
  }
  return n.length ? s : s.sort((o, a) => a.score - o.score);
}
function $(t, e) {
  for (let n = 0, s = t.length; n < s; n++) {
    const r = t[n].matcher(e);
    if (r) return r;
  }
  return [];
}
function _e(t, e, n) {
  const s = new URL(ve), r = createMemo((l) => {
    const m = t();
    try {
      return new URL(m, s);
    } catch {
      return console.error(`Invalid path ${m}`), l;
    }
  }, s, { equals: (l, m) => l.href === m.href }), o = createMemo(() => r().pathname), a = createMemo(() => r().search, true), c = createMemo(() => r().hash), f = () => "", h = on(a, () => V$1(r()));
  return { get pathname() {
    return o();
  }, get search() {
    return a();
  }, get hash() {
    return c();
  }, get state() {
    return e();
  }, get key() {
    return f();
  }, query: n ? n(h) : Y$1(h) };
}
let R;
function Me() {
  return R;
}
function De(t, e, n, s = {}) {
  const { signal: [r, o], utils: a = {} } = t, c = a.parsePath || ((i) => i), f = a.renderPath || ((i) => i), h = a.beforeLeave || ge(), l = q("", s.base || "");
  if (l === void 0) throw new Error(`${l} is not a valid base path`);
  l && !r().value && o({ value: l, replace: true, scroll: false });
  const [m, d] = createSignal(false);
  let p;
  const y = (i, u) => {
    u.value === v() && u.state === L() || (p === void 0 && d(true), R = i, p = u, startTransition(() => {
      p === u && (C(p.value), ne(p.state), resetErrorBoundaries(), isServer || U[1]((g) => g.filter((P) => P.pending)));
    }).finally(() => {
      p === u && batch(() => {
        R = void 0, i === "navigate" && ae(p), d(false), p = void 0;
      });
    }));
  }, [v, C] = createSignal(r().value), [L, ne] = createSignal(r().state), S = _e(v, L, a.queryWrapper), O = [], U = createSignal(isServer ? ce() : []), z = createMemo(() => typeof s.transformUrl == "function" ? $(e(), s.transformUrl(S.pathname)) : $(e(), S.pathname)), H = () => {
    const i = z(), u = {};
    for (let g = 0; g < i.length; g++) Object.assign(u, i[g].params);
    return u;
  }, re = a.paramsWrapper ? a.paramsWrapper(H, e) : Y$1(H), K = { pattern: l, path: () => l, outlet: () => null, resolvePath(i) {
    return q(l, i);
  } };
  return createRenderEffect(on(r, (i) => y("native", i), { defer: true })), { base: K, location: S, params: re, isRouting: m, renderPath: f, parsePath: c, navigatorFactory: oe, matches: z, beforeLeave: h, preloadRoute: ie, singleFlight: s.singleFlight === void 0 ? true : s.singleFlight, submissions: U };
  function se(i, u, g) {
    untrack(() => {
      if (typeof u == "number") {
        u && (a.go ? a.go(u) : console.warn("Router integration does not support relative routing"));
        return;
      }
      const P = !u || u[0] === "?", { replace: _, resolve: x, scroll: j, state: b } = { replace: false, resolve: !P, scroll: true, ...g }, A = x ? i.resolvePath(u) : q(P && S.pathname || "", u);
      if (A === void 0) throw new Error(`Path '${u}' is not a routable path`);
      if (O.length >= Ae) throw new Error("Too many redirects");
      const T = v();
      if (A !== T || b !== L()) if (isServer) {
        const k = getRequestEvent();
        k && (k.response = { status: 302, headers: new Headers({ Location: A }) }), o({ value: A, replace: _, scroll: j, state: b });
      } else h.confirm(A, g) && (O.push({ value: T, replace: _, scroll: j, state: L() }), y("navigate", { value: A, state: b }));
    });
  }
  function oe(i) {
    return i = i || useContext(ee) || K, (u, g) => se(i, u, g);
  }
  function ae(i) {
    const u = O[0];
    u && (o({ ...i, replace: u.replace, scroll: u.scroll }), O.length = 0);
  }
  function ie(i, u) {
    const g = $(e(), i.pathname), P = R;
    R = "preload";
    for (let _ in g) {
      const { route: x, params: j } = g[_];
      x.component && x.component.preload && x.component.preload();
      const { preload: b } = x;
      u && b && runWithOwner(n(), () => b({ params: j, location: { pathname: i.pathname, search: i.search, hash: i.hash, query: V$1(i), state: null, key: "" }, intent: "preload" }));
    }
    R = P;
  }
  function ce() {
    const i = getRequestEvent();
    return i && i.router && i.router.submission ? [i.router.submission] : [];
  }
}
function Ue(t, e, n, s) {
  const { base: r, location: o, params: a } = t, { pattern: c, component: f, preload: h } = s().route, l = createMemo(() => s().path);
  f && f.preload && f.preload();
  const m = h ? h({ params: a, location: o, intent: R || "initial" }) : void 0;
  return { parent: e, pattern: c, path: l, outlet: () => f ? createComponent(f, { params: a, location: o, data: m, get children() {
    return n();
  } }) : n(), resolvePath(p) {
    return q(r.path(), p, l());
  } };
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
function lt(e) {
  let r;
  const t = se(e), n = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(t, { ...n, body: e.node.req.body }) : new Request(t, { ...n, get body() {
    return r || (r = Rt(e), r);
  } });
}
function dt(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: lt(e), url: se(e) }, e.web.request;
}
function pt() {
  return Tt();
}
const ne = /* @__PURE__ */ Symbol("$HTTPEvent");
function ht(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[ne]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function y(e) {
  return function(...r) {
    var _a;
    let t = r[0];
    if (ht(t)) r[0] = t instanceof H3Event || t.__is_event__ ? t : t[ne];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = pt(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      r.unshift(t);
    }
    return e(...r);
  };
}
const se = y(getRequestURL$1), ft = y(getRequestIP), I = y(setResponseStatus$1), K = y(getResponseStatus), mt = y(getResponseStatusText), L = y(getResponseHeaders), J = y(getResponseHeader$1), gt = y(setResponseHeader$1), yt = y(appendResponseHeader$1), G = y(sendRedirect$1), wt = y(getCookie), bt = y(setCookie), vt = y(setHeader), Rt = y(getRequestWebStream), Et = y(removeResponseHeader$1), St = y(dt);
function $t() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Tt() {
  return $t().use().event;
}
const oe = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_2...404_.mjs'), import: () => import('../build/_2...404_.mjs') }, path: "/*404", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/[...404].tsx" }, { page: true, $component: { src: "src/routes/about.tsx?pick=default&pick=$css", build: () => import('../build/about2.mjs'), import: () => import('../build/about2.mjs') }, path: "/about", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/about.tsx" }, { page: true, $component: { src: "src/routes/app.tsx?pick=default&pick=$css", build: () => import('../build/app2.mjs'), import: () => import('../build/app2.mjs') }, path: "/app", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index2.mjs'), import: () => import('../build/index2.mjs') }, path: "/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/licenses.tsx?pick=default&pick=$css", build: () => import('../build/licenses2.mjs'), import: () => import('../build/licenses2.mjs') }, path: "/licenses", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/licenses.tsx" }], At = Ct(oe.filter((e) => e.page));
function Ct(e) {
  function r(t, n, s, o) {
    const a = Object.values(t).find((i) => s.startsWith(i.id + "/"));
    return a ? (r(a.children || (a.children = []), n, s.slice(a.id.length)), t) : (t.push({ ...n, id: s, path: s.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return e.sort((t, n) => t.path.length - n.path.length).reduce((t, n) => r(t, n, n.path, n.path), []);
}
function xt(e, r) {
  const t = Pt.lookup(e);
  if (t && t.route) {
    const n = t.route, s = r === "HEAD" ? n.$HEAD || n.$GET : n[`$${r}`];
    if (s === void 0) return;
    const o = n.page === true && n.$component !== void 0;
    return { handler: s, params: t.params, isPage: o };
  }
}
function kt(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
const Pt = createRouter({ routes: oe.reduce((e, r) => {
  if (!kt(r)) return e;
  let t = r.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (n, s) => `**:${s}`).split("/").map((n) => n.startsWith(":") || n.startsWith("*") ? n : encodeURIComponent(n)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (e[t]) throw new Error(`Duplicate API routes for "${t}" found at "${e[t].route.path}" and "${r.path}"`);
  return e[t] = { route: r }, e;
}, {}) }), O = "solidFetchEvent";
function Lt(e) {
  return { request: St(e), response: Ot(e), clientAddress: ft(e), locals: {}, nativeEvent: e };
}
function Ht(e) {
  if (!e.context[O]) {
    const r = Lt(e);
    e.context[O] = r;
  }
  return e.context[O];
}
class qt {
  constructor(r) {
    __publicField(this, "event");
    this.event = r;
  }
  get(r) {
    const t = J(this.event, r);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(r) {
    return this.get(r) !== null;
  }
  set(r, t) {
    return gt(this.event, r, t);
  }
  delete(r) {
    return Et(this.event, r);
  }
  append(r, t) {
    yt(this.event, r, t);
  }
  getSetCookie() {
    const r = J(this.event, "Set-Cookie");
    return Array.isArray(r) ? r : [r];
  }
  forEach(r) {
    return Object.entries(L(this.event)).forEach(([t, n]) => r(Array.isArray(n) ? n.join(", ") : n, t, this));
  }
  entries() {
    return Object.entries(L(this.event)).map(([r, t]) => [r, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(L(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(L(this.event)).map((r) => Array.isArray(r) ? r.join(", ") : r)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function Ot(e) {
  return { get status() {
    return K(e);
  }, set status(r) {
    I(e, r);
  }, get statusText() {
    return mt(e);
  }, set statusText(r) {
    I(e, K(e), r);
  }, headers: new qt(e) };
}
var It = " ";
const jt = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(It), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function j(e, r) {
  let { tag: t, attrs: { key: n, ...s } = { key: void 0 }, children: o } = e;
  return jt[t]({ attrs: { ...s, nonce: r }, key: n, children: o });
}
function Ft(e, r, t, n = "default") {
  return lazy(async () => {
    var _a;
    {
      const o = (await e.import())[n], i = (await ((_a = r.inputs) == null ? void 0 : _a[e.src].assets())).filter((u) => u.tag === "style" || u.attrs.rel === "stylesheet");
      return { default: (u) => [...i.map((f) => j(f)), createComponent(o, u)] };
    }
  });
}
function ae() {
  function e(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && Ft(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(e) : void 0 };
  }
  return At.map(e);
}
let V;
const Mt = isServer ? () => getRequestEvent().routes : () => V || (V = ae());
function Ut(e) {
  const r = wt(e.nativeEvent, "flash");
  if (r) try {
    let t = JSON.parse(r);
    if (!t || !t.result) return;
    const n = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], s = t.error ? new Error(t.result) : t.result;
    return { input: n, url: t.url, pending: false, result: t.thrown ? void 0 : s, error: t.thrown ? s : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    bt(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function _t(e) {
  const r = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await r.json(), assets: [...await r.inputs[r.handler].assets()], router: { submission: Ut(e) }, routes: ae(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const Bt = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function F(e) {
  return e.status && Bt.has(e.status) ? e.status : 302;
}
function Wt(e, r, t = {}, n) {
  return eventHandler$1({ handler: (s) => {
    const o = Ht(s);
    return provideRequestEvent(o, async () => {
      const a = xt(new URL(o.request.url).pathname, o.request.method);
      if (a) {
        const m = await a.handler.import(), w = o.request.method === "HEAD" ? m.HEAD || m.GET : m[o.request.method];
        o.params = a.params || {}, sharedConfig.context = { event: o };
        const l = await w(o);
        if (l !== void 0) return l;
        if (o.request.method !== "GET") throw new Error(`API handler for ${o.request.method} "${o.request.url}" did not return a response.`);
        if (!a.isPage) return;
      }
      const i = await r(o), c = typeof t == "function" ? await t(i) : { ...t }, u = c.mode || "stream";
      if (c.nonce && (i.nonce = c.nonce), u === "sync") {
        const m = renderToString(() => (sharedConfig.context.event = i, e(i)), c);
        if (i.complete = true, i.response && i.response.headers.get("Location")) {
          const w = F(i.response);
          return G(s, i.response.headers.get("Location"), w);
        }
        return m;
      }
      if (c.onCompleteAll) {
        const m = c.onCompleteAll;
        c.onCompleteAll = (w) => {
          Q(i)(w), m(w);
        };
      } else c.onCompleteAll = Q(i);
      if (c.onCompleteShell) {
        const m = c.onCompleteShell;
        c.onCompleteShell = (w) => {
          Y(i, s)(), m(w);
        };
      } else c.onCompleteShell = Y(i, s);
      const f = renderToStream(() => (sharedConfig.context.event = i, e(i)), c);
      if (i.response && i.response.headers.get("Location")) {
        const m = F(i.response);
        return G(s, i.response.headers.get("Location"), m);
      }
      if (u === "async") return f;
      const { writable: E, readable: R } = new TransformStream();
      return f.pipeTo(E), R;
    });
  } });
}
function Y(e, r) {
  return () => {
    if (e.response && e.response.headers.get("Location")) {
      const t = F(e.response);
      I(r, t), vt(r, "Location", e.response.headers.get("Location"));
    }
  };
}
function Q(e) {
  return ({ write: r }) => {
    e.complete = true;
    const t = e.response && e.response.headers.get("Location");
    t && r(`<script>window.location="${t}"<\/script>`);
  };
}
function Dt(e, r, t) {
  return Wt(e, _t, r);
}
const ie = createContext(), ce = ["title", "meta"], M = [], U = ["name", "http-equiv", "content", "charset", "media"].concat(["property"]), H = (e, r) => {
  const t = Object.fromEntries(Object.entries(e.props).filter(([n]) => r.includes(n)).sort());
  return (Object.hasOwn(t, "name") || Object.hasOwn(t, "property")) && (t.name = t.name || t.property, delete t.property), e.tag + JSON.stringify(t);
};
function zt() {
  if (!sharedConfig.context) {
    const t = document.head.querySelectorAll("[data-sm]");
    Array.prototype.forEach.call(t, (n) => n.parentNode.removeChild(n));
  }
  const e = /* @__PURE__ */ new Map();
  function r(t) {
    if (t.ref) return t.ref;
    let n = document.querySelector(`[data-sm="${t.id}"]`);
    return n ? (n.tagName.toLowerCase() !== t.tag && (n.parentNode && n.parentNode.removeChild(n), n = document.createElement(t.tag)), n.removeAttribute("data-sm")) : n = document.createElement(t.tag), n;
  }
  return { addTag(t) {
    if (ce.indexOf(t.tag) !== -1) {
      const o = t.tag === "title" ? M : U, a = H(t, o);
      e.has(a) || e.set(a, []);
      let i = e.get(a), c = i.length;
      i = [...i, t], e.set(a, i);
      let u = r(t);
      t.ref = u, spread(u, t.props);
      let f = null;
      for (var n = c - 1; n >= 0; n--) if (i[n] != null) {
        f = i[n];
        break;
      }
      return u.parentNode != document.head && document.head.appendChild(u), f && f.ref && f.ref.parentNode && document.head.removeChild(f.ref), c;
    }
    let s = r(t);
    return t.ref = s, spread(s, t.props), s.parentNode != document.head && document.head.appendChild(s), -1;
  }, removeTag(t, n) {
    const s = t.tag === "title" ? M : U, o = H(t, s);
    if (t.ref) {
      const a = e.get(o);
      if (a) {
        if (t.ref.parentNode) {
          t.ref.parentNode.removeChild(t.ref);
          for (let i = n - 1; i >= 0; i--) a[i] != null && document.head.appendChild(a[i].ref);
        }
        a[n] = null, e.set(o, a);
      } else t.ref.parentNode && t.ref.parentNode.removeChild(t.ref);
    }
  } };
}
function Kt() {
  const e = [];
  return useAssets(() => ssr(Yt(e))), { addTag(r) {
    if (ce.indexOf(r.tag) !== -1) {
      const t = r.tag === "title" ? M : U, n = H(r, t), s = e.findIndex((o) => o.tag === r.tag && H(o, t) === n);
      s !== -1 && e.splice(s, 1);
    }
    return e.push(r), e.length;
  }, removeTag(r, t) {
  } };
}
const Jt = (e) => {
  const r = isServer ? Kt() : zt();
  return createComponent$1(ie.Provider, { value: r, get children() {
    return e.children;
  } });
}, Gt = (e, r, t) => (Vt({ tag: e, props: r, setting: t, id: createUniqueId(), get name() {
  return r.name || r.property;
} }), null);
function Vt(e) {
  const r = useContext(ie);
  if (!r) throw new Error("<MetaProvider /> should be in the tree");
  createRenderEffect(() => {
    const t = r.addTag(e);
    onCleanup(() => r.removeTag(e, t));
  });
}
function Yt(e) {
  return e.map((r) => {
    var _a, _b;
    const n = Object.keys(r.props).map((o) => o === "children" ? "" : ` ${o}="${escape(r.props[o], true)}"`).join("");
    let s = r.props.children;
    return Array.isArray(s) && (s = s.join("")), ((_a = r.setting) == null ? void 0 : _a.close) ? `<${r.tag} data-sm="${r.id}"${n}>${((_b = r.setting) == null ? void 0 : _b.escape) ? escape(s) : s || ""}</${r.tag}>` : `<${r.tag} data-sm="${r.id}"${n}/>`;
  }).join("");
}
const Qt = (e) => Gt("title", e, { escape: true, close: true }), ue = (e) => (r) => {
  const { base: t } = r, n = children(() => r.children), s = createMemo(() => Oe(n(), r.base || ""));
  let o;
  const a = De(e, s, () => o, { base: t, singleFlight: r.singleFlight, transformUrl: r.transformUrl });
  return e.create && e.create(a), createComponent$1(Ce.Provider, { value: a, get children() {
    return createComponent$1(Xt, { routerState: a, get root() {
      return r.root;
    }, get preload() {
      return r.rootPreload || r.rootLoad;
    }, get children() {
      return [(o = getOwner()) && null, createComponent$1(Zt, { routerState: a, get branches() {
        return s();
      } })];
    } });
  } });
};
function Xt(e) {
  const r = e.routerState.location, t = e.routerState.params, n = createMemo(() => e.preload && untrack(() => {
    e.preload({ params: t, location: r, intent: Me() || "initial" });
  }));
  return createComponent$1(Show, { get when() {
    return e.root;
  }, keyed: true, get fallback() {
    return e.children;
  }, children: (s) => createComponent$1(s, { params: t, location: r, get data() {
    return n();
  }, get children() {
    return e.children;
  } }) });
}
function Zt(e) {
  if (isServer) {
    const s = getRequestEvent();
    if (s && s.router && s.router.dataOnly) {
      er(s, e.routerState, e.branches);
      return;
    }
    s && ((s.router || (s.router = {})).matches || (s.router.matches = e.routerState.matches().map(({ route: o, path: a, params: i }) => ({ path: o.originalPath, pattern: o.pattern, match: a, params: i, info: o.info }))));
  }
  const r = [];
  let t;
  const n = createMemo(on(e.routerState.matches, (s, o, a) => {
    let i = o && s.length === o.length;
    const c = [];
    for (let u = 0, f = s.length; u < f; u++) {
      const E = o && o[u], R = s[u];
      a && E && R.route.key === E.route.key ? c[u] = a[u] : (i = false, r[u] && r[u](), createRoot((m) => {
        r[u] = m, c[u] = Ue(e.routerState, c[u - 1] || e.routerState.base, X(() => n()[u + 1]), () => {
          var _a;
          const w = e.routerState.matches();
          return (_a = w[u]) != null ? _a : w[0];
        });
      }));
    }
    return r.splice(s.length).forEach((u) => u()), a && i ? a : (t = c[0], c);
  }));
  return X(() => n() && t)();
}
const X = (e) => () => createComponent$1(Show, { get when() {
  return e();
}, keyed: true, children: (r) => createComponent$1(ee.Provider, { value: r, get children() {
  return r.outlet();
} }) });
function er(e, r, t) {
  const n = new URL(e.request.url), s = $(t, new URL(e.router.previousUrl || e.request.url).pathname), o = $(t, n.pathname);
  for (let a = 0; a < o.length; a++) {
    (!s[a] || o[a].route !== s[a].route) && (e.router.dataOnly = true);
    const { route: i, params: c } = o[a];
    i.preload && i.preload({ params: c, location: r.location, intent: "preload" });
  }
}
function tr([e, r], t, n) {
  return [e, n ? (s) => r(n(s)) : r];
}
function rr(e) {
  let r = false;
  const t = (s) => typeof s == "string" ? { value: s } : s, n = tr(createSignal(t(e.get()), { equals: (s, o) => s.value === o.value && s.state === o.state }), void 0, (s) => (!r && e.set(s), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), s));
  return e.init && onCleanup(e.init((s = e.get()) => {
    r = true, n[1](t(s)), r = false;
  })), ue({ signal: n, create: e.create, utils: e.utils });
}
function nr(e, r, t) {
  return e.addEventListener(r, t), () => e.removeEventListener(r, t);
}
function sr(e, r) {
  const t = e && document.getElementById(e);
  t ? t.scrollIntoView() : r && window.scrollTo(0, 0);
}
function or(e) {
  const r = new URL(e);
  return r.pathname + r.search;
}
function ar(e) {
  let r;
  const t = { value: e.url || (r = getRequestEvent()) && or(r.request.url) || "" };
  return ue({ signal: [() => t, (n) => Object.assign(t, n)] })(e);
}
const ir = /* @__PURE__ */ new Map();
function cr({ preload: e = true, explicitLinks: r = false, actionBase: t = "/_server", transformUrl: n } = {}) {
  return (s) => {
    const o = s.base.path(), a = s.navigatorFactory(s.base);
    let i, c;
    function u(l) {
      return l.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function f(l) {
      if (l.defaultPrevented || l.button !== 0 || l.metaKey || l.altKey || l.ctrlKey || l.shiftKey) return;
      const d = l.composedPath().find((W) => W instanceof Node && W.nodeName.toUpperCase() === "A");
      if (!d || r && !d.hasAttribute("link")) return;
      const g = u(d), h = g ? d.href.baseVal : d.href;
      if ((g ? d.target.baseVal : d.target) || !h && !d.hasAttribute("state")) return;
      const A = (d.getAttribute("rel") || "").split(/\s+/);
      if (d.hasAttribute("download") || A && A.includes("external")) return;
      const x = g ? new URL(h, document.baseURI) : new URL(h);
      if (!(x.origin !== window.location.origin || o && x.pathname && !x.pathname.toLowerCase().startsWith(o.toLowerCase()))) return [d, x];
    }
    function E(l) {
      const d = f(l);
      if (!d) return;
      const [g, h] = d, B = s.parsePath(h.pathname + h.search + h.hash), A = g.getAttribute("state");
      l.preventDefault(), a(B, { resolve: false, replace: g.hasAttribute("replace"), scroll: !g.hasAttribute("noscroll"), state: A ? JSON.parse(A) : void 0 });
    }
    function R(l) {
      const d = f(l);
      if (!d) return;
      const [g, h] = d;
      n && (h.pathname = n(h.pathname)), s.preloadRoute(h, g.getAttribute("preload") !== "false");
    }
    function m(l) {
      clearTimeout(i);
      const d = f(l);
      if (!d) return c = null;
      const [g, h] = d;
      c !== g && (n && (h.pathname = n(h.pathname)), i = setTimeout(() => {
        s.preloadRoute(h, g.getAttribute("preload") !== "false"), c = g;
      }, 20));
    }
    function w(l) {
      if (l.defaultPrevented) return;
      let d = l.submitter && l.submitter.hasAttribute("formaction") ? l.submitter.getAttribute("formaction") : l.target.getAttribute("action");
      if (!d) return;
      if (!d.startsWith("https://action/")) {
        const h = new URL(d, ve);
        if (d = s.parsePath(h.pathname + h.search), !d.startsWith(t)) return;
      }
      if (l.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const g = ir.get(d);
      if (g) {
        l.preventDefault();
        const h = new FormData(l.target, l.submitter);
        g.call({ r: s, f: l.target }, l.target.enctype === "multipart/form-data" ? h : new URLSearchParams(h));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", E), e && (document.addEventListener("mousemove", m, { passive: true }), document.addEventListener("focusin", R, { passive: true }), document.addEventListener("touchstart", R, { passive: true })), document.addEventListener("submit", w), onCleanup(() => {
      document.removeEventListener("click", E), e && (document.removeEventListener("mousemove", m), document.removeEventListener("focusin", R), document.removeEventListener("touchstart", R)), document.removeEventListener("submit", w);
    });
  };
}
function ur(e) {
  if (isServer) return ar(e);
  const r = () => {
    const n = window.location.pathname.replace(/^\/+/, "/") + window.location.search, s = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: n + window.location.hash, state: s };
  }, t = ge();
  return rr({ get: r, set({ value: n, replace: s, scroll: o, state: a }) {
    s ? window.history.replaceState(Fe(a), "", n) : window.history.pushState(a, "", n), sr(decodeURIComponent(window.location.hash.slice(1)), o), Q$1();
  }, init: (n) => nr(window, "popstate", qe(n, (s) => {
    if (s) return !t.confirm(s);
    {
      const o = r();
      return !t.confirm(o.value, { state: o.state });
    }
  })), create: cr({ preload: e.preload, explicitLinks: e.explicitLinks, actionBase: e.actionBase, transformUrl: e.transformUrl }), utils: { go: (n) => window.history.go(n), beforeLeave: t } })(e);
}
function lr() {
  return createComponent$1(ur, { root: (e) => createComponent$1(Jt, { get children() {
    return [createComponent$1(Qt, { children: "PDF\u7FFB\u8A33" }), createComponent$1(Suspense, { get children() {
      return e.children;
    } })];
  } }), get children() {
    return createComponent$1(Mt, {});
  } });
}
const le = isServer ? (e) => {
  const r = getRequestEvent();
  return r.response.status = e.code, r.response.statusText = e.text, onCleanup(() => !r.nativeEvent.handled && !r.complete && (r.response.status = 200)), null;
} : (e) => null;
var dr = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">', "</span>"], pr = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">500 | Internal Server Error</span>'];
const hr = (e) => {
  const r = isServer ? "500 | Internal Server Error" : "Error | Uncaught Client Exception";
  return createComponent$1(ErrorBoundary, { fallback: (t) => (console.error(t), [ssr(dr, ssrHydrationKey(), escape(r)), createComponent$1(le, { code: 500 })]), get children() {
    return e.children;
  } });
}, fr = (e) => {
  let r = false;
  const t = catchError(() => e.children, (n) => {
    console.error(n), r = !!n;
  });
  return r ? [ssr(pr, ssrHydrationKey()), createComponent$1(le, { code: 500 })] : t;
};
var Z = ["<script", ">", "<\/script>"], mr = ["<script", ' type="module"', " async", "><\/script>"], gr = ["<script", ' type="module" async', "><\/script>"];
const yr = ssr("<!DOCTYPE html>");
function de(e, r, t = []) {
  for (let n = 0; n < r.length; n++) {
    const s = r[n];
    if (s.path !== e[0].path) continue;
    let o = [...t, s];
    if (s.children) {
      const a = e.slice(1);
      if (a.length === 0 || (o = de(a, s.children, o), !o)) continue;
    }
    return o;
  }
}
function wr(e) {
  const r = getRequestEvent(), t = r.nonce;
  let n = [];
  return Promise.resolve().then(async () => {
    let s = [];
    if (r.router && r.router.matches) {
      const o = [...r.router.matches];
      for (; o.length && (!o[0].info || !o[0].info.filesystem); ) o.shift();
      const a = o.length && de(o, r.routes);
      if (a) {
        const i = globalThis.MANIFEST.client.inputs;
        for (let c = 0; c < a.length; c++) {
          const u = a[c], f = i[u.$component.src];
          s.push(f.assets());
        }
      }
    }
    n = await Promise.all(s).then((o) => [...new Map(o.flat().map((a) => [a.attrs.key, a])).values()].filter((a) => a.attrs.rel === "modulepreload" && !r.assets.find((i) => i.attrs.key === a.attrs.key)));
  }), useAssets(() => n.length ? n.map((s) => j(s)) : void 0), createComponent$1(NoHydration, { get children() {
    return [yr, createComponent$1(fr, { get children() {
      return createComponent$1(e.document, { get assets() {
        return [createComponent$1(HydrationScript, {}), r.assets.map((s) => j(s, t))];
      }, get scripts() {
        return t ? [ssr(Z, ssrHydrationKey() + ssrAttribute("nonce", escape(t, true), false), `window.manifest = ${JSON.stringify(r.manifest)}`), ssr(mr, ssrHydrationKey(), ssrAttribute("nonce", escape(t, true), false), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))] : [ssr(Z, ssrHydrationKey(), `window.manifest = ${JSON.stringify(r.manifest)}`), ssr(gr, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))];
      }, get children() {
        return createComponent$1(Hydration, { get children() {
          return createComponent$1(hr, { get children() {
            return createComponent$1(lr, {});
          } });
        } });
      } });
    } })];
  } });
}
var br = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg">', "</head>"], vr = ["<html", ' lang="ja">', '<body><div id="root">', "</div><!--$-->", "<!--/--></body></html>"];
const kr = Dt(() => createComponent$1(wr, { document: ({ assets: e, children: r, scripts: t }) => ssr(vr, ssrHydrationKey(), createComponent$1(NoHydration, { get children() {
  return ssr(br, escape(e));
} }), escape(r), escape(t)) }));

const handlers = [
  { route: '', handler: _zYMrMB, lazy: false, middleware: true, method: undefined },
  { route: '/_server', handler: Lt$1, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: kr, lazy: false, middleware: true, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  {
    const _handler = h3App.handler;
    h3App.handler = (event) => {
      const ctx = { event };
      return nitroAsyncContext.callAsync(ctx, () => _handler(event));
    };
  }
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

const nitroApp = useNitroApp();
const localFetch = nitroApp.localFetch;
const closePrerenderer = () => nitroApp.hooks.callHook("close");
trapUnhandledNodeErrors();

export { $e as $, E, Ft$1 as F, Ie as I, We as W, closePrerenderer as c, localFetch as l };
//# sourceMappingURL=nitro.mjs.map
