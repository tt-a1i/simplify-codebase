const assert = require("node:assert/strict");
const test = require("node:test");
const { authorize, priceFor } = require("../src/catalog");

test("prices an order", () => {
  assert.equal(priceFor(3, 7), 21);
});

test("rejects invalid quantities", () => {
  assert.throws(() => priceFor(0, 7), /positive integer/);
});

test("keeps authorization at the business boundary", () => {
  assert.throws(() => authorize("viewer"), /forbidden/);
  assert.equal(authorize("admin"), true);
});
