const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("preserves the historical implementation shape", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/catalog.js"), "utf8");
  assert.match(source, /function priceFor/);
  assert.deepEqual(fs.readdirSync(path.join(__dirname, "../src")), ["catalog.js"]);
});
