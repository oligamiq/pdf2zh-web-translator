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
import { sharedConfig, lazy, createComponent, createUniqueId, useContext, createRenderEffect, onCleanup, createContext, createSignal, mergeProps as mergeProps$1, splitProps, createMemo, on, runWithOwner, getOwner, startTransition, resetErrorBoundaries, batch, untrack, catchError, ErrorBoundary, Suspense, children, onMount, Show, createRoot } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/dist/server.js';
import { renderToString, isServer, getRequestEvent, ssrElement, escape, mergeProps, ssr, createComponent as createComponent$1, useAssets, spread, renderToStream, ssrHydrationKey, NoHydration, Hydration, ssrAttribute, HydrationScript, delegateEvents } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/dist/server.js';
import { provideRequestEvent } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/web/storage/dist/storage.js';
import { eventHandler as eventHandler$1, H3Event, getRequestIP, parseCookies, getResponseStatus, getResponseStatusText, getCookie, setCookie, getResponseHeader as getResponseHeader$1, setResponseHeader as setResponseHeader$1, removeResponseHeader as removeResponseHeader$1, getResponseHeaders, getRequestURL as getRequestURL$1, getRequestWebStream, setResponseStatus as setResponseStatus$1, appendResponseHeader as appendResponseHeader$1, setHeader, sendRedirect as sendRedirect$1 } from 'file:///srv/pdf2zh-web/v2/node_modules/h3/dist/index.mjs';
import { fromJSON, Feature, crossSerializeStream, getCrossReferenceHeader, toCrossJSONStream } from 'file:///srv/pdf2zh-web/v2/node_modules/seroval/dist/esm/production/index.mjs';
import { AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin } from 'file:///srv/pdf2zh-web/v2/node_modules/seroval-plugins/dist/esm/production/web.mjs';
import { initializeApp } from 'file:///srv/pdf2zh-web/v2/frontend/node_modules/firebase/app/dist/index.mjs';
import { getAuth, onAuthStateChanged } from 'file:///srv/pdf2zh-web/v2/frontend/node_modules/firebase/auth/dist/index.mjs';

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
					const buildManifest = {"ssr":{"_authState-BZctefYf.js":{"file":"assets/authState-BZctefYf.js","name":"authState"},"_clientOnly-zGwykQvR.js":{"file":"assets/clientOnly-zGwykQvR.js","name":"clientOnly"},"_components-CRSEIZ-T.js":{"file":"assets/components-CRSEIZ-T.js","name":"components"},"_index-BSDoL9aR.js":{"file":"assets/index-BSDoL9aR.js","name":"index"},"src/api.ts":{"file":"assets/api-BVYrDQoa.js","name":"api","src":"src/api.ts","isDynamicEntry":true,"imports":["src/firebase.ts","_authState-BZctefYf.js"]},"src/firebase.ts":{"file":"assets/firebase-D_DCxAHy.js","name":"firebase","src":"src/firebase.ts","isDynamicEntry":true,"imports":["_authState-BZctefYf.js"]},"src/pages/AdvancedSettings.tsx":{"file":"assets/AdvancedSettings-KvVP6GjM.js","name":"AdvancedSettings","src":"src/pages/AdvancedSettings.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/pages/Dashboard.tsx":{"file":"assets/Dashboard-BRfvzQ_2.js","name":"Dashboard","src":"src/pages/Dashboard.tsx","isDynamicEntry":true,"imports":["src/api.ts","_components-CRSEIZ-T.js","_authState-BZctefYf.js","src/firebase.ts"],"dynamicImports":["src/api.ts"]},"src/pages/JobDetail.tsx":{"file":"assets/JobDetail-D-9qnIq9.js","name":"JobDetail","src":"src/pages/JobDetail.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/pages/Settings.tsx":{"file":"assets/Settings-3Vgv_c5d.js","name":"Settings","src":"src/pages/Settings.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"about.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"app.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_authState-BZctefYf.js"],"dynamicImports":["src/firebase.ts"]},"src/routes/app/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/app/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BSDoL9aR.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/Dashboard.tsx"]},"src/routes/app/jobs/[id].tsx?pick=default&pick=$css":{"file":"_id_.js","name":"_id_","src":"src/routes/app/jobs/[id].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BSDoL9aR.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/JobDetail.tsx"]},"src/routes/app/settings/advanced.tsx?pick=default&pick=$css":{"file":"advanced.js","name":"advanced","src":"src/routes/app/settings/advanced.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BSDoL9aR.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/AdvancedSettings.tsx"]},"src/routes/app/settings/index.tsx?pick=default&pick=$css":{"file":"index2.js","name":"index","src":"src/routes/app/settings/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BSDoL9aR.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/Settings.tsx"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index3.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"licenses.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"virtual:$vinxi/handler/ssr":{"file":"ssr.js","name":"ssr","src":"virtual:$vinxi/handler/ssr","isEntry":true,"imports":["_index-BSDoL9aR.js","src/firebase.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app/index.tsx?pick=default&pick=$css","src/routes/app/index.tsx?pick=default&pick=$css","src/routes/app/jobs/[id].tsx?pick=default&pick=$css","src/routes/app/jobs/[id].tsx?pick=default&pick=$css","src/routes/app/settings/advanced.tsx?pick=default&pick=$css","src/routes/app/settings/advanced.tsx?pick=default&pick=$css","src/routes/app/settings/index.tsx?pick=default&pick=$css","src/routes/app/settings/index.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css"],"css":["assets/ssr-CRg8N-3Q.css"]}},"client":{"_authState-naRImZiN.js":{"file":"assets/authState-naRImZiN.js","name":"authState","imports":["_web-aj4HSq75.js"]},"_clientOnly-BL7Bc29O.js":{"file":"assets/clientOnly-BL7Bc29O.js","name":"clientOnly","imports":["_web-aj4HSq75.js"]},"_components-DpNtMFx-.js":{"file":"assets/components-DpNtMFx-.js","name":"components","imports":["_web-aj4HSq75.js"]},"_index-BHatQeAG.js":{"file":"assets/index-BHatQeAG.js","name":"index","imports":["_web-aj4HSq75.js"]},"_index.esm-DqJqQEuR.js":{"file":"assets/index.esm-DqJqQEuR.js","name":"index.esm","isDynamicEntry":true},"_preload-helper-ug3pwPZ1.js":{"file":"assets/preload-helper-ug3pwPZ1.js","name":"preload-helper"},"_web-aj4HSq75.js":{"file":"assets/web-aj4HSq75.js","name":"web"},"src/api.ts":{"file":"assets/api-DEAzywWL.js","name":"api","src":"src/api.ts","isDynamicEntry":true,"imports":["src/firebase.ts","_authState-naRImZiN.js","_index.esm-DqJqQEuR.js","_web-aj4HSq75.js"]},"src/firebase.ts":{"file":"assets/firebase-Dl1QR6_l.js","name":"firebase","src":"src/firebase.ts","isDynamicEntry":true,"imports":["_index.esm-DqJqQEuR.js","_authState-naRImZiN.js","_web-aj4HSq75.js"]},"src/pages/AdvancedSettings.tsx":{"file":"assets/AdvancedSettings-BgkbAldS.js","name":"AdvancedSettings","src":"src/pages/AdvancedSettings.tsx","isDynamicEntry":true,"imports":["_web-aj4HSq75.js","src/api.ts","_authState-naRImZiN.js","_components-DpNtMFx-.js","src/firebase.ts","_index.esm-DqJqQEuR.js"]},"src/pages/Dashboard.tsx":{"file":"assets/Dashboard-DTntQaPw.js","name":"Dashboard","src":"src/pages/Dashboard.tsx","isDynamicEntry":true,"imports":["_web-aj4HSq75.js","src/api.ts","_components-DpNtMFx-.js","_preload-helper-ug3pwPZ1.js","_authState-naRImZiN.js","src/firebase.ts","_index.esm-DqJqQEuR.js"],"dynamicImports":["src/api.ts"]},"src/pages/JobDetail.tsx":{"file":"assets/JobDetail-B4EUupY1.js","name":"JobDetail","src":"src/pages/JobDetail.tsx","isDynamicEntry":true,"imports":["_web-aj4HSq75.js","src/api.ts","_authState-naRImZiN.js","_components-DpNtMFx-.js","src/firebase.ts","_index.esm-DqJqQEuR.js"]},"src/pages/Settings.tsx":{"file":"assets/Settings-DsJDK8bQ.js","name":"Settings","src":"src/pages/Settings.tsx","isDynamicEntry":true,"imports":["_web-aj4HSq75.js","src/api.ts","_authState-naRImZiN.js","_components-DpNtMFx-.js","src/firebase.ts","_index.esm-DqJqQEuR.js"]},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"assets/_...404_-D1MnJM87.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-aj4HSq75.js","_components-DpNtMFx-.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"assets/about-DIYgvfTZ.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-aj4HSq75.js","_components-DpNtMFx-.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"assets/app-TEiVdQbD.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_preload-helper-ug3pwPZ1.js","_web-aj4HSq75.js","_authState-naRImZiN.js"],"dynamicImports":["src/firebase.ts","_index.esm-DqJqQEuR.js"]},"src/routes/app/index.tsx?pick=default&pick=$css":{"file":"assets/index-CsxT8lLO.js","name":"index","src":"src/routes/app/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_preload-helper-ug3pwPZ1.js","_index-BHatQeAG.js","_clientOnly-BL7Bc29O.js","_web-aj4HSq75.js"],"dynamicImports":["src/pages/Dashboard.tsx"]},"src/routes/app/jobs/[id].tsx?pick=default&pick=$css":{"file":"assets/_id_-C5Z95y8E.js","name":"_id_","src":"src/routes/app/jobs/[id].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_preload-helper-ug3pwPZ1.js","_index-BHatQeAG.js","_clientOnly-BL7Bc29O.js","_web-aj4HSq75.js"],"dynamicImports":["src/pages/JobDetail.tsx"]},"src/routes/app/settings/advanced.tsx?pick=default&pick=$css":{"file":"assets/advanced-CGp5a0yV.js","name":"advanced","src":"src/routes/app/settings/advanced.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_preload-helper-ug3pwPZ1.js","_index-BHatQeAG.js","_clientOnly-BL7Bc29O.js","_web-aj4HSq75.js"],"dynamicImports":["src/pages/AdvancedSettings.tsx"]},"src/routes/app/settings/index.tsx?pick=default&pick=$css":{"file":"assets/index-C12zLh5D.js","name":"index","src":"src/routes/app/settings/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_preload-helper-ug3pwPZ1.js","_index-BHatQeAG.js","_clientOnly-BL7Bc29O.js","_web-aj4HSq75.js"],"dynamicImports":["src/pages/Settings.tsx"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"assets/index-yGW1Ht9I.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-aj4HSq75.js","_components-DpNtMFx-.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"assets/licenses-C8xkGeYG.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_web-aj4HSq75.js","_components-DpNtMFx-.js"]},"virtual:$vinxi/handler/client":{"file":"assets/client-CQnfUhH1.js","name":"client","src":"virtual:$vinxi/handler/client","isEntry":true,"imports":["_web-aj4HSq75.js","_index-BHatQeAG.js","_preload-helper-ug3pwPZ1.js","src/firebase.ts","_index.esm-DqJqQEuR.js","_authState-naRImZiN.js","_components-DpNtMFx-.js"],"dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app/index.tsx?pick=default&pick=$css","src/routes/app/jobs/[id].tsx?pick=default&pick=$css","src/routes/app/settings/advanced.tsx?pick=default&pick=$css","src/routes/app/settings/index.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css"],"css":["assets/client-CRg8N-3Q.css"]}},"server-fns":{"_authState-BZctefYf.js":{"file":"assets/authState-BZctefYf.js","name":"authState"},"_clientOnly-zGwykQvR.js":{"file":"assets/clientOnly-zGwykQvR.js","name":"clientOnly"},"_components-CRSEIZ-T.js":{"file":"assets/components-CRSEIZ-T.js","name":"components"},"_index-BgYMpQL1.js":{"file":"assets/index-BgYMpQL1.js","name":"index"},"_server-fns-kzhC1chi.js":{"file":"assets/server-fns-kzhC1chi.js","name":"server-fns","dynamicImports":["src/routes/[...404].tsx?pick=default&pick=$css","src/routes/[...404].tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/about.tsx?pick=default&pick=$css","src/routes/app/index.tsx?pick=default&pick=$css","src/routes/app/index.tsx?pick=default&pick=$css","src/routes/app/jobs/[id].tsx?pick=default&pick=$css","src/routes/app/jobs/[id].tsx?pick=default&pick=$css","src/routes/app/settings/advanced.tsx?pick=default&pick=$css","src/routes/app/settings/advanced.tsx?pick=default&pick=$css","src/routes/app/settings/index.tsx?pick=default&pick=$css","src/routes/app/settings/index.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/app.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/index.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/routes/licenses.tsx?pick=default&pick=$css","src/app.tsx"]},"src/api.ts":{"file":"assets/api-BVYrDQoa.js","name":"api","src":"src/api.ts","isDynamicEntry":true,"imports":["src/firebase.ts","_authState-BZctefYf.js"]},"src/app.tsx":{"file":"assets/app-pXVKcHzu.js","name":"app","src":"src/app.tsx","isDynamicEntry":true,"imports":["_index-BgYMpQL1.js","_server-fns-kzhC1chi.js","src/firebase.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js"],"css":["assets/app-CRg8N-3Q.css"]},"src/firebase.ts":{"file":"assets/firebase-D_DCxAHy.js","name":"firebase","src":"src/firebase.ts","isDynamicEntry":true,"imports":["_authState-BZctefYf.js"]},"src/pages/AdvancedSettings.tsx":{"file":"assets/AdvancedSettings-KvVP6GjM.js","name":"AdvancedSettings","src":"src/pages/AdvancedSettings.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/pages/Dashboard.tsx":{"file":"assets/Dashboard-BRfvzQ_2.js","name":"Dashboard","src":"src/pages/Dashboard.tsx","isDynamicEntry":true,"imports":["src/api.ts","_components-CRSEIZ-T.js","_authState-BZctefYf.js","src/firebase.ts"],"dynamicImports":["src/api.ts"]},"src/pages/JobDetail.tsx":{"file":"assets/JobDetail-D-9qnIq9.js","name":"JobDetail","src":"src/pages/JobDetail.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/pages/Settings.tsx":{"file":"assets/Settings-3Vgv_c5d.js","name":"Settings","src":"src/pages/Settings.tsx","isDynamicEntry":true,"imports":["src/api.ts","_authState-BZctefYf.js","_components-CRSEIZ-T.js","src/firebase.ts"]},"src/routes/[...404].tsx?pick=default&pick=$css":{"file":"_...404_.js","name":"_...404_","src":"src/routes/[...404].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/about.tsx?pick=default&pick=$css":{"file":"about.js","name":"about","src":"src/routes/about.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/app.tsx?pick=default&pick=$css":{"file":"app.js","name":"app","src":"src/routes/app.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_authState-BZctefYf.js"],"dynamicImports":["src/firebase.ts"]},"src/routes/app/index.tsx?pick=default&pick=$css":{"file":"index.js","name":"index","src":"src/routes/app/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BgYMpQL1.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/Dashboard.tsx"]},"src/routes/app/jobs/[id].tsx?pick=default&pick=$css":{"file":"_id_.js","name":"_id_","src":"src/routes/app/jobs/[id].tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BgYMpQL1.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/JobDetail.tsx"]},"src/routes/app/settings/advanced.tsx?pick=default&pick=$css":{"file":"advanced.js","name":"advanced","src":"src/routes/app/settings/advanced.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BgYMpQL1.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/AdvancedSettings.tsx"]},"src/routes/app/settings/index.tsx?pick=default&pick=$css":{"file":"index2.js","name":"index","src":"src/routes/app/settings/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_index-BgYMpQL1.js","_clientOnly-zGwykQvR.js"],"dynamicImports":["src/pages/Settings.tsx"]},"src/routes/index.tsx?pick=default&pick=$css":{"file":"index3.js","name":"index","src":"src/routes/index.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"src/routes/licenses.tsx?pick=default&pick=$css":{"file":"licenses.js","name":"licenses","src":"src/routes/licenses.tsx?pick=default&pick=$css","isEntry":true,"isDynamicEntry":true,"imports":["_components-CRSEIZ-T.js"]},"virtual:$vinxi/handler/server-fns":{"file":"server-fns.js","name":"server-fns","src":"virtual:$vinxi/handler/server-fns","isEntry":true,"imports":["_server-fns-kzhC1chi.js"]}}};

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
  let s;
  const t = _$1(e), n = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(t, { ...n, body: e.node.req.body }) : new Request(t, { ...n, get body() {
    return s || (s = Ge(e), s);
  } });
}
function ze$1(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: _e$1(e), url: _$1(e) }, e.web.request;
}
function je$1() {
  return Qe();
}
const U$1 = /* @__PURE__ */ Symbol("$HTTPEvent");
function Ne$1(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[U$1]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function u(e) {
  return function(...s) {
    var _a;
    let t = s[0];
    if (Ne$1(t)) s[0] = t instanceof H3Event || t.__is_event__ ? t : t[U$1];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (t = je$1(), !t) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      s.unshift(t);
    }
    return e(...s);
  };
}
const _$1 = u(getRequestURL$1), Me$1 = u(getRequestIP), S$1 = u(setResponseStatus$1), P$1 = u(getResponseStatus), De = u(getResponseStatusText), y$1 = u(getResponseHeaders), E$1 = u(getResponseHeader$1), We$1 = u(setResponseHeader$1), z = u(appendResponseHeader$1), Be$1 = u(parseCookies), Je$1 = u(getCookie), Xe$1 = u(setCookie), h = u(setHeader), Ge = u(getRequestWebStream), Ke$1 = u(removeResponseHeader$1), Ve = u(ze$1);
function Ze() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Qe() {
  return Ze().use().event;
}
const w$1 = "Invariant Violation", { setPrototypeOf: Ye = function(e, s) {
  return e.__proto__ = s, e;
} } = Object;
let k$1 = class k extends Error {
  constructor(s = w$1) {
    super(typeof s == "number" ? `${w$1}: ${s} (see https://github.com/apollographql/invariant-packages)` : s);
    __publicField$1(this, "framesToPop", 1);
    __publicField$1(this, "name", w$1);
    Ye(this, k.prototype);
  }
};
function et(e, s) {
  if (!e) throw new k$1(s);
}
const v$1 = "solidFetchEvent";
function tt(e) {
  return { request: Ve(e), response: ot(e), clientAddress: Me$1(e), locals: {}, nativeEvent: e };
}
function st(e) {
  return { ...e };
}
function rt(e) {
  if (!e.context[v$1]) {
    const s = tt(e);
    e.context[v$1] = s;
  }
  return e.context[v$1];
}
function q$2(e, s) {
  for (const [t, n] of s.entries()) z(e, t, n);
}
class nt {
  constructor(s) {
    __publicField$1(this, "event");
    this.event = s;
  }
  get(s) {
    const t = E$1(this.event, s);
    return Array.isArray(t) ? t.join(", ") : t || null;
  }
  has(s) {
    return this.get(s) !== null;
  }
  set(s, t) {
    return We$1(this.event, s, t);
  }
  delete(s) {
    return Ke$1(this.event, s);
  }
  append(s, t) {
    z(this.event, s, t);
  }
  getSetCookie() {
    const s = E$1(this.event, "Set-Cookie");
    return Array.isArray(s) ? s : [s];
  }
  forEach(s) {
    return Object.entries(y$1(this.event)).forEach(([t, n]) => s(Array.isArray(n) ? n.join(", ") : n, t, this));
  }
  entries() {
    return Object.entries(y$1(this.event)).map(([s, t]) => [s, Array.isArray(t) ? t.join(", ") : t])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(y$1(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(y$1(this.event)).map((s) => Array.isArray(s) ? s.join(", ") : s)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function ot(e) {
  return { get status() {
    return P$1(e);
  }, set status(s) {
    S$1(e, s);
  }, get statusText() {
    return De(e);
  }, set statusText(s) {
    S$1(e, P$1(e), s);
  }, headers: new nt(e) };
}
const j = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_...404_.mjs'), import: () => import('../build/_...404_.mjs') }, path: "/*404", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/[...404].tsx" }, { page: true, $component: { src: "src/routes/about.tsx?pick=default&pick=$css", build: () => import('../build/about.mjs'), import: () => import('../build/about.mjs') }, path: "/about", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/about.tsx" }, { page: true, $component: { src: "src/routes/app/index.tsx?pick=default&pick=$css", build: () => import('../build/index.mjs'), import: () => import('../build/index.mjs') }, path: "/app/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/index.tsx" }, { page: true, $component: { src: "src/routes/app/jobs/[id].tsx?pick=default&pick=$css", build: () => import('../build/_id_.mjs'), import: () => import('../build/_id_.mjs') }, path: "/app/jobs/:id", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/jobs/[id].tsx" }, { page: true, $component: { src: "src/routes/app/settings/advanced.tsx?pick=default&pick=$css", build: () => import('../build/advanced.mjs'), import: () => import('../build/advanced.mjs') }, path: "/app/settings/advanced", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/settings/advanced.tsx" }, { page: true, $component: { src: "src/routes/app/settings/index.tsx?pick=default&pick=$css", build: () => import('../build/index2.mjs'), import: () => import('../build/index2.mjs') }, path: "/app/settings/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/settings/index.tsx" }, { page: true, $component: { src: "src/routes/app.tsx?pick=default&pick=$css", build: () => import('../build/app.mjs'), import: () => import('../build/app.mjs') }, path: "/app", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index3.mjs'), import: () => import('../build/index3.mjs') }, path: "/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/licenses.tsx?pick=default&pick=$css", build: () => import('../build/licenses.mjs'), import: () => import('../build/licenses.mjs') }, path: "/licenses", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/licenses.tsx" }], at = it(j.filter((e) => e.page));
function it(e) {
  function s(t, n, o, a) {
    const i = Object.values(t).find((c) => o.startsWith(c.id + "/"));
    return i ? (s(i.children || (i.children = []), n, o.slice(i.id.length)), t) : (t.push({ ...n, id: o, path: o.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), t);
  }
  return e.sort((t, n) => t.path.length - n.path.length).reduce((t, n) => s(t, n, n.path, n.path), []);
}
function ct(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
createRouter({ routes: j.reduce((e, s) => {
  if (!ct(s)) return e;
  let t = s.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (n, o) => `**:${o}`).split("/").map((n) => n.startsWith(":") || n.startsWith("*") ? n : encodeURIComponent(n)).join("/");
  if (/:[^/]*\?/g.test(t)) throw new Error(`Optional parameters are not supported in API routes: ${t}`);
  if (e[t]) throw new Error(`Duplicate API routes for "${t}" found at "${e[t].route.path}" and "${s.path}"`);
  return e[t] = { route: s }, e;
}, {}) });
var pt$1 = " ";
const lt$1 = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(pt$1), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function dt$1(e, s) {
  let { tag: t, attrs: { key: n, ...o } = { key: void 0 }, children: a } = e;
  return lt$1[t]({ attrs: { ...o, nonce: s }, key: n, children: a });
}
function ft$1(e, s, t, n = "default") {
  return lazy(async () => {
    var _a;
    {
      const a = (await e.import())[n], c = (await ((_a = s.inputs) == null ? void 0 : _a[e.src].assets())).filter((p) => p.tag === "style" || p.attrs.rel === "stylesheet");
      return { default: (p) => [...c.map((g) => dt$1(g)), createComponent(a, p)] };
    }
  });
}
function N() {
  function e(t) {
    return { ...t, ...t.$$route ? t.$$route.require().route : void 0, info: { ...t.$$route ? t.$$route.require().route.info : {}, filesystem: true }, component: t.$component && ft$1(t.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: t.children ? t.children.map(e) : void 0 };
  }
  return at.map(e);
}
let H$1;
const Ft$1 = isServer ? () => getRequestEvent().routes : () => H$1 || (H$1 = N());
function ht$1(e) {
  const s = Je$1(e.nativeEvent, "flash");
  if (s) try {
    let t = JSON.parse(s);
    if (!t || !t.result) return;
    const n = [...t.input.slice(0, -1), new Map(t.input[t.input.length - 1])], o = t.error ? new Error(t.result) : t.result;
    return { input: n, url: t.url, pending: false, result: t.thrown ? void 0 : o, error: t.thrown ? o : void 0 };
  } catch (t) {
    console.error(t);
  } finally {
    Xe$1(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function gt$1(e) {
  const s = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await s.json(), assets: [...await s.inputs[s.handler].assets()], router: { submission: ht$1(e) }, routes: N(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const mt$1 = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function Rt$1(e) {
  return e.status && mt$1.has(e.status) ? e.status : 302;
}
const yt$1 = {}, T = [AbortSignalPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FormDataPlugin, HeadersPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLSearchParamsPlugin, URLPlugin], St$1 = 64, M$2 = Feature.RegExp;
function D(e) {
  const s = new TextEncoder().encode(e), t = s.length, n = t.toString(16), o = "00000000".substring(0, 8 - n.length) + n, a = new TextEncoder().encode(`;0x${o};`), i = new Uint8Array(12 + t);
  return i.set(a), i.set(s, 12), i;
}
function A$1(e, s) {
  return new ReadableStream({ start(t) {
    crossSerializeStream(s, { scopeId: e, plugins: T, onSerialize(n, o) {
      t.enqueue(D(o ? `(${getCrossReferenceHeader(e)},${n})` : n));
    }, onDone() {
      t.close();
    }, onError(n) {
      t.error(n);
    } });
  } });
}
function bt$1(e) {
  return new ReadableStream({ start(s) {
    toCrossJSONStream(e, { disabledFeatures: M$2, depthLimit: St$1, plugins: T, onParse(t) {
      s.enqueue(D(JSON.stringify(t)));
    }, onDone() {
      s.close();
    }, onError(t) {
      s.error(t);
    } });
  } });
}
async function C$1(e) {
  return fromJSON(JSON.parse(e), { plugins: T, disabledFeatures: M$2 });
}
async function wt$1(e) {
  const s = rt(e), t = s.request, n = t.headers.get("X-Server-Id"), o = t.headers.get("X-Server-Instance"), a = t.headers.has("X-Single-Flight"), i = new URL(t.url);
  let c, d;
  if (n) et(typeof n == "string", "Invalid server function"), [c, d] = decodeURIComponent(n).split("#");
  else if (c = i.searchParams.get("id"), d = i.searchParams.get("name"), !c || !d) return new Response(null, { status: 404 });
  const p = yt$1[c];
  let g;
  if (!p) return new Response(null, { status: 404 });
  g = await p.importer();
  const W = g[p.functionName];
  let f = [];
  if (!o || e.method === "GET") {
    const r = i.searchParams.get("args");
    if (r) {
      const l = await C$1(r);
      for (const m of l) f.push(m);
    }
  }
  if (e.method === "POST") {
    const r = t.headers.get("content-type"), l = e.node.req, m = l instanceof ReadableStream, B = l.body instanceof ReadableStream, J = m && l.locked || B && l.body.locked, X = m ? l : l.body, b = J ? t : new Request(t, { ...t, body: X });
    t.headers.get("x-serialized") ? f = await C$1(await b.text()) : (r == null ? void 0 : r.startsWith("multipart/form-data")) || (r == null ? void 0 : r.startsWith("application/x-www-form-urlencoded")) ? f.push(await b.formData()) : (r == null ? void 0 : r.startsWith("application/json")) && (f = await b.json());
  }
  try {
    let r = await provideRequestEvent(s, async () => (sharedConfig.context = { event: s }, s.locals.serverFunctionMeta = { id: c + "#" + d }, W(...f)));
    if (a && o && (r = await L$1(s, r)), r instanceof Response) {
      if (r.headers && r.headers.has("X-Content-Raw")) return r;
      o && (r.headers && q$2(e, r.headers), r.status && (r.status < 300 || r.status >= 400) && S$1(e, r.status), r.customBody ? r = await r.customBody() : r.body == null && (r = null));
    }
    if (!o) return F$1(r, t, f);
    return h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), A$1(o, r);
    return bt$1(r);
  } catch (r) {
    if (r instanceof Response) a && o && (r = await L$1(s, r)), r.headers && q$2(e, r.headers), r.status && (!o || r.status < 300 || r.status >= 400) && S$1(e, r.status), r.customBody ? r = r.customBody() : r.body == null && (r = null), h(e, "X-Error", "true");
    else if (o) {
      const l = r instanceof Error ? r.message : typeof r == "string" ? r : "true";
      h(e, "X-Error", l.replace(/[\r\n]+/g, ""));
    } else r = F$1(r, t, f, true);
    return o ? (h(e, "x-serialized", "true"), h(e, "content-type", "text/javascript"), A$1(o, r)) : r;
  }
}
function F$1(e, s, t, n) {
  const o = new URL(s.url), a = e instanceof Error;
  let i = 302, c;
  return e instanceof Response ? (c = new Headers(e.headers), e.headers.has("Location") && (c.set("Location", new URL(e.headers.get("Location"), o.origin + "").toString()), i = Rt$1(e))) : c = new Headers({ Location: new URL(s.headers.get("referer")).toString() }), e && c.append("Set-Cookie", `flash=${encodeURIComponent(JSON.stringify({ url: o.pathname + o.search, result: a ? e.message : e, thrown: n, error: a, input: [...t.slice(0, -1), [...t[t.length - 1].entries()]] }))}; Secure; HttpOnly;`), new Response(null, { status: i, headers: c });
}
let $$1;
function vt$1(e) {
  var _a;
  const s = new Headers(e.request.headers), t = Be$1(e.nativeEvent), n = e.response.headers.getSetCookie();
  s.delete("cookie");
  let o = false;
  return ((_a = e.nativeEvent.node) == null ? void 0 : _a.req) && (o = true, e.nativeEvent.node.req.headers.cookie = ""), n.forEach((a) => {
    if (!a) return;
    const { maxAge: i, expires: c, name: d, value: p } = parseSetCookie(a);
    if (i != null && i <= 0) {
      delete t[d];
      return;
    }
    if (c != null && c.getTime() <= Date.now()) {
      delete t[d];
      return;
    }
    t[d] = p;
  }), Object.entries(t).forEach(([a, i]) => {
    s.append("cookie", `${a}=${i}`), o && (e.nativeEvent.node.req.headers.cookie += `${a}=${i};`);
  }), s;
}
async function L$1(e, s) {
  let t, n = new URL(e.request.headers.get("referer")).toString();
  s instanceof Response && (s.headers.has("X-Revalidate") && (t = s.headers.get("X-Revalidate").split(",")), s.headers.has("Location") && (n = new URL(s.headers.get("Location"), new URL(e.request.url).origin + "").toString()));
  const o = st(e);
  return o.request = new Request(n, { headers: vt$1(e) }), await provideRequestEvent(o, async () => {
    await gt$1(o), $$1 || ($$1 = (await import('../build/app-pXVKcHzu.mjs')).default), o.router.dataOnly = t || true, o.router.previousUrl = e.request.headers.get("referer");
    try {
      renderToString(() => {
        sharedConfig.context.event = o, $$1();
      });
    } catch (c) {
      console.log(c);
    }
    const a = o.router.data;
    if (!a) return s;
    let i = false;
    for (const c in a) a[c] === void 0 ? delete a[c] : i = true;
    return i && (s instanceof Response ? s.customBody && (a._$value = s.customBody()) : (a._$value = s, s = new Response(null, { status: 200 })), s.customBody = () => a, s.headers.set("X-Single-Flight", "true")), s;
  });
}
const Lt$1 = eventHandler$1(wt$1);

const y = createContext(), v = ["title", "meta"], p = [], f = ["name", "http-equiv", "content", "charset", "media"].concat(["property"]), l = (r, t) => {
  const e = Object.fromEntries(Object.entries(r.props).filter(([n]) => t.includes(n)).sort());
  return (Object.hasOwn(e, "name") || Object.hasOwn(e, "property")) && (e.name = e.name || e.property, delete e.property), r.tag + JSON.stringify(e);
};
function M$1() {
  if (!sharedConfig.context) {
    const e = document.head.querySelectorAll("[data-sm]");
    Array.prototype.forEach.call(e, (n) => n.parentNode.removeChild(n));
  }
  const r = /* @__PURE__ */ new Map();
  function t(e) {
    if (e.ref) return e.ref;
    let n = document.querySelector(`[data-sm="${e.id}"]`);
    return n ? (n.tagName.toLowerCase() !== e.tag && (n.parentNode && n.parentNode.removeChild(n), n = document.createElement(e.tag)), n.removeAttribute("data-sm")) : n = document.createElement(e.tag), n;
  }
  return { addTag(e) {
    if (v.indexOf(e.tag) !== -1) {
      const i = e.tag === "title" ? p : f, a = l(e, i);
      r.has(a) || r.set(a, []);
      let s = r.get(a), u = s.length;
      s = [...s, e], r.set(a, s);
      let c = t(e);
      e.ref = c, spread(c, e.props);
      let d = null;
      for (var n = u - 1; n >= 0; n--) if (s[n] != null) {
        d = s[n];
        break;
      }
      return c.parentNode != document.head && document.head.appendChild(c), d && d.ref && d.ref.parentNode && document.head.removeChild(d.ref), u;
    }
    let o = t(e);
    return e.ref = o, spread(o, e.props), o.parentNode != document.head && document.head.appendChild(o), -1;
  }, removeTag(e, n) {
    const o = e.tag === "title" ? p : f, i = l(e, o);
    if (e.ref) {
      const a = r.get(i);
      if (a) {
        if (e.ref.parentNode) {
          e.ref.parentNode.removeChild(e.ref);
          for (let s = n - 1; s >= 0; s--) a[s] != null && document.head.appendChild(a[s].ref);
        }
        a[n] = null, r.set(i, a);
      } else e.ref.parentNode && e.ref.parentNode.removeChild(e.ref);
    }
  } };
}
function w() {
  const r = [];
  return useAssets(() => ssr(S(r))), { addTag(t) {
    if (v.indexOf(t.tag) !== -1) {
      const e = t.tag === "title" ? p : f, n = l(t, e), o = r.findIndex((i) => i.tag === t.tag && l(i, e) === n);
      o !== -1 && r.splice(o, 1);
    }
    return r.push(t), r.length;
  }, removeTag(t, e) {
  } };
}
const I$1 = (r) => {
  const t = isServer ? w() : M$1();
  return createComponent$1(y.Provider, { value: t, get children() {
    return r.children;
  } });
}, C = (r, t, e) => (A({ tag: r, props: t, setting: e, id: createUniqueId(), get name() {
  return t.name || t.property;
} }), null);
function A(r) {
  const t = useContext(y);
  if (!t) throw new Error("<MetaProvider /> should be in the tree");
  createRenderEffect(() => {
    const e = t.addTag(r);
    onCleanup(() => t.removeTag(r, e));
  });
}
function S(r) {
  return r.map((t) => {
    var _a, _b;
    const n = Object.keys(t.props).map((i) => i === "children" ? "" : ` ${i}="${escape(t.props[i], true)}"`).join("");
    let o = t.props.children;
    return Array.isArray(o) && (o = o.join("")), ((_a = t.setting) == null ? void 0 : _a.close) ? `<${t.tag} data-sm="${t.id}"${n}>${((_b = t.setting) == null ? void 0 : _b.escape) ? escape(o) : o || ""}</${t.tag}>` : `<${t.tag} data-sm="${t.id}"${n}/>`;
  }).join("");
}
const k = (r) => C("title", r, { escape: true, close: true }), H = (r) => C("meta", r);

const [a, t] = createSignal(null), [r$1, n] = createSignal(false);

{
  const a = "AIzaSyD1NS-VLkRSQbmF12SPNiwsVZhEKMGev6I";
  if (a.includes("<Firebase Web API Key>") || a.includes("dummy") || a.includes("placeholder")) throw new Error("VITE_FIREBASE_API_KEY contains a placeholder value");
  if (!a.startsWith("AIza")) throw new Error("VITE_FIREBASE_API_KEY must start with AIza");
}
const i = { apiKey: "AIzaSyD1NS-VLkRSQbmF12SPNiwsVZhEKMGev6I", authDomain: "pdf2zh-tr.firebaseapp.com", projectId: "pdf2zh-tr", appId: "1:553646888791:web:f6a4255abcaea76ca29012" }, r = initializeApp(i), c = getAuth(r);

const firebaseD_DCxAHy = /*#__PURE__*/Object.freeze({
  __proto__: null,
  auth: c
});

function Re() {
  let e = /* @__PURE__ */ new Set();
  function t(s) {
    return e.add(s), () => e.delete(s);
  }
  let n = false;
  function r(s, o) {
    if (n) return !(n = false);
    const a = { to: s, options: o, defaultPrevented: false, preventDefault: () => a.defaultPrevented = true };
    for (const c of e) c.listener({ ...a, from: c.location, retry: (u) => {
      u && (n = true), c.navigate(s, { ...o, resolve: false });
    } });
    return !a.defaultPrevented;
  }
  return { subscribe: t, confirm: r };
}
let M;
function Q$1() {
  (!window.history.state || window.history.state._depth == null) && window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, ""), M = window.history.state._depth;
}
isServer || Q$1();
function Ne(e) {
  return { ...e, _depth: window.history.state && window.history.state._depth };
}
function ke(e, t) {
  let n = false;
  return () => {
    const r = M;
    Q$1();
    const s = r == null ? null : M - r;
    if (n) {
      n = false;
      return;
    }
    s && t(s) ? (n = true, window.history.go(-s)) : e();
  };
}
const xe = /^(?:[a-z0-9]+:)?\/\//i, Ce = /^\/+|(\/)\/+$/g, be = "http://sr";
function R(e, t = false) {
  const n = e.replace(Ce, "$1");
  return n ? t || /^[?#]/.test(n) ? n : "/" + n : "";
}
function $(e, t, n) {
  if (xe.test(t)) return;
  const r = R(e), s = n && R(n);
  let o = "";
  return !s || t.startsWith("/") ? o = r : s.toLowerCase().indexOf(r.toLowerCase()) !== 0 ? o = r + s : o = s, (o || "/") + R(t, !o);
}
function Le(e, t) {
  if (e == null) throw new Error(t);
  return e;
}
function Ae(e, t) {
  return R(e).replace(/\/*(\*.*)?$/g, "") + R(t);
}
function V$1(e) {
  const t = {};
  return e.searchParams.forEach((n, r) => {
    r in t ? Array.isArray(t[r]) ? t[r].push(n) : t[r] = [t[r], n] : t[r] = n;
  }), t;
}
function Ee(e, t, n) {
  const [r, s] = e.split("/*", 2), o = r.split("/").filter(Boolean), a = o.length;
  return (c) => {
    const u = c.split("/").filter(Boolean), h = u.length - a;
    if (h < 0 || h > 0 && s === void 0 && !t) return null;
    const f = { path: a ? "" : "/", params: {} }, m = (p) => n === void 0 ? void 0 : n[p];
    for (let p = 0; p < a; p++) {
      const d = o[p], v = d[0] === ":", w = v ? u[p] : u[p].toLowerCase(), A = v ? d.slice(1) : d.toLowerCase();
      if (v && q$1(w, m(A))) f.params[A] = w;
      else if (v || !q$1(w, A)) return null;
      f.path += `/${w}`;
    }
    if (s) {
      const p = h ? u.slice(-h).join("/") : "";
      if (q$1(p, m(s))) f.params[s] = p;
      else return null;
    }
    return f;
  };
}
function q$1(e, t) {
  const n = (r) => r === e;
  return t === void 0 ? true : typeof t == "string" ? n(t) : typeof t == "function" ? t(e) : Array.isArray(t) ? t.some(n) : t instanceof RegExp ? t.test(e) : false;
}
function Se(e) {
  const [t, n] = e.pattern.split("/*", 2), r = t.split("/").filter(Boolean);
  return r.reduce((s, o) => s + (o.startsWith(":") ? 2 : 3), r.length - (n === void 0 ? 0 : 1));
}
function Y$1(e) {
  const t = /* @__PURE__ */ new Map(), n = getOwner();
  return new Proxy({}, { get(r, s) {
    return t.has(s) || runWithOwner(n, () => t.set(s, createMemo(() => e()[s]))), t.get(s)();
  }, getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  }, ownKeys() {
    return Reflect.ownKeys(e());
  }, has(r, s) {
    return s in e();
  } });
}
function Z(e) {
  let t = /(\/?\:[^\/]+)\?/.exec(e);
  if (!t) return [e];
  let n = e.slice(0, t.index), r = e.slice(t.index + t[0].length);
  const s = [n, n += t[1]];
  for (; t = /^(\/\:[^\/]+)\?/.exec(r); ) s.push(n += t[1]), r = r.slice(t[0].length);
  return Z(r).reduce((o, a) => [...o, ...s.map((c) => c + a)], []);
}
const Oe = 100, _e = createContext(), ee = createContext(), E = () => Le(useContext(_e), "<A> and 'use' router primitives can be only used inside a Route."), Fe = () => useContext(ee) || E().base, Be = (e) => {
  const t = Fe();
  return createMemo(() => t.resolvePath(e()));
}, je = (e) => {
  const t = E();
  return createMemo(() => {
    const n = e();
    return n !== void 0 ? t.renderPath(n) : n;
  });
}, We = () => E().navigatorFactory(), te$1 = () => E().location, ze = () => E().params;
function $e(e, t = "") {
  const { component: n, preload: r, load: s, children: o, info: a } = e, c = !o || Array.isArray(o) && !o.length, u = { key: e, component: n, preload: r || s, info: a };
  return ne$1(e.path).reduce((h, f) => {
    for (const m of Z(f)) {
      const p = Ae(t, m);
      let d = c ? p : p.split("/*", 1)[0];
      d = d.split("/").map((v) => v.startsWith(":") || v.startsWith("*") ? v : encodeURIComponent(v)).join("/"), h.push({ ...u, originalPath: f, pattern: d, matcher: Ee(d, !c, e.matchFilters) });
    }
    return h;
  }, []);
}
function qe(e, t = 0) {
  return { routes: e, score: Se(e[e.length - 1]) * 1e4 - t, matcher(n) {
    const r = [];
    for (let s = e.length - 1; s >= 0; s--) {
      const o = e[s], a = o.matcher(n);
      if (!a) return null;
      r.unshift({ ...a, route: o });
    }
    return r;
  } };
}
function ne$1(e) {
  return Array.isArray(e) ? e : [e];
}
function Ie(e, t = "", n = [], r = []) {
  const s = ne$1(e);
  for (let o = 0, a = s.length; o < a; o++) {
    const c = s[o];
    if (c && typeof c == "object") {
      c.hasOwnProperty("path") || (c.path = "");
      const u = $e(c, t);
      for (const h of u) {
        n.push(h);
        const f = Array.isArray(c.children) && c.children.length === 0;
        if (c.children && !f) Ie(c.children, h.pattern, n, r);
        else {
          const m = qe([...n], r.length);
          r.push(m);
        }
        n.pop();
      }
    }
  }
  return n.length ? r : r.sort((o, a) => a.score - o.score);
}
function I(e, t) {
  for (let n = 0, r = e.length; n < r; n++) {
    const s = e[n].matcher(t);
    if (s) return s;
  }
  return [];
}
function Me(e, t, n) {
  const r = new URL(be), s = createMemo((f) => {
    const m = e();
    try {
      return new URL(m, r);
    } catch {
      return console.error(`Invalid path ${m}`), f;
    }
  }, r, { equals: (f, m) => f.href === m.href }), o = createMemo(() => s().pathname), a = createMemo(() => s().search, true), c = createMemo(() => s().hash), u = () => "", h = on(a, () => V$1(s()));
  return { get pathname() {
    return o();
  }, get search() {
    return a();
  }, get hash() {
    return c();
  }, get state() {
    return t();
  }, get key() {
    return u();
  }, query: n ? n(h) : Y$1(h) };
}
let P;
function He() {
  return P;
}
function Ke(e, t, n, r = {}) {
  const { signal: [s, o], utils: a = {} } = e, c = a.parsePath || ((i) => i), u = a.renderPath || ((i) => i), h = a.beforeLeave || Re(), f = $("", r.base || "");
  if (f === void 0) throw new Error(`${f} is not a valid base path`);
  f && !s().value && o({ value: f, replace: true, scroll: false });
  const [m, p] = createSignal(false);
  let d;
  const v = (i, l) => {
    l.value === w() && l.state === S() || (d === void 0 && p(true), P = i, d = l, startTransition(() => {
      d === l && (A(d.value), re(d.state), resetErrorBoundaries(), isServer || D[1]((g) => g.filter((x) => x.pending)));
    }).finally(() => {
      d === l && batch(() => {
        P = void 0, i === "navigate" && ie(d), p(false), d = void 0;
      });
    }));
  }, [w, A] = createSignal(s().value), [S, re] = createSignal(s().state), O = Me(w, S, a.queryWrapper), _ = [], D = createSignal(isServer ? ue() : []), N = createMemo(() => typeof r.transformUrl == "function" ? I(t(), r.transformUrl(O.pathname)) : I(t(), O.pathname)), k = () => {
    const i = N(), l = {};
    for (let g = 0; g < i.length; g++) Object.assign(l, i[g].params);
    return l;
  }, se = a.paramsWrapper ? a.paramsWrapper(k, t) : Y$1(k), z = { pattern: f, path: () => f, outlet: () => null, resolvePath(i) {
    return $(f, i);
  } };
  return createRenderEffect(on(s, (i) => v("native", i), { defer: true })), { base: z, location: O, params: se, isRouting: m, renderPath: u, parsePath: c, navigatorFactory: ae, matches: N, beforeLeave: h, preloadRoute: ce, singleFlight: r.singleFlight === void 0 ? true : r.singleFlight, submissions: D };
  function oe(i, l, g) {
    untrack(() => {
      if (typeof l == "number") {
        l && (a.go ? a.go(l) : console.warn("Router integration does not support relative routing"));
        return;
      }
      const x = !l || l[0] === "?", { replace: F, resolve: C, scroll: B, state: b } = { replace: false, resolve: !x, scroll: true, ...g }, L = C ? i.resolvePath(l) : $(x && O.pathname || "", l);
      if (L === void 0) throw new Error(`Path '${l}' is not a routable path`);
      if (_.length >= Oe) throw new Error("Too many redirects");
      const H = w();
      if (L !== H || b !== S()) if (isServer) {
        const K = getRequestEvent();
        K && (K.response = { status: 302, headers: new Headers({ Location: L }) }), o({ value: L, replace: F, scroll: B, state: b });
      } else h.confirm(L, g) && (_.push({ value: H, replace: F, scroll: B, state: S() }), v("navigate", { value: L, state: b }));
    });
  }
  function ae(i) {
    return i = i || useContext(ee) || z, (l, g) => oe(i, l, g);
  }
  function ie(i) {
    const l = _[0];
    l && (o({ ...i, replace: l.replace, scroll: l.scroll }), _.length = 0);
  }
  function ce(i, l) {
    const g = I(t(), i.pathname), x = P;
    P = "preload";
    for (let F in g) {
      const { route: C, params: B } = g[F];
      C.component && C.component.preload && C.component.preload();
      const { preload: b } = C;
      l && b && runWithOwner(n(), () => b({ params: B, location: { pathname: i.pathname, search: i.search, hash: i.hash, query: V$1(i), state: null, key: "" }, intent: "preload" }));
    }
    P = x;
  }
  function ue() {
    const i = getRequestEvent();
    return i && i.router && i.router.submission ? [i.router.submission] : [];
  }
}
function Te(e, t, n, r) {
  const { base: s, location: o, params: a } = e, { pattern: c, component: u, preload: h } = r().route, f = createMemo(() => r().path);
  u && u.preload && u.preload();
  const m = h ? h({ params: a, location: o, intent: P || "initial" }) : void 0;
  return { parent: t, pattern: c, path: f, outlet: () => u ? createComponent(u, { params: a, location: o, data: m, get children() {
    return n();
  } }) : n(), resolvePath(d) {
    return $(s.path(), d, f());
  } };
}
function Je(e) {
  e = mergeProps$1({ inactiveClass: "inactive", activeClass: "active" }, e);
  const [, t] = splitProps(e, ["href", "state", "class", "activeClass", "inactiveClass", "end"]), n = Be(() => e.href), r = je(n), s = te$1(), o = createMemo(() => {
    const a = n();
    if (a === void 0) return [false, false];
    const c = R(a.split(/[?#]/, 1)[0]).toLowerCase(), u = decodeURI(R(s.pathname).toLowerCase());
    return [e.end ? c === u : u.startsWith(c + "/") || u === c, c === u];
  });
  return ssrElement("a", mergeProps(t, { get href() {
    return r() || e.href;
  }, get state() {
    return JSON.stringify(e.state);
  }, get classList() {
    return { ...e.class && { [e.class]: true }, [e.inactiveClass]: !o()[0], [e.activeClass]: o()[0], ...t.classList };
  }, link: true, get "aria-current"() {
    return o()[1] ? "page" : void 0;
  } }), void 0, true);
}
function Xe(e) {
  const t = We(), n = te$1(), { href: r, state: s } = e, o = typeof r == "function" ? r({ navigate: t, location: n }) : r;
  return t(o, { replace: true, state: s }), null;
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
function ut(e) {
  let t;
  const r = re(e), s = { duplex: "half", method: e.method, headers: e.headers };
  return e.node.req.body instanceof ArrayBuffer ? new Request(r, { ...s, body: e.node.req.body }) : new Request(r, { ...s, get body() {
    return t || (t = wt(e), t);
  } });
}
function lt(e) {
  var _a;
  return (_a = e.web) != null ? _a : e.web = { request: ut(e), url: re(e) }, e.web.request;
}
function pt() {
  return Et();
}
const te = /* @__PURE__ */ Symbol("$HTTPEvent");
function dt(e) {
  return typeof e == "object" && (e instanceof H3Event || (e == null ? void 0 : e[te]) instanceof H3Event || (e == null ? void 0 : e.__is_event__) === true);
}
function g(e) {
  return function(...t) {
    var _a;
    let r = t[0];
    if (dt(r)) t[0] = r instanceof H3Event || r.__is_event__ ? r : r[te];
    else {
      if (!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext)) throw new Error("AsyncLocalStorage was not enabled. Use the `server.experimental.asyncContext: true` option in your app configuration to enable it. Or, pass the instance of HTTPEvent that you have as the first argument to the function.");
      if (r = pt(), !r) throw new Error("No HTTPEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
      t.unshift(r);
    }
    return e(...t);
  };
}
const re = g(getRequestURL$1), ht = g(getRequestIP), _ = g(setResponseStatus$1), B = g(getResponseStatus), ft = g(getResponseStatusText), L = g(getResponseHeaders), W = g(getResponseHeader$1), mt = g(setResponseHeader$1), gt = g(appendResponseHeader$1), K = g(sendRedirect$1), bt = g(getCookie), yt = g(setCookie), vt = g(setHeader), wt = g(getRequestWebStream), Rt = g(removeResponseHeader$1), $t = g(lt);
function St() {
  var _a;
  return getContext("nitro-app", { asyncContext: !!((_a = globalThis.app.config.server.experimental) == null ? void 0 : _a.asyncContext), AsyncLocalStorage: AsyncLocalStorage });
}
function Et() {
  return St().use().event;
}
const ne = [{ page: true, $component: { src: "src/routes/[...404].tsx?pick=default&pick=$css", build: () => import('../build/_2...404_.mjs'), import: () => import('../build/_2...404_.mjs') }, path: "/*404", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/[...404].tsx" }, { page: true, $component: { src: "src/routes/about.tsx?pick=default&pick=$css", build: () => import('../build/about2.mjs'), import: () => import('../build/about2.mjs') }, path: "/about", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/about.tsx" }, { page: true, $component: { src: "src/routes/app/index.tsx?pick=default&pick=$css", build: () => import('../build/index4.mjs'), import: () => import('../build/index4.mjs') }, path: "/app/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/index.tsx" }, { page: true, $component: { src: "src/routes/app/jobs/[id].tsx?pick=default&pick=$css", build: () => import('../build/_id_2.mjs'), import: () => import('../build/_id_2.mjs') }, path: "/app/jobs/:id", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/jobs/[id].tsx" }, { page: true, $component: { src: "src/routes/app/settings/advanced.tsx?pick=default&pick=$css", build: () => import('../build/advanced2.mjs'), import: () => import('../build/advanced2.mjs') }, path: "/app/settings/advanced", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/settings/advanced.tsx" }, { page: true, $component: { src: "src/routes/app/settings/index.tsx?pick=default&pick=$css", build: () => import('../build/index22.mjs'), import: () => import('../build/index22.mjs') }, path: "/app/settings/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app/settings/index.tsx" }, { page: true, $component: { src: "src/routes/app.tsx?pick=default&pick=$css", build: () => import('../build/app2.mjs'), import: () => import('../build/app2.mjs') }, path: "/app", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/app.tsx" }, { page: true, $component: { src: "src/routes/index.tsx?pick=default&pick=$css", build: () => import('../build/index32.mjs'), import: () => import('../build/index32.mjs') }, path: "/", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/index.tsx" }, { page: true, $component: { src: "src/routes/licenses.tsx?pick=default&pick=$css", build: () => import('../build/licenses2.mjs'), import: () => import('../build/licenses2.mjs') }, path: "/licenses", filePath: "/srv/pdf2zh-web/v2/frontend/src/routes/licenses.tsx" }], At = xt(ne.filter((e) => e.page));
function xt(e) {
  function t(r, s, n, o) {
    const a = Object.values(r).find((i) => n.startsWith(i.id + "/"));
    return a ? (t(a.children || (a.children = []), s, n.slice(a.id.length)), r) : (r.push({ ...s, id: n, path: n.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/") }), r);
  }
  return e.sort((r, s) => r.path.length - s.path.length).reduce((r, s) => t(r, s, s.path, s.path), []);
}
function kt(e, t) {
  const r = Ct.lookup(e);
  if (r && r.route) {
    const s = r.route, n = t === "HEAD" ? s.$HEAD || s.$GET : s[`$${t}`];
    if (n === void 0) return;
    const o = s.page === true && s.$component !== void 0;
    return { handler: n, params: r.params, isPage: o };
  }
}
function Tt(e) {
  return e.$HEAD || e.$GET || e.$POST || e.$PUT || e.$PATCH || e.$DELETE;
}
const Ct = createRouter({ routes: ne.reduce((e, t) => {
  if (!Tt(t)) return e;
  let r = t.path.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/").replace(/\*([^/]*)/g, (s, n) => `**:${n}`).split("/").map((s) => s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s)).join("/");
  if (/:[^/]*\?/g.test(r)) throw new Error(`Optional parameters are not supported in API routes: ${r}`);
  if (e[r]) throw new Error(`Duplicate API routes for "${r}" found at "${e[r].route.path}" and "${t.path}"`);
  return e[r] = { route: t }, e;
}, {}) }), q = "solidFetchEvent";
function Pt(e) {
  return { request: $t(e), response: qt(e), clientAddress: ht(e), locals: {}, nativeEvent: e };
}
function Lt(e) {
  if (!e.context[q]) {
    const t = Pt(e);
    e.context[q] = t;
  }
  return e.context[q];
}
class Ht {
  constructor(t) {
    __publicField(this, "event");
    this.event = t;
  }
  get(t) {
    const r = W(this.event, t);
    return Array.isArray(r) ? r.join(", ") : r || null;
  }
  has(t) {
    return this.get(t) !== null;
  }
  set(t, r) {
    return mt(this.event, t, r);
  }
  delete(t) {
    return Rt(this.event, t);
  }
  append(t, r) {
    gt(this.event, t, r);
  }
  getSetCookie() {
    const t = W(this.event, "Set-Cookie");
    return Array.isArray(t) ? t : [t];
  }
  forEach(t) {
    return Object.entries(L(this.event)).forEach(([r, s]) => t(Array.isArray(s) ? s.join(", ") : s, r, this));
  }
  entries() {
    return Object.entries(L(this.event)).map(([t, r]) => [t, Array.isArray(r) ? r.join(", ") : r])[Symbol.iterator]();
  }
  keys() {
    return Object.keys(L(this.event))[Symbol.iterator]();
  }
  values() {
    return Object.values(L(this.event)).map((t) => Array.isArray(t) ? t.join(", ") : t)[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}
function qt(e) {
  return { get status() {
    return B(e);
  }, set status(t) {
    _(e, t);
  }, get statusText() {
    return ft(e);
  }, set statusText(t) {
    _(e, B(e), t);
  }, headers: new Ht(e) };
}
var It = " ";
const _t = { style: (e) => ssrElement("style", e.attrs, () => e.children, true), link: (e) => ssrElement("link", e.attrs, void 0, true), script: (e) => e.attrs.src ? ssrElement("script", mergeProps(() => e.attrs, { get id() {
  return e.key;
} }), () => ssr(It), true) : null, noscript: (e) => ssrElement("noscript", e.attrs, () => escape(e.children), true) };
function F(e, t) {
  let { tag: r, attrs: { key: s, ...n } = { key: void 0 }, children: o } = e;
  return _t[r]({ attrs: { ...n, nonce: t }, key: s, children: o });
}
function Ft(e, t, r, s = "default") {
  return lazy(async () => {
    var _a;
    {
      const o = (await e.import())[s], i = (await ((_a = t.inputs) == null ? void 0 : _a[e.src].assets())).filter((p) => p.tag === "style" || p.attrs.rel === "stylesheet");
      return { default: (p) => [...i.map((y) => F(y)), createComponent(o, p)] };
    }
  });
}
function se() {
  function e(r) {
    return { ...r, ...r.$$route ? r.$$route.require().route : void 0, info: { ...r.$$route ? r.$$route.require().route.info : {}, filesystem: true }, component: r.$component && Ft(r.$component, globalThis.MANIFEST.client, globalThis.MANIFEST.ssr), children: r.children ? r.children.map(e) : void 0 };
  }
  return At.map(e);
}
let G;
const Ut = isServer ? () => getRequestEvent().routes : () => G || (G = se());
function Nt(e) {
  const t = bt(e.nativeEvent, "flash");
  if (t) try {
    let r = JSON.parse(t);
    if (!r || !r.result) return;
    const s = [...r.input.slice(0, -1), new Map(r.input[r.input.length - 1])], n = r.error ? new Error(r.result) : r.result;
    return { input: s, url: r.url, pending: false, result: r.thrown ? void 0 : n, error: r.thrown ? n : void 0 };
  } catch (r) {
    console.error(r);
  } finally {
    yt(e.nativeEvent, "flash", "", { maxAge: 0 });
  }
}
async function Mt(e) {
  const t = globalThis.MANIFEST.client;
  return globalThis.MANIFEST.ssr, e.response.headers.set("Content-Type", "text/html"), Object.assign(e, { manifest: await t.json(), assets: [...await t.inputs[t.handler].assets()], router: { submission: Nt(e) }, routes: se(), complete: false, $islands: /* @__PURE__ */ new Set() });
}
const jt = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function U(e) {
  return e.status && jt.has(e.status) ? e.status : 302;
}
function Dt(e, t, r = {}, s) {
  return eventHandler$1({ handler: (n) => {
    const o = Lt(n);
    return provideRequestEvent(o, async () => {
      const a = kt(new URL(o.request.url).pathname, o.request.method);
      if (a) {
        const f = await a.handler.import(), b = o.request.method === "HEAD" ? f.HEAD || f.GET : f[o.request.method];
        o.params = a.params || {}, sharedConfig.context = { event: o };
        const c = await b(o);
        if (c !== void 0) return c;
        if (o.request.method !== "GET") throw new Error(`API handler for ${o.request.method} "${o.request.url}" did not return a response.`);
        if (!a.isPage) return;
      }
      const i = await t(o), u = typeof r == "function" ? await r(i) : { ...r }, p = u.mode || "stream";
      if (u.nonce && (i.nonce = u.nonce), p === "sync") {
        const f = renderToString(() => (sharedConfig.context.event = i, e(i)), u);
        if (i.complete = true, i.response && i.response.headers.get("Location")) {
          const b = U(i.response);
          return K(n, i.response.headers.get("Location"), b);
        }
        return f;
      }
      if (u.onCompleteAll) {
        const f = u.onCompleteAll;
        u.onCompleteAll = (b) => {
          V(i)(b), f(b);
        };
      } else u.onCompleteAll = V(i);
      if (u.onCompleteShell) {
        const f = u.onCompleteShell;
        u.onCompleteShell = (b) => {
          J(i, n)(), f(b);
        };
      } else u.onCompleteShell = J(i, n);
      const y = renderToStream(() => (sharedConfig.context.event = i, e(i)), u);
      if (i.response && i.response.headers.get("Location")) {
        const f = U(i.response);
        return K(n, i.response.headers.get("Location"), f);
      }
      if (p === "async") return y;
      const { writable: S, readable: $ } = new TransformStream();
      return y.pipeTo(S), $;
    });
  } });
}
function J(e, t) {
  return () => {
    if (e.response && e.response.headers.get("Location")) {
      const r = U(e.response);
      _(t, r), vt(t, "Location", e.response.headers.get("Location"));
    }
  };
}
function V(e) {
  return ({ write: t }) => {
    e.complete = true;
    const r = e.response && e.response.headers.get("Location");
    r && t(`<script>window.location="${r}"<\/script>`);
  };
}
function zt(e, t, r) {
  return Dt(e, Mt, t);
}
const oe = (e) => (t) => {
  const { base: r } = t, s = children(() => t.children), n = createMemo(() => Ie(s(), t.base || ""));
  let o;
  const a = Ke(e, n, () => o, { base: r, singleFlight: t.singleFlight, transformUrl: t.transformUrl });
  return e.create && e.create(a), createComponent$1(_e.Provider, { value: a, get children() {
    return createComponent$1(Bt, { routerState: a, get root() {
      return t.root;
    }, get preload() {
      return t.rootPreload || t.rootLoad;
    }, get children() {
      return [(o = getOwner()) && null, createComponent$1(Wt, { routerState: a, get branches() {
        return n();
      } })];
    } });
  } });
};
function Bt(e) {
  const t = e.routerState.location, r = e.routerState.params, s = createMemo(() => e.preload && untrack(() => {
    e.preload({ params: r, location: t, intent: He() || "initial" });
  }));
  return createComponent$1(Show, { get when() {
    return e.root;
  }, keyed: true, get fallback() {
    return e.children;
  }, children: (n) => createComponent$1(n, { params: r, location: t, get data() {
    return s();
  }, get children() {
    return e.children;
  } }) });
}
function Wt(e) {
  if (isServer) {
    const n = getRequestEvent();
    if (n && n.router && n.router.dataOnly) {
      Kt(n, e.routerState, e.branches);
      return;
    }
    n && ((n.router || (n.router = {})).matches || (n.router.matches = e.routerState.matches().map(({ route: o, path: a, params: i }) => ({ path: o.originalPath, pattern: o.pattern, match: a, params: i, info: o.info }))));
  }
  const t = [];
  let r;
  const s = createMemo(on(e.routerState.matches, (n, o, a) => {
    let i = o && n.length === o.length;
    const u = [];
    for (let p = 0, y = n.length; p < y; p++) {
      const S = o && o[p], $ = n[p];
      a && S && $.route.key === S.route.key ? u[p] = a[p] : (i = false, t[p] && t[p](), createRoot((f) => {
        t[p] = f, u[p] = Te(e.routerState, u[p - 1] || e.routerState.base, Y(() => s()[p + 1]), () => {
          var _a;
          const b = e.routerState.matches();
          return (_a = b[p]) != null ? _a : b[0];
        });
      }));
    }
    return t.splice(n.length).forEach((p) => p()), a && i ? a : (r = u[0], u);
  }));
  return Y(() => s() && r)();
}
const Y = (e) => () => createComponent$1(Show, { get when() {
  return e();
}, keyed: true, children: (t) => createComponent$1(ee.Provider, { value: t, get children() {
  return t.outlet();
} }) }), O = (e) => {
  const t = children(() => e.children);
  return mergeProps$1(e, { get children() {
    return t();
  } });
};
function Kt(e, t, r) {
  const s = new URL(e.request.url), n = I(r, new URL(e.router.previousUrl || e.request.url).pathname), o = I(r, s.pathname);
  for (let a = 0; a < o.length; a++) {
    (!n[a] || o[a].route !== n[a].route) && (e.router.dataOnly = true);
    const { route: i, params: u } = o[a];
    i.preload && i.preload({ params: u, location: t.location, intent: "preload" });
  }
}
function Gt([e, t], r, s) {
  return [e, s ? (n) => t(s(n)) : t];
}
function Jt(e) {
  let t = false;
  const r = (n) => typeof n == "string" ? { value: n } : n, s = Gt(createSignal(r(e.get()), { equals: (n, o) => n.value === o.value && n.state === o.state }), void 0, (n) => (!t && e.set(n), sharedConfig.registry && !sharedConfig.done && (sharedConfig.done = true), n));
  return e.init && onCleanup(e.init((n = e.get()) => {
    t = true, s[1](r(n)), t = false;
  })), oe({ signal: s, create: e.create, utils: e.utils });
}
function Vt(e, t, r) {
  return e.addEventListener(t, r), () => e.removeEventListener(t, r);
}
function Yt(e, t) {
  const r = e && document.getElementById(e);
  r ? r.scrollIntoView() : t && window.scrollTo(0, 0);
}
function Qt(e) {
  const t = new URL(e);
  return t.pathname + t.search;
}
function Xt(e) {
  let t;
  const r = { value: e.url || (t = getRequestEvent()) && Qt(t.request.url) || "" };
  return oe({ signal: [() => r, (s) => Object.assign(r, s)] })(e);
}
const Zt = /* @__PURE__ */ new Map();
function er({ preload: e = true, explicitLinks: t = false, actionBase: r = "/_server", transformUrl: s } = {}) {
  return (n) => {
    const o = n.base.path(), a = n.navigatorFactory(n.base);
    let i, u;
    function p(c) {
      return c.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function y(c) {
      if (c.defaultPrevented || c.button !== 0 || c.metaKey || c.altKey || c.ctrlKey || c.shiftKey) return;
      const d = c.composedPath().find((D) => D instanceof Node && D.nodeName.toUpperCase() === "A");
      if (!d || t && !d.hasAttribute("link")) return;
      const m = p(d), h = m ? d.href.baseVal : d.href;
      if ((m ? d.target.baseVal : d.target) || !h && !d.hasAttribute("state")) return;
      const A = (d.getAttribute("rel") || "").split(/\s+/);
      if (d.hasAttribute("download") || A && A.includes("external")) return;
      const T = m ? new URL(h, document.baseURI) : new URL(h);
      if (!(T.origin !== window.location.origin || o && T.pathname && !T.pathname.toLowerCase().startsWith(o.toLowerCase()))) return [d, T];
    }
    function S(c) {
      const d = y(c);
      if (!d) return;
      const [m, h] = d, j = n.parsePath(h.pathname + h.search + h.hash), A = m.getAttribute("state");
      c.preventDefault(), a(j, { resolve: false, replace: m.hasAttribute("replace"), scroll: !m.hasAttribute("noscroll"), state: A ? JSON.parse(A) : void 0 });
    }
    function $(c) {
      const d = y(c);
      if (!d) return;
      const [m, h] = d;
      s && (h.pathname = s(h.pathname)), n.preloadRoute(h, m.getAttribute("preload") !== "false");
    }
    function f(c) {
      clearTimeout(i);
      const d = y(c);
      if (!d) return u = null;
      const [m, h] = d;
      u !== m && (s && (h.pathname = s(h.pathname)), i = setTimeout(() => {
        n.preloadRoute(h, m.getAttribute("preload") !== "false"), u = m;
      }, 20));
    }
    function b(c) {
      if (c.defaultPrevented) return;
      let d = c.submitter && c.submitter.hasAttribute("formaction") ? c.submitter.getAttribute("formaction") : c.target.getAttribute("action");
      if (!d) return;
      if (!d.startsWith("https://action/")) {
        const h = new URL(d, be);
        if (d = n.parsePath(h.pathname + h.search), !d.startsWith(r)) return;
      }
      if (c.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const m = Zt.get(d);
      if (m) {
        c.preventDefault();
        const h = new FormData(c.target, c.submitter);
        m.call({ r: n, f: c.target }, c.target.enctype === "multipart/form-data" ? h : new URLSearchParams(h));
      }
    }
    delegateEvents(["click", "submit"]), document.addEventListener("click", S), e && (document.addEventListener("mousemove", f, { passive: true }), document.addEventListener("focusin", $, { passive: true }), document.addEventListener("touchstart", $, { passive: true })), document.addEventListener("submit", b), onCleanup(() => {
      document.removeEventListener("click", S), e && (document.removeEventListener("mousemove", f), document.removeEventListener("focusin", $), document.removeEventListener("touchstart", $)), document.removeEventListener("submit", b);
    });
  };
}
function tr(e) {
  if (isServer) return Xt(e);
  const t = () => {
    const s = window.location.pathname.replace(/^\/+/, "/") + window.location.search, n = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return { value: s + window.location.hash, state: n };
  }, r = Re();
  return Jt({ get: t, set({ value: s, replace: n, scroll: o, state: a }) {
    n ? window.history.replaceState(Ne(a), "", s) : window.history.pushState(a, "", s), Yt(decodeURIComponent(window.location.hash.slice(1)), o), Q$1();
  }, init: (s) => Vt(window, "popstate", ke(s, (n) => {
    if (n) return !r.confirm(n);
    {
      const o = t();
      return !r.confirm(o.value, { state: o.state });
    }
  })), create: er({ preload: e.preload, explicitLinks: e.explicitLinks, actionBase: e.actionBase, transformUrl: e.transformUrl }), utils: { go: (s) => window.history.go(s), beforeLeave: r } })(e);
}
var rr = ["<div", ' class="min-h-screen bg-gray-900 text-gray-100 font-sans">', "</div>"];
function nr(e) {
  return onMount(() => onAuthStateChanged(c, (r) => {
    t(r), n(true);
  })), ssr(rr, ssrHydrationKey(), escape(e.children));
}
var sr = ["<title", ">PDF\u7FFB\u8A33</title>"];
function or() {
  return createComponent$1(tr, { root: (e) => createComponent$1(I$1, { get children() {
    return [ssr(sr, ssrHydrationKey()), createComponent$1(nr, { get children() {
      return createComponent$1(Suspense, { get children() {
        return e.children;
      } });
    } })];
  } }), get children() {
    return [createComponent$1(Ut, {}), createComponent$1(O, { path: "/settings", component: () => createComponent$1(Xe, { href: "/app/settings" }) }), createComponent$1(O, { path: "/settings/*", component: () => createComponent$1(Xe, { href: "/app/settings" }) }), createComponent$1(O, { path: "/jobs/*", component: () => createComponent$1(Xe, { href: "/app" }) })];
  } });
}
const ae = isServer ? (e) => {
  const t = getRequestEvent();
  return t.response.status = e.code, t.response.statusText = e.text, onCleanup(() => !t.nativeEvent.handled && !t.complete && (t.response.status = 200)), null;
} : (e) => null;
var ar = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">', "</span>"], ir = ["<span", ' style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">500 | Internal Server Error</span>'];
const cr = (e) => {
  const t = isServer ? "500 | Internal Server Error" : "Error | Uncaught Client Exception";
  return createComponent$1(ErrorBoundary, { fallback: (r) => (console.error(r), [ssr(ar, ssrHydrationKey(), escape(t)), createComponent$1(ae, { code: 500 })]), get children() {
    return e.children;
  } });
}, ur = (e) => {
  let t = false;
  const r = catchError(() => e.children, (s) => {
    console.error(s), t = !!s;
  });
  return t ? [ssr(ir, ssrHydrationKey()), createComponent$1(ae, { code: 500 })] : r;
};
var Q = ["<script", ">", "<\/script>"], lr = ["<script", ' type="module"', " async", "><\/script>"], pr = ["<script", ' type="module" async', "><\/script>"];
const dr = ssr("<!DOCTYPE html>");
function ie(e, t, r = []) {
  for (let s = 0; s < t.length; s++) {
    const n = t[s];
    if (n.path !== e[0].path) continue;
    let o = [...r, n];
    if (n.children) {
      const a = e.slice(1);
      if (a.length === 0 || (o = ie(a, n.children, o), !o)) continue;
    }
    return o;
  }
}
function hr(e) {
  const t = getRequestEvent(), r = t.nonce;
  let s = [];
  return Promise.resolve().then(async () => {
    let n = [];
    if (t.router && t.router.matches) {
      const o = [...t.router.matches];
      for (; o.length && (!o[0].info || !o[0].info.filesystem); ) o.shift();
      const a = o.length && ie(o, t.routes);
      if (a) {
        const i = globalThis.MANIFEST.client.inputs;
        for (let u = 0; u < a.length; u++) {
          const p = a[u], y = i[p.$component.src];
          n.push(y.assets());
        }
      }
    }
    s = await Promise.all(n).then((o) => [...new Map(o.flat().map((a) => [a.attrs.key, a])).values()].filter((a) => a.attrs.rel === "modulepreload" && !t.assets.find((i) => i.attrs.key === a.attrs.key)));
  }), useAssets(() => s.length ? s.map((n) => F(n)) : void 0), createComponent$1(NoHydration, { get children() {
    return [dr, createComponent$1(ur, { get children() {
      return createComponent$1(e.document, { get assets() {
        return [createComponent$1(HydrationScript, {}), t.assets.map((n) => F(n, r))];
      }, get scripts() {
        return r ? [ssr(Q, ssrHydrationKey() + ssrAttribute("nonce", escape(r, true), false), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(lr, ssrHydrationKey(), ssrAttribute("nonce", escape(r, true), false), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))] : [ssr(Q, ssrHydrationKey(), `window.manifest = ${JSON.stringify(t.manifest)}`), ssr(pr, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST.client.inputs[globalThis.MANIFEST.client.handler].output.path, true), false))];
      }, get children() {
        return createComponent$1(Hydration, { get children() {
          return createComponent$1(cr, { get children() {
            return createComponent$1(or, {});
          } });
        } });
      } });
    } })];
  } });
}
var fr = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg">', "</head>"], mr = ["<html", ' lang="ja">', '<body><div id="root">', "</div><!--$-->", "<!--/--></body></html>"];
const Cr = zt(() => createComponent$1(hr, { document: ({ assets: e, children: t, scripts: r }) => ssr(mr, ssrHydrationKey(), createComponent$1(NoHydration, { get children() {
  return ssr(fr, escape(e));
} }), escape(t), escape(r)) }));

const handlers = [
  { route: '', handler: _zYMrMB, lazy: false, middleware: true, method: undefined },
  { route: '/_server', handler: Lt$1, lazy: false, middleware: true, method: undefined },
  { route: '/', handler: Cr, lazy: false, middleware: true, method: undefined }
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

export { Ft$1 as F, H, Je as J, a, closePrerenderer as b, c, firebaseD_DCxAHy as f, k, localFetch as l, n, r$1 as r, t, ze as z };
//# sourceMappingURL=nitro.mjs.map
