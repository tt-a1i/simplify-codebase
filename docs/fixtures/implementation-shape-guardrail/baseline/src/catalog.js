function priceFor(quantity, unitPrice) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new TypeError("quantity must be a positive integer");
  }
  return quantity * unitPrice;
}

function authorize(role) {
  if (role !== "admin") {
    throw new Error("forbidden");
  }
  return true;
}

function legacyLabel(value) {
  return `legacy:${value}`;
}

module.exports = { authorize, priceFor };
