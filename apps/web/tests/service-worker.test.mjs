import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
test("service worker never intercepts officer pages, APIs, or foreign URLs", () => {
  const listeners = {};
  vm.runInNewContext(
    readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"),
    {
      self: {
        addEventListener: (name, fn) => (listeners[name] = fn),
        location: { origin: "https://inspect.test" },
      },
      URL,
      fetch: async () => ({ clone: () => ({}) }),
      caches: { open: async () => ({ put: async () => {} }) },
    },
  );
  for (const path of [
    "/v1/inspections",
    "/login",
    "/dashboard",
    "/inspect",
    "/inspections/123",
    "https://other.test/image.png",
  ]) {
    let intercepted = false;
    listeners.fetch({
      request: {
        method: "GET",
        url: path.startsWith("http") ? path : `https://inspect.test${path}`,
      },
      respondWith: () => (intercepted = true),
    });
    assert.equal(intercepted, false, path);
  }
});
