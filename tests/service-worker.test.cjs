const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ORIGIN = "https://example.github.io";
const SCOPE = ORIGIN + "/TrainingIQ/";

function response(marker) {
  return { ok: true, type: "basic", marker, clone() { return response(marker); } };
}

function setup(fetchImpl) {
  const handlers = {};
  const storage = new Map();
  const cacheKey = (request) => new URL(typeof request === "string" ? request : request.url, SCOPE).href;
  const cacheMap = (name) => {
    if (!storage.has(name)) storage.set(name, new Map());
    return storage.get(name);
  };
  const caches = {
    async open(name) {
      const entries = cacheMap(name);
      return {
        async addAll(paths) {
          for (const item of paths) entries.set(cacheKey(item), response("precache"));
        },
        async put(request, value) { entries.set(cacheKey(request), value); },
      };
    },
    async match(request) {
      const key = cacheKey(request);
      for (const entries of storage.values()) {
        if (entries.has(key)) return entries.get(key);
      }
      return undefined;
    },
    async keys() { return [...storage.keys()]; },
    async delete(name) { return storage.delete(name); },
  };
  const self = {
    location: { origin: ORIGIN },
    registration: { scope: SCOPE },
    clients: { claim: async () => {} },
    skipWaiting() {},
    addEventListener(type, handler) { handlers[type] = handler; },
  };
  const code = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
  vm.runInNewContext(code, { self, caches, fetch: fetchImpl, URL, Response });

  function dispatch(type, request) {
    const pending = [];
    let responsePromise;
    handlers[type]({
      request,
      respondWith(value) { responsePromise = value; },
      waitUntil(value) { pending.push(value); },
    });
    return { responsePromise, done: () => Promise.all(pending) };
  }
  return { caches, dispatch, storage };
}

test("online requests refresh cached app assets", async () => {
  const env = setup(async () => response("fresh"));
  const url = SCOPE + "app.js";
  await (await env.caches.open("trainiq-v74")).put(url, response("stale"));
  const event = env.dispatch("fetch", { method: "GET", url, mode: "cors" });
  assert.equal((await event.responsePromise).marker, "fresh");
  await event.done();
  assert.equal((await env.caches.match(url)).marker, "fresh");
});

test("offline requests fall back to cached assets", async () => {
  const env = setup(async () => { throw new Error("offline"); });
  const url = SCOPE + "app.js";
  await (await env.caches.open("trainiq-v74")).put(url, response("cached"));
  const event = env.dispatch("fetch", { method: "GET", url, mode: "cors" });
  assert.equal((await event.responsePromise).marker, "cached");
});

test("offline navigation falls back to cached app shell", async () => {
  const env = setup(async () => { throw new Error("offline"); });
  await (await env.caches.open("trainiq-v74")).put("./index.html", response("shell"));
  const event = env.dispatch("fetch", { method: "GET", url: SCOPE + "another-path", mode: "navigate" });
  assert.equal((await event.responsePromise).marker, "shell");
});

test("activation deletes only older TrainingIQ caches", async () => {
  const env = setup(async () => response("ok"));
  await env.caches.open("trainiq-v73");
  await env.caches.open("trainiq-v74");
  await env.caches.open("another-app-v1");
  const event = env.dispatch("activate");
  await event.done();
  assert.deepEqual(await env.caches.keys(), ["trainiq-v74", "another-app-v1"]);
});

test("requests outside the TrainingIQ scope are not intercepted", () => {
  const env = setup(async () => response("ok"));
  const event = env.dispatch("fetch", { method: "GET", url: ORIGIN + "/another-app/app.js", mode: "cors" });
  assert.equal(event.responsePromise, undefined);
});

test("failed HTTP responses do not replace cached assets", async () => {
  const env = setup(async () => ({ ok: false, type: "basic", marker: "404" }));
  const url = SCOPE + "app.js";
  const event = env.dispatch("fetch", { method: "GET", url, mode: "cors" });
  assert.equal((await event.responsePromise).marker, "404");
  await event.done();
  assert.equal(await env.caches.match(url), undefined);
});
