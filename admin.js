const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const store = window.KhairatInventory;
const supervisor = "خالد عقل — مدير أفرع";
const viewTitles = { overview: "صباح الخير، خالد", inventory: "إدارة المخزون", counts: "طلبات العدّ", waste: "التوالف والفاقد", audit: "سجل التدقيق", admins: "فريق الإدارة" };
let toastTimer;
let modalReturnFocus;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const qty = (value) => Number(value).toLocaleString("ar-JO", { maximumFractionDigits: 2 });
const jod = (value) => `${Number(value).toLocaleString("ar-JO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ`;
const itemById = (id) => store.load().find((item) => item.id === Number(id));
const available = (item) => store.available(item);
const statusOf = (item) => available(item) <= 0 ? "out" : available(item) <= item.minQty ? "low" : "healthy";
const statusLabel = (status) => ({ out: "نافد", low: "منخفض", healthy: "جيد" })[status];
const typeLabel = (type) => ({ receipt: "استلام", sale: "بيع", count: "تسوية عدّ", waste: "تالف" })[type] || type;
const typeIcon = (type) => ({ receipt: "i-box", sale: "i-tag", count: "i-count", waste: "i-waste" })[type] || "i-audit";
const dateTime = (value) => new Intl.DateTimeFormat("ar-JO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));

function showToast(message) {
  const toast = $("#adminToast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function showView(name) {
  if (!Object.prototype.hasOwnProperty.call(viewTitles, name)) name = "overview";
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
  $$('[data-view]').forEach((button) => button.classList.toggle("is-active", button.dataset.view === name));
  $("#pageTitle").textContent = viewTitles[name] || viewTitles.overview;
  document.title = `${viewTitles[name]} | إدارة خيرات الجنة`;
  if (location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function itemCell(item) {
  return `<div class="item-cell"><img src="${escapeHtml(item.image)}" alt=""/><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.sku)} · ${escapeHtml(item.unit)}</small></div></div>`;
}

function renderMetrics() {
  const items = store.load();
  const moves = store.movements();
  const stockValue = items.reduce((sum, item) => sum + item.cost * item.systemQty, 0);
  const low = items.filter((item) => statusOf(item) !== "healthy").length;
  const pending = moves.filter((row) => row.status === "pending").length;
  const wasteValue = moves.filter((row) => row.type === "waste" && row.status !== "rejected").reduce((sum, row) => sum + Number(row.qty) * (itemById(row.itemId)?.cost || 0), 0);
  $("#metricGrid").innerHTML = [
    ["قيمة المخزون", jod(stockValue), "بتكلفة الشراء الحالية", "i-box", ""],
    ["مخزون منخفض", `${low} أصناف`, "تحتاج طلباً أو مراجعة", "i-count", low ? "is-warn" : ""],
    ["بانتظار الاعتماد", `${pending} حركات`, "لا تؤثر قبل موافقة المدير", "i-shield", pending ? "is-alert" : ""],
    ["قيمة التالف المسجل", jod(wasteValue), "يشمل الطلبات قيد المراجعة", "i-waste", "is-alert"]
  ].map(([label, value, note, icon, cls]) => `<article class="metric-card ${cls}"><div class="metric-card__top"><span>${label}</span><i class="metric-card__icon"><svg><use href="#${icon}"/></svg></i></div><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#lowBadge").textContent = low || "";
  $("#countBadge").textContent = moves.filter((row) => row.type === "count" && row.status === "pending").length || "";
  $("#wasteBadge").textContent = moves.filter((row) => row.type === "waste" && row.status === "pending").length || "";
}

function renderOverview() {
  const attention = store.load().filter((item) => statusOf(item) !== "healthy" || new Date(item.expiry) - Date.now() < 4 * 86400000).slice(0, 5);
  $("#attentionList").innerHTML = attention.length ? attention.map((item) => `<div class="attention-row">${itemCell(item)}<strong>${qty(available(item))} ${escapeHtml(item.unit)}</strong><span class="status status--${statusOf(item)}">${statusLabel(statusOf(item))}</span></div>`).join("") : `<div class="empty-state">لا توجد تنبيهات حالياً</div>`;
  $("#recentMovements").innerHTML = store.movements().slice(0, 5).map((row) => {
    const item = itemById(row.itemId);
    return `<div class="movement-row"><i class="movement-icon"><svg><use href="#${typeIcon(row.type)}"/></svg></i><div><strong>${typeLabel(row.type)} · ${escapeHtml(item?.name || "صنف")}</strong><small>${escapeHtml(row.employee || "النظام")} · ${row.status === "pending" ? "قيد المراجعة" : "معتمدة"}</small></div><time>${dateTime(row.createdAt)}</time></div>`;
  }).join("");
}

function actionButtons(item) {
  return `<div class="row-actions"><button data-count-item="${item.id}">عدّ</button><button data-waste-item="${item.id}">تالف</button><button data-price-item="${item.id}">السعر</button></div>`;
}

function renderInventory() {
  const needle = $("#inventorySearch").value.trim().toLowerCase();
  const filter = $("#stockFilter").value;
  const items = store.load().filter((item) => {
    const match = !needle || `${item.name} ${item.sku} ${item.barcode}`.toLowerCase().includes(needle);
    return match && (filter === "all" || statusOf(item) === filter);
  });
  $("#inventoryRows").innerHTML = items.map((item) => `<tr><td>${itemCell(item)}</td><td>${escapeHtml(item.location)}</td><td><strong>${qty(item.systemQty)}</strong></td><td>${qty(item.reserved)}</td><td><strong>${qty(available(item))}</strong></td><td>${qty(item.minQty)}</td><td>${jod(item.price)}${item.priceKind === "social" ? `<small class="status status--approved">موثّق</small>` : ""}</td><td><span class="status status--${statusOf(item)}">${statusLabel(statusOf(item))}</span></td><td>${actionButtons(item)}</td></tr>`).join("");
  $("#inventoryCards").innerHTML = items.map((item) => `<article class="inventory-card"><div class="inventory-card__head">${itemCell(item)}<span class="status status--${statusOf(item)}">${statusLabel(statusOf(item))}</span></div><div class="inventory-card__numbers"><div><span>النظام</span><strong>${qty(item.systemQty)}</strong></div><div><span>محجوز</span><strong>${qty(item.reserved)}</strong></div><div><span>متاح</span><strong>${qty(available(item))}</strong></div></div>${actionButtons(item)}</article>`).join("");
}

function approvalCard(row) {
  const item = itemById(row.itemId);
  const isCount = row.type === "count";
  const amount = isCount ? row.countedQty : row.qty;
  const variance = isCount ? Number(row.variance) : -Number(row.qty);
  return `<article class="approval-card">${itemCell(item)}<div><span>${isCount ? "الكمية المعدودة" : "الكمية التالفة"}</span><strong>${qty(amount)} ${escapeHtml(item.unit)}</strong></div><div><span>${isCount ? "الفرق" : "السبب"}</span><strong class="${variance < 0 ? "variance-down" : "variance-up"}">${isCount ? `${variance > 0 ? "+" : ""}${qty(variance)}` : escapeHtml(row.reason)}</strong></div><div><span>الموظف والوقت</span><strong>${escapeHtml(row.employee)}</strong><small>${dateTime(row.createdAt)}</small></div><div class="approval-actions"><button class="approve" data-approve="${row.id}">اعتماد</button><button class="reject" data-reject="${row.id}">رفض</button></div></article>`;
}

function renderApprovals() {
  const moves = store.movements();
  const counts = moves.filter((row) => row.type === "count" && row.status === "pending");
  const waste = moves.filter((row) => row.type === "waste" && row.status === "pending");
  $("#pendingCounts").innerHTML = counts.length ? counts.map(approvalCard).join("") : `<div class="empty-state">لا توجد طلبات عدّ بانتظار الاعتماد.</div>`;
  $("#pendingWaste").innerHTML = waste.length ? waste.map(approvalCard).join("") : `<div class="empty-state">لا توجد توالف بانتظار الاعتماد.</div>`;
  const allWaste = moves.filter((row) => row.type === "waste" && row.status !== "rejected");
  const totalQty = allWaste.reduce((sum, row) => sum + Number(row.qty), 0);
  const totalValue = allWaste.reduce((sum, row) => sum + Number(row.qty) * (itemById(row.itemId)?.cost || 0), 0);
  const reasons = [...new Set(allWaste.map((row) => row.reason))].length;
  $("#wasteKpis").innerHTML = `<article class="waste-kpi"><span>إجمالي الكمية</span><strong>${qty(totalQty)}</strong><small>وحدة/كغم حسب الصنف</small></article><article class="waste-kpi"><span>القيمة التقديرية</span><strong>${jod(totalValue)}</strong><small>على أساس تكلفة الشراء</small></article><article class="waste-kpi"><span>أسباب مسجلة</span><strong>${reasons}</strong><small>لتحليل السبب الجذري</small></article>`;
}

function renderAudit() {
  $("#auditList").innerHTML = store.movements().map((row) => {
    const item = itemById(row.itemId);
    const after = row.afterQty == null ? "—" : qty(row.afterQty);
    return `<article class="audit-row"><time>${dateTime(row.createdAt)}</time><span class="status status--${row.status}">${row.status === "approved" ? "معتمد" : row.status === "rejected" ? "مرفوض" : "قيد المراجعة"}</span><strong>${typeLabel(row.type)} · ${escapeHtml(item?.name || "صنف محذوف")}</strong><span class="audit-user">${escapeHtml(row.employee || "النظام")}</span><code>${qty(row.beforeQty ?? 0)} ← ${after}</code></article>`;
  }).join("");
}

function populateSelects() {
  const options = store.load().map((item) => `<option value="${item.id}">${escapeHtml(item.name)} — ${escapeHtml(item.location)}</option>`).join("");
  $("#countItem").innerHTML = `<option value="">اختر الصنف</option>${options}`;
  $("#wasteItem").innerHTML = `<option value="">اختر الصنف</option>${options}`;
}

function renderAll() { renderMetrics(); renderOverview(); renderInventory(); renderApprovals(); renderAudit(); populateSelects(); }

function openModal(id, itemId) {
  modalReturnFocus = document.activeElement;
  const modal = $(id);
  if (itemId && id === "#countModal") $("#countItem").value = itemId;
  if (itemId && id === "#wasteModal") $("#wasteItem").value = itemId;
  $("#adminOverlay").hidden = false;
  document.body.classList.add("modal-open");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  $("input:not([type=hidden]),select", modal)?.focus();
}

function closeModals() {
  const wasOpen = !!$(".admin-modal.is-open");
  $$(".admin-modal.is-open").forEach((modal) => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); });
  $("#adminOverlay").hidden = true;
  document.body.classList.remove("modal-open");
  if (wasOpen && modalReturnFocus?.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}

function openPrice(itemId) {
  const item = itemById(itemId);
  $("#priceItemId").value = item.id;
  $("#priceValue").value = item.price;
  $("#priceDate").value = item.pricePublishedAt || "";
  $("#priceSource").value = item.priceSource || "";
  $("#priceVerified").checked = item.priceKind === "social";
  $("#priceTitle").textContent = `تحديث سعر ${item.name}`;
  openModal("#priceModal");
}

document.addEventListener("click", (event) => {
  const view = event.target.closest("[data-view]");
  const count = event.target.closest("[data-open-count],[data-count-item]");
  const waste = event.target.closest("[data-open-waste],[data-waste-item]");
  const price = event.target.closest("[data-price-item]");
  const approve = event.target.closest("[data-approve]");
  const reject = event.target.closest("[data-reject]");
  if (view) showView(view.dataset.view);
  if (count) openModal("#countModal", count.dataset.countItem);
  if (waste) openModal("#wasteModal", waste.dataset.wasteItem);
  if (price) openPrice(price.dataset.priceItem);
  if (approve) { store.approveMovement(approve.dataset.approve, supervisor); renderAll(); showToast("تم اعتماد الحركة وتحديث المخزون"); }
  if (reject) { store.rejectMovement(reject.dataset.reject, supervisor); renderAll(); showToast("تم رفض الحركة مع الاحتفاظ بها في السجل"); }
});

$$('[data-close-modal]').forEach((button) => button.addEventListener("click", closeModals));
$("#adminOverlay").addEventListener("click", closeModals);
$("#inventorySearch").addEventListener("input", renderInventory);
$("#stockFilter").addEventListener("change", renderInventory);
$("#barcodeInput").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const item = store.load().find((row) => row.barcode === event.target.value.trim());
  if (!item) return showToast("الباركود غير موجود");
  $("#inventorySearch").value = item.sku;
  renderInventory();
  showToast(`تم العثور على ${item.name}`);
});

$("#countForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = { itemId: $("#countItem").value, countedQty: $("#countQty").value, employee: $("#countEmployee").value.trim(), note: $("#countNote").value.trim(), photoName: $("#countPhoto").files[0]?.name || "" };
  closeModals();
  store.submitCount(payload);
  event.target.reset(); renderAll(); showView("counts"); showToast("تم إرسال العدّ للمراجعة دون تعديل الكمية");
});

$("#wasteForm").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const note = [$("#wasteNote").value.trim(), $("#quarantineBin").value.trim() ? `صندوق الحجر: ${$("#quarantineBin").value.trim()}` : ""].filter(Boolean).join(" — ");
    const payload = { itemId: $("#wasteItem").value, qty: $("#wasteQty").value, reason: $("#wasteReason").value, employee: $("#wasteEmployee").value.trim(), note, photoName: $("#wastePhoto").files[0]?.name || "" };
    closeModals();
    store.submitWaste(payload);
    event.target.reset(); renderAll(); showView("waste"); showToast("تم حجز التالف بانتظار اعتماد المدير");
  } catch (error) { showToast(error.message); }
});

$("#priceForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const source = $("#priceSource").value.trim();
  const verified = $("#priceVerified").checked && /^https:\/\/(www\.)?(instagram|facebook)\.com\//i.test(source);
  store.updateItem($("#priceItemId").value, { price: Number($("#priceValue").value), pricePublishedAt: $("#priceDate").value, priceSource: verified ? source : "", priceKind: verified ? "social" : "demo" });
  closeModals(); renderAll(); showToast(verified ? "تم نشر السعر كمطابق للإعلان الرسمي" : "تم حفظ السعر كسعر تجريبي غير موثّق");
});

$("#exportAudit").addEventListener("click", () => {
  const rows = [["id", "type", "item", "before", "after", "status", "employee", "approvedBy", "createdAt"], ...store.movements().map((row) => [row.id, row.type, itemById(row.itemId)?.name || "", row.beforeQty ?? "", row.afterQty ?? "", row.status, row.employee || "", row.approvedBy || "", row.createdAt])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = `khairat-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click(); URL.revokeObjectURL(link.href);
  showToast("تم تجهيز سجل التدقيق للتنزيل");
});

document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModals(); });
window.addEventListener("khairat:inventory-change", renderAll);
renderAll();
if (location.hash) showView(location.hash.slice(1));
