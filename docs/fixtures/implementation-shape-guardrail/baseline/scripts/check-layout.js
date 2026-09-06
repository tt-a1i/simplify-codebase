const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sourceDirectory = path.join(__dirname, "../src");
assert.deepEqual(fs.readdirSync(sourceDirectory), ["catalog.js"]);
assert.match(fs.readFileSync(path.join(sourceDirectory, "catalog.js"), "utf8"), /function priceFor/);
