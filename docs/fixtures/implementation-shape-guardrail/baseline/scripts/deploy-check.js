const assert = require("node:assert/strict");
const { authorize, priceFor } = require("../src/catalog");

assert.equal(priceFor(2, 11), 22);
assert.throws(() => authorize("guest"), /forbidden/);
