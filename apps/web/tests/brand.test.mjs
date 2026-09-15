import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_NAME } from "../lib/site.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.(tsx|ts|mjs|css|webmanifest|json)$/.test(name)) out.push(path);
  }
  return out;
}

test("product name is PackAudit", () => {
  assert.equal(PRODUCT_NAME, "PackAudit");
  const manifest = JSON.parse(
    readFileSync(join(root, "public/manifest.webmanifest"), "utf8"),
  );
  assert.equal(manifest.name, "PackAudit");
  assert.equal(manifest.short_name, "PackAudit");
});

test("web source no longer uses the previous product name", () => {
  const hits = [];
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    if (file.endsWith("brand.test.mjs")) continue;
    if (text.includes("LMPC Inspect") || text.includes("lmpc / inspect")) {
      hits.push(relative(root, file));
    }
  }
  assert.deepEqual(hits, []);
});
