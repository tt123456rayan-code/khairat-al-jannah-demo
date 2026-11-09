(function () {
  "use strict";

  const INVENTORY_KEY = "khairat-inventory-v2";
  const MOVEMENTS_KEY = "khairat-movements-v2";
  const SOCIAL_POST = "https://www.instagram.com/khairataljanneh/p/DfShJ52CAVn/";

  const seedInventory = [
    { id: 1, sku: "FRT-001", barcode: "6251000000011", name: "بندورة بلدية طازة", category: "خضار وفواكه", unit: "كغم", systemQty: 38, reserved: 4, minQty: 12, location: "B-01", cost: 0.44, price: 0.69, priceKind: "demo", batch: "TOM-1107", expiry: "2026-11-10", image: "assets/product-tomato-web.png" },
    { id: 2, sku: "FRT-002", barcode: "6251000000028", name: "برتقال أبو صرّة", category: "خضار وفواكه", unit: "كغم", systemQty: 55, reserved: 6, minQty: 15, location: "B-03", cost: 0.62, price: 0.89, priceKind: "demo", batch: "ORG-1107", expiry: "2026-11-15", image: "assets/product-orange-web.png" },
    { id: 3, sku: "MEA-001", barcode: "6251000000035", name: "صدر دجاج طازج", category: "لحوم ودواجن", unit: "كغم", systemQty: 17, reserved: 3, minQty: 10, location: "C-02", cost: 2.85, price: 3.49, priceKind: "demo", batch: "CHK-1107", expiry: "2026-11-09", image: "assets/product-chicken-web.png" },
    { id: 4, sku: "DAI-001", barcode: "6251000000042", name: "حليب طازج كامل الدسم", category: "ألبان وأجبان", unit: "عبوة", systemQty: 24, reserved: 5, minQty: 18, location: "D-01", cost: 0.78, price: 1.05, priceKind: "demo", batch: "MLK-1105", expiry: "2026-11-12", image: "assets/product-milk-web.png" },
    { id: 5, sku: "GRO-001", barcode: "6251000000059", name: "أرز حبة طويلة 5 كغم", category: "مواد تموينية", unit: "كيس", systemQty: 42, reserved: 2, minQty: 12, location: "A-08", cost: 4.05, price: 4.99, priceKind: "demo", batch: "RIC-1028", expiry: "2027-10-28", image: "assets/product-rice-web.png" },
    { id: 6, sku: "OIL-TN-16", barcode: "6251000000066", name: "زيت زيتون تونسي", category: "مواد تموينية", unit: "كرتونة 16 لتر", systemQty: 28, reserved: 4, minQty: 8, location: "A-12", cost: 62, price: 72, oldPrice: null, priceKind: "social", priceSource: SOCIAL_POST, pricePublishedAt: "2026-11-03", batch: "OLV-TN-26", expiry: "2028-06-30", image: "assets/olive-oil-tin-illustrative.png" },
    { id: 7, sku: "CLN-001", barcode: "6251000000073", name: "سائل جلي برائحة الليمون", category: "منظفات", unit: "عبوة 1 لتر", systemQty: 63, reserved: 3, minQty: 20, location: "E-05", cost: 0.91, price: 1.29, priceKind: "demo", batch: "DSH-1010", expiry: "2028-10-10", image: "assets/product-soap-web.png" },
    { id: 8, sku: "DAI-002", barcode: "6251000000080", name: "جبنة بيضاء بلدية", category: "ألبان وأجبان", unit: "500 غرام", systemQty: 13, reserved: 3, minQty: 12, location: "D-04", cost: 1.66, price: 2.19, priceKind: "demo", batch: "CHS-1106", expiry: "2026-11-14", image: "assets/product-cheese-web.png" },
    { id: 9, sku: "OIL-JO-16", barcode: "6251000000097", name: "زيت زيتون بلدي راحوب", category: "مواد تموينية", unit: "تنكة 16 كيلو", systemQty: 19, reserved: 2, minQty: 6, location: "A-13", cost: 106, price: 120, oldPrice: null, priceKind: "social", priceSource: SOCIAL_POST, pricePublishedAt: "2026-11-03", batch: "OLV-JO-26", expiry: "2028-06-30", image: "assets/olive-oil-tin-illustrative.png" }
  ];

  const seedMovements = [
    { id: "MV-1001", type: "receipt", itemId: 6, qty: 24, beforeQty: 4, afterQty: 28, employee: "محمود — الاستلام", status: "approved", approvedBy: "ليان — مديرة الفرع", createdAt: "2026-11-07T07:35:00+03:00", note: "استلام أمر شراء PO-841" },
    { id: "MV-1002", type: "waste", itemId: 4, qty: 2, beforeQty: 26, afterQty: 24, employee: "سارة — الألبان", status: "approved", approvedBy: "ليان — مديرة الفرع", createdAt: "2026-11-07T09:20:00+03:00", reason: "تلف تبريد", note: "عبوتان منتفختان — صورة مرفقة" },
    { id: "MV-1003", type: "count", itemId: 8, countedQty: 13, variance: -1, beforeQty: 14, afterQty: 13, employee: "أحمد — الجرد", status: "approved", approvedBy: "ليان — مديرة الفرع", createdAt: "2026-11-07T10:05:00+03:00", note: "عدّ أعمى وإعادة تحقق" },
    { id: "MV-1004", type: "waste", itemId: 1, qty: 3, beforeQty: 38, afterQty: null, employee: "سارة — الخضار", status: "pending", createdAt: "2026-11-07T11:15:00+03:00", reason: "تالف جودة", note: "طراوة زائدة — صندوق الحجر Q-17" }
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const makeId = () => `MV-${Date.now().toString().slice(-7)}`;

  function read(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return Array.isArray(parsed) ? parsed : clone(fallback);
    } catch (_) {
      return clone(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("khairat:inventory-change"));
    return clone(value);
  }

  function load() {
    let items = read(INVENTORY_KEY, seedInventory);
    if (!localStorage.getItem(INVENTORY_KEY)) items = write(INVENTORY_KEY, items);
    return clone(items);
  }

  function save(items) { return write(INVENTORY_KEY, items); }
  function movements() {
    let rows = read(MOVEMENTS_KEY, seedMovements);
    if (!localStorage.getItem(MOVEMENTS_KEY)) rows = write(MOVEMENTS_KEY, rows);
    return clone(rows);
  }

  function available(item) { return Math.max(0, Number(item.systemQty) - Number(item.reserved || 0)); }

  function updateItem(id, patch) {
    const items = load();
    const index = items.findIndex((item) => item.id === Number(id));
    if (index < 0) return null;
    items[index] = { ...items[index], ...clone(patch), id: items[index].id };
    save(items);
    return clone(items[index]);
  }

  function addMovement(payload) {
    const rows = movements();
    const entry = { id: makeId(), status: "pending", createdAt: now(), ...clone(payload) };
    rows.unshift(entry);
    write(MOVEMENTS_KEY, rows);
    return clone(entry);
  }

  function submitCount({ itemId, countedQty, employee, note, photoName }) {
    const item = load().find((row) => row.id === Number(itemId));
    if (!item) throw new Error("الصنف غير موجود");
    return addMovement({ type: "count", itemId: item.id, countedQty: Number(countedQty), variance: Number(countedQty) - Number(item.systemQty), beforeQty: Number(item.systemQty), employee, note, photoName });
  }

  function submitWaste({ itemId, qty, reason, employee, note, photoName }) {
    const item = load().find((row) => row.id === Number(itemId));
    if (!item) throw new Error("الصنف غير موجود");
    const amount = Number(qty);
    if (amount <= 0 || amount > Number(item.systemQty)) throw new Error("كمية التالف غير صحيحة");
    return addMovement({ type: "waste", itemId: item.id, qty: amount, beforeQty: Number(item.systemQty), employee, reason, note, photoName });
  }

  function resolveMovement(id, status, supervisor) {
    const rows = movements();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0 || rows[index].status !== "pending") return null;
    const movement = rows[index];
    if (status === "approved") {
      const item = load().find((row) => row.id === movement.itemId);
      if (!item) throw new Error("الصنف غير موجود");
      const afterQty = movement.type === "count"
        ? Number(movement.countedQty)
        : Math.max(0, Number(item.systemQty) - Number(movement.qty));
      updateItem(item.id, { systemQty: afterQty });
      movement.afterQty = afterQty;
    }
    rows[index] = { ...movement, status, approvedBy: supervisor, resolvedAt: now() };
    write(MOVEMENTS_KEY, rows);
    return clone(rows[index]);
  }

  function resetDemo() {
    localStorage.removeItem(INVENTORY_KEY);
    localStorage.removeItem(MOVEMENTS_KEY);
    load(); movements();
  }

  window.KhairatInventory = {
    load,
    save,
    movements,
    available,
    updateItem,
    submitCount,
    submitWaste,
    approveMovement: (id, supervisor) => resolveMovement(id, "approved", supervisor),
    rejectMovement: (id, supervisor) => resolveMovement(id, "rejected", supervisor),
    resetDemo,
    socialPost: SOCIAL_POST
  };
})();
