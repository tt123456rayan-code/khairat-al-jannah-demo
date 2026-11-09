const productPresentation = {
  1: { badge: "طازة يومياً", color: "#fff4ef", oldPrice: 0.99 },
  2: { badge: "اختيار الموسم", color: "#fff8e8", oldPrice: 1.20 },
  3: { badge: "اختيار العائلة", color: "#fff5f1", oldPrice: 4.15 },
  4: { badge: "مبرد", color: "#f2f7f4", oldPrice: 1.25 },
  5: { badge: "مواد تموينية", color: "#faf6ec", oldPrice: 5.75 },
  6: { badge: "سعر إعلان رسمي", color: "#fff9e5", oldPrice: null },
  7: { badge: "نظافة البيت", color: "#edf8f1", oldPrice: 1.65 },
  8: { badge: "طازة يومياً", color: "#fffaf0", oldPrice: 2.60 },
  9: { badge: "سعر إعلان رسمي", color: "#f7f4e5", oldPrice: null }
};

const state = { cart: new Map(), category: "الكل", search: "" };
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const money = (value) => `${Number(value).toFixed(2)} د.أ`;
const productGrid = $("#productGrid");
const emptySearch = $("#emptySearch");
const overlay = $("#overlay");
const cartDrawer = $("#cartDrawer");
let toastTimer;
let deferredInstallPrompt;

function products() {
  return window.KhairatInventory.load().map((item) => ({
    ...item,
    ...productPresentation[item.id],
    oldPrice: item.oldPrice ?? productPresentation[item.id]?.oldPrice ?? null,
    available: window.KhairatInventory.available(item)
  }));
}

function productById(id) { return products().find((item) => item.id === Number(id)); }

function renderProducts() {
  const needle = state.search.trim().toLowerCase();
  const visible = products().filter((product) => {
    const inCategory = state.category === "الكل" || product.category === state.category;
    const matchesSearch = !needle || `${product.name} ${product.category} ${product.sku}`.toLowerCase().includes(needle);
    return inCategory && matchesSearch;
  });

  productGrid.innerHTML = visible.map((product) => {
    const low = product.available > 0 && product.available <= product.minQty;
    const safeSource = /^https:\/\/(www\.)?(instagram|facebook)\.com\//i.test(product.priceSource || "") ? product.priceSource : "";
    const source = product.priceKind === "social" && safeSource
      ? `<a class="product-card__source is-verified" href="${safeSource}" target="_blank" rel="noopener">مطابق لإعلان 3/11/2026 ↗</a>`
      : `<span class="product-card__source">سعر تجريبي — يراجع قبل الإطلاق</span>`;
    const stockText = product.available === 0 ? "نفد من الفرع" : low ? `بقي ${product.available} ${product.unit}` : "متوفر في الفرع";
    return `
      <article class="product-card ${product.available === 0 ? "is-soldout" : ""}">
        <span class="product-card__badge ${product.priceKind === "social" ? "is-verified" : ""}">${product.badge}</span>
        <button class="product-card__favorite" type="button" aria-label="إضافة ${product.name} للمفضلة">♡</button>
        <div class="product-card__visual" style="background:${product.color}">
          <img class="product-card__image" src="${product.image}" alt="${product.name}" loading="lazy" />
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${product.category}</span>
          <h3 title="${product.name}">${product.name}</h3>
          <span class="product-card__unit">${product.unit}</span>
          ${source}
          <span class="product-card__stock ${low ? "is-low" : ""}">${stockText}</span>
          <div class="product-card__bottom">
            <div class="product-card__price"><strong>${Number(product.price).toFixed(2)} <small>د.أ</small></strong>${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div>
            <button class="add-button" type="button" data-add="${product.id}" aria-label="أضف ${product.name} للسلة" ${product.available === 0 ? "disabled" : ""}>${product.available === 0 ? "×" : "+"}</button>
          </div>
        </div>
      </article>`;
  }).join("");

  emptySearch.hidden = visible.length > 0;
  productGrid.hidden = visible.length === 0;
}

function addToCart(productId) {
  const product = productById(productId);
  if (!product || product.available === 0) return showToast("هذا الصنف غير متوفر حالياً");
  const current = state.cart.get(productId) || 0;
  if (current >= product.available) return showToast("وصلت للكمية المتوفرة في الفرع");
  state.cart.set(productId, current + 1);
  updateCart();
  showToast(`تمت إضافة ${product.name} للسلة`);
  const button = $(`[data-add="${productId}"]`);
  if (button) {
    button.textContent = "✓";
    button.classList.add("is-added");
    setTimeout(() => { button.textContent = "+"; button.classList.remove("is-added"); }, 700);
  }
}

function setQuantity(productId, amount) {
  const product = productById(productId);
  if (!product) return;
  if (amount <= 0) state.cart.delete(productId);
  else if (amount <= product.available) state.cart.set(productId, amount);
  else showToast("الكمية المطلوبة أكبر من المتوفر");
  updateCart();
}

function cartData() {
  let count = 0;
  let subtotal = 0;
  const entries = [];
  state.cart.forEach((quantity, id) => {
    const product = productById(id);
    if (!product) return;
    count += quantity;
    subtotal += Number(product.price) * quantity;
    entries.push({ product, quantity });
  });
  const delivery = subtotal === 0 || subtotal >= 25 ? 0 : 2;
  return { count, subtotal, delivery, total: subtotal + delivery, entries };
}

function updateCart() {
  const { count, subtotal, delivery, total, entries } = cartData();
  $("#cartCount").textContent = count;
  $("#mobileCartCount").textContent = count;
  $("#cartTotalHeader").textContent = money(subtotal);
  $("#cartSubtotal").textContent = money(subtotal);
  $("#deliveryFee").textContent = subtotal >= 25 ? "مجاني" : money(delivery);
  $("#cartGrandTotal").textContent = money(total);
  $("#checkoutButton").disabled = count === 0;
  $("#checkoutButton").style.opacity = count === 0 ? ".5" : "1";

  const progress = Math.min((subtotal / 25) * 100, 100);
  $("#deliveryProgressBar").style.width = `${progress}%`;
  $("#deliveryProgressText").textContent = subtotal >= 25
    ? "مبروك! توصيل الطلب مجاني"
    : `باقي ${money(Math.max(0, 25 - subtotal))} لتحصل على توصيل مجاني`;

  if (!entries.length) {
    $("#cartItems").innerHTML = `<div class="cart-empty"><svg class="ui-icon"><use href="#icon-cart" /></svg><h3>سلتك لسا فاضية</h3><p>ضيف عليها شوية خيرات من المنتجات المتوفرة.</p></div>`;
    return;
  }

  $("#cartItems").innerHTML = entries.map(({ product, quantity }) => `
    <article class="cart-item">
      <div class="cart-item__visual" style="background:${product.color}"><img src="${product.image}" alt="" /></div>
      <div><h4>${product.name}</h4><small>${product.unit}</small></div>
      <div class="cart-item__right">
        <strong>${money(product.price * quantity)}</strong>
        <div class="qty-control">
          <button type="button" data-decrease="${product.id}" aria-label="إنقاص الكمية">−</button>
          <span>${quantity}</span>
          <button type="button" data-increase="${product.id}" aria-label="زيادة الكمية">+</button>
        </div>
      </div>
    </article>`).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function openOverlay() { overlay.hidden = false; document.body.classList.add("modal-open"); }
function closeAll() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  $$(".modal.is-open").forEach((modal) => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); });
  overlay.hidden = true;
  document.body.classList.remove("modal-open");
}
function openCart() { closeAll(); openOverlay(); cartDrawer.classList.add("is-open"); cartDrawer.setAttribute("aria-hidden", "false"); }
function openModal(id) {
  closeAll(); openOverlay();
  const modal = $(id);
  modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
  $("button, input, select", modal)?.focus();
}

function filterCategory(category) {
  state.category = category;
  $$(".category-card").forEach((card) => card.classList.toggle("is-active", card.dataset.category === category));
  renderProducts();
  $("#offers").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateSearch(value) {
  state.search = value;
  $("#searchInput").value = value;
  $("#mobileSearchInput").value = value;
  renderProducts();
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  openModal("#installModal");
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest(".product-card__favorite");
  if (addButton && !addButton.disabled) addToCart(Number(addButton.dataset.add));
  if (favoriteButton) {
    favoriteButton.classList.toggle("is-favorite");
    favoriteButton.textContent = favoriteButton.classList.contains("is-favorite") ? "♥" : "♡";
    showToast(favoriteButton.classList.contains("is-favorite") ? "أضفناه للمفضلة" : "شِلناه من المفضلة");
  }
});

$("#cartItems").addEventListener("click", (event) => {
  const plus = event.target.closest("[data-increase]");
  const minus = event.target.closest("[data-decrease]");
  if (plus) setQuantity(Number(plus.dataset.increase), (state.cart.get(Number(plus.dataset.increase)) || 0) + 1);
  if (minus) setQuantity(Number(minus.dataset.decrease), (state.cart.get(Number(minus.dataset.decrease)) || 0) - 1);
});

$$('[data-category]').forEach((card) => card.addEventListener("click", () => filterCategory(card.dataset.category)));
[$("#searchInput"), $("#mobileSearchInput")].forEach((input) => input.addEventListener("input", (event) => updateSearch(event.target.value)));
[$("#cartButton"), $("#mobileCartButton")].forEach((button) => button.addEventListener("click", openCart));
$("#closeCart").addEventListener("click", closeAll);
overlay.addEventListener("click", closeAll);
$$('[data-close-modal]').forEach((button) => button.addEventListener("click", closeAll));
$("#branchButton").addEventListener("click", () => openModal("#branchModal"));
$$('[data-branch]').forEach((button) => button.addEventListener("click", () => {
  $("#selectedBranch").textContent = button.dataset.branch;
  closeAll(); showToast(`تم اختيار ${button.dataset.branch}`);
}));
$("#checkoutButton").addEventListener("click", () => { if (cartData().count) openModal("#checkoutModal"); });
$("#checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  cartData().entries.forEach(({ product, quantity }) => {
    window.KhairatInventory.updateItem(product.id, { reserved: Number(product.reserved || 0) + quantity });
  });
  state.cart.clear(); updateCart(); renderProducts(); openModal("#successModal");
});
$("#repeatOrderButton").addEventListener("click", () => {
  [1, 4, 5, 7].forEach((id) => { if (productById(id)?.available) state.cart.set(id, 1); });
  updateCart(); openCart(); showToast("جهّزنا طلبك المعتاد");
});
$("#showAllCategories").addEventListener("click", () => filterCategory("الكل"));
$("#allDepartments").addEventListener("click", () => $("#categories-title").scrollIntoView({ behavior: "smooth", block: "start" }));
$$('[data-nav-category]').forEach((link) => link.addEventListener("click", () => filterCategory(link.dataset.navCategory)));
$("#resetSearch").addEventListener("click", () => { updateSearch(""); filterCategory("الكل"); });
[$("#installAppButton"), $("#installPromoButton")].forEach((button) => button?.addEventListener("click", installApp));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAll(); });
window.addEventListener("khairat:inventory-change", () => { renderProducts(); updateCart(); });
window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferredInstallPrompt = event; });
window.addEventListener("appinstalled", () => showToast("تم تثبيت تطبيق خيرات الجنة بنجاح"));

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

renderProducts();
updateCart();
