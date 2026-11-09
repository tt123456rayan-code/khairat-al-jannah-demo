const root = document.body.dataset.root || "";
const route = document.body.dataset.route || "home";
const inventory = window.KhairatInventory.load();
const ids = {
  1: "tomato", 2: "orange", 3: "chicken", 4: "milk", 5: "rice",
  6: "tunisian-olive-oil", 7: "dish-soap", 8: "white-cheese", 9: "jordanian-olive-oil"
};
const departments = [
  { slug: "produce", name: "الخضار والفواكه", short: "طازة كل يوم", image: "assets/product-tomato-web.png", match: "خضار وفواكه" },
  { slug: "meat", name: "اللحوم والدواجن", short: "اختيار العيلة", image: "assets/product-chicken-web.png", match: "لحوم ودواجن" },
  { slug: "dairy", name: "الألبان والأجبان", short: "من ثلاجتنا لبيتك", image: "assets/product-cheese-web.png", match: "ألبان وأجبان" },
  { slug: "pantry", name: "المواد التموينية", short: "أساسيات البيت", image: "assets/product-rice-web.png", match: "مواد تموينية" },
  { slug: "cleaning", name: "العناية بالمنزل", short: "بيت مرتب", image: "assets/product-soap-web.png", match: "منظفات" }
];
const asset = path => root + path;
const link = path => root + path;
const price = value => Number(value).toFixed(2) + " د.أ";
const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);
const iconPaths = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  cart: '<path d="M3 4h2l2 12h11l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  heart: '<path d="M20.8 8.5c0 4.6-8.8 10-8.8 10s-8.8-5.4-8.8-10a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.5-4 3-6 7.5-6s7 2 7.5 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  arrow: '<path d="m14 5-7 7 7 7"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  truck: '<path d="M3 6h11v11H3zM14 9h4l3 4v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>'
};
const icon = (name, className = "") => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
const readList = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const readCart = () => readList("khairat-store-cart-v1");
const readFavorites = () => readList("khairat-store-favorites-v1");
const product = id => inventory.find(item => item.id === Number(id));
const productImage = item => [6, 9].includes(item.id) ? "assets/olive-oil-tin-illustrative.png" : item.image;
const productImageAlt = item => [6, 9].includes(item.id) ? "صورة توضيحية لعبوة زيت زيتون غير مطابقة لعلامة تجارية محددة" : item.name;
const productUrl = item => link("products/" + ids[item.id] + "/");
const available = item => window.KhairatInventory.available(item);
const isVerified = item => item.priceKind === "social" && item.priceSource;
const getCategory = category => departments.find(item => item.slug === category);
const categoryUrl = item => link("categories/" + item.slug + "/");

function header() {
  const count = readCart().reduce((sum, line) => sum + line.qty, 0);
  return `
    <div class="utility"><div class="wrap utility-inner"><span>أسواق خيرات الجنة · الأردن</span><span>تسوّق أسهل من فروعنا في عمّان</span><a href="tel:+962770354848">07 7035 4848</a></div></div>
    <header class="site-header"><div class="wrap masthead">
      <a class="brand" href="${link("")}" aria-label="خيرات الجنة الرئيسية"><img src="${asset("assets/khairat-logo-web.png")}" alt="شعار أسواق خيرات الجنة"></a>
      <a class="delivery-select" href="${link("branches/")}">${icon("pin")}<span><small>الفروع والتغطية</small><strong>عمّان، الأردن</strong></span>${icon("arrow", "tiny")}</a>
      <form class="global-search" action="${link("search/")}" method="get">${icon("search")}<input name="q" type="search" placeholder="ابحث عن الخضار، الألبان، أو منتج..." aria-label="ابحث عن منتج"><button type="submit">بحث</button></form>
      <nav class="quick-links" aria-label="حسابك وسلتك">
        <a href="${link("account/")}" aria-label="حسابي">${icon("user")}<span>حسابي</span></a>
        <a href="${link("favorites/")}" aria-label="المفضلة">${icon("heart")}<span>المفضلة</span></a>
        <a href="${link("cart/")}" aria-label="السلة">${icon("cart")}<span>السلة</span><b class="cart-count">${count}</b></a>
      </nav>
    </div>
    <div class="nav-border"><nav class="wrap department-nav" aria-label="التسوق"><a class="nav-all" href="${link("categories/")}">${icon("menu")} كل الأقسام</a><a href="${link("shop/")}">جميع المنتجات</a><a href="${link("categories/produce/")}">خضار وفواكه</a><a href="${link("categories/meat/")}">لحوم ودواجن</a><a href="${link("categories/dairy/")}">ألبان وأجبان</a><a href="${link("categories/pantry/")}">مواد تموينية</a><a href="${link("offers/")}" class="nav-offers">الأسعار المنشورة</a><a href="${link("help/")}" class="nav-help">مساعدة</a></nav></div></header>
    <div class="fixture-banner"><div class="wrap">معاينة تصميم ببيانات تجريبية. أسعار زيت الزيتون موثقة بمنشور 3 نوفمبر 2026 وتحتاج تأكيد صلاحيتها من الفرع قبل الشراء.</div></div>
  `;
}

function footer() {
  return `<footer class="footer"><div class="wrap footer-main"><div class="footer-brand"><img src="${asset("assets/khairat-logo-web.png")}" alt="خيرات الجنة"><p>خيرات البيت، بتجربة تسوّق أوضح وأسهل.</p></div><div><h3>تسوّق</h3><a href="${link("shop/")}">المنتجات</a><a href="${link("categories/")}">الأقسام</a><a href="${link("offers/")}">الأسعار المنشورة</a></div><div><h3>خدمتك</h3><a href="${link("branches/")}">الفروع</a><a href="${link("help/")}">المساعدة</a><a href="${link("account/orders/")}">طلباتي</a></div><div><h3>تواصل معنا</h3><a href="tel:+962770354848" dir="ltr">+962 77 035 4848</a><a href="https://wa.me/962770354848" target="_blank" rel="noopener">واتساب خدمة العملاء</a></div></div><div class="wrap footer-bottom"><span>© 2026 أسواق خيرات الجنة</span><span>معاينة واجهة تسوّق للأردن</span></div></footer>
  <nav class="mobile-nav" aria-label="التنقل على الهاتف"><a href="${link("")}">${icon("menu")}<span>الرئيسية</span></a><a href="${link("categories/")}">${icon("filter")}<span>الأقسام</span></a><a href="${link("offers/")}">${icon("heart")}<span>الأسعار</span></a><a href="${link("cart/")}">${icon("cart")}<span>السلة</span><b>${readCart().reduce((n,x)=>n+x.qty,0)}</b></a><a href="${link("account/")}">${icon("user")}<span>حسابي</span></a></nav>`;
}

function productCard(item) {
  const favorite = readFavorites().includes(item.id);
  const quantity = readCart().find(line => line.id === item.id)?.qty || 0;
  return `<article class="product-card"><div class="product-media">
    <a href="${productUrl(item)}" aria-label="عرض ${esc(item.name)}"><img src="${asset(productImage(item))}" alt="${esc(productImageAlt(item))}" loading="lazy"></a>
    <button class="favorite-button ${favorite ? "is-active" : ""}" data-favorite="${item.id}" aria-label="${favorite ? "إزالة من" : "إضافة إلى"} المفضلة">${icon("heart")}</button>
    ${isVerified(item) ? '<span class="media-label">سعر منشور سابقاً</span>' : ""}
  </div><div class="product-details"><a class="product-name" href="${productUrl(item)}">${esc(item.name)}</a>
    <span class="product-unit">${esc(item.unit)}</span>
    <div class="product-bottom"><div><strong class="product-price">${price(item.price)}</strong><small class="price-note">${isVerified(item) ? "منشور 3/11 · تحقق من الفرع" : "سعر تجريبي"}</small></div>
    <button class="add-to-cart" data-add="${item.id}" aria-label="أضف ${esc(item.name)} للسلة" ${available(item) <= quantity ? "disabled" : ""}>${icon(quantity ? "plus" : "cart")}<span>${quantity ? "أضف" : "للسلة"}</span></button></div>
  </div></article>`;
}

function sectionHead(kicker, title, href, action) {
  return `<div class="section-head"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div>${href ? `<a href="${href}" class="see-all">${action || "تسوق الكل"} ${icon("arrow")}</a>` : ""}</div>`;
}
function grid(items) { return `<div class="product-grid">${items.map(productCard).join("")}</div>`; }
function breadcrumbs(parts) { return `<nav class="breadcrumbs" aria-label="مسار الصفحة"><a href="${link("")}">الرئيسية</a>${parts.map(part => `${icon("arrow")}<span>${esc(part)}</span>`).join("")}</nav>`; }

function homePage() {
  const produce = inventory.filter(item => item.category === "خضار وفواكه");
  const essentials = inventory.filter(item => ["مواد تموينية","ألبان وأجبان"].includes(item.category)).slice(0,4);
  return `<main>
    <section class="wrap hero"><img class="hero-photo" src="${asset("assets/khairat-hero.png")}" alt="تشكيلة خضار وفواكه ومنتجات طازجة"><div class="hero-shade"></div><div class="hero-copy"><span class="hero-kicker">خيرات الجنة · لمة البيت</span><h1><span>خير بيتك</span><em>صار أقرب</em></h1><p>من خضرة السفرة لأساسيات المطبخ، اكتشف الأقسام وخلي طلبك على ذوقك.</p><a class="primary-btn" href="${link("shop/")}">ابدأ التسوق ${icon("arrow")}</a></div><div class="hero-index"><b>01</b><span>تسوق خيرات البيت</span></div></section>
    <section class="wrap benefits"><div>${icon("truck")}<span><strong>توصيل داخل مناطق التغطية</strong><small>تأكد من الفرع عند إتمام الطلب</small></span></div><div>${icon("check")}<span><strong>اختيار بعناية</strong><small>تشكيلة الخضار والمواد اليومية</small></span></div><div>${icon("pin")}<span><strong>فروع قريبة منك</strong><small>شارع مكة، أم السماق، المدينة والفحيص</small></span></div></section>
    <section class="wrap section"><div class="section-head"><div><span class="eyebrow">من وين نبدأ؟</span><h2>كل خيراتك بأقسام واضحة</h2></div><a class="see-all" href="${link("categories/")}">جميع الأقسام ${icon("arrow")}</a></div><div class="category-grid">${departments.map((category,index)=>`<a class="category-tile category-${index+1}" href="${categoryUrl(category)}"><span class="category-image"><img src="${asset(category.image)}" alt=""></span><strong>${category.name}</strong><small>${category.short}</small>${icon("arrow")}</a>`).join("")}</div></section>
    <section class="wrap editorial-banner"><div><span class="eyebrow">من اختيارنا للمطبخ</span><h2>الطازة بيغيّر<br>طعم كل يوم</h2><p>تشكيلة خضار وفواكه جاهزة لتكمّل سفرتك.</p><a href="${link("categories/produce/")}" class="outline-btn">تسوق الخضار والفواكه ${icon("arrow")}</a></div><img src="${asset("assets/product-tomato-web.png")}" alt="بندورة بلدية"></section>
    <section class="wrap section">${sectionHead("اختيارات طازة", "من قسم الخضار والفواكه", link("categories/produce/"))}${grid(produce)}</section>
    <section class="wrap section">${sectionHead("قائمة البيت", "أساسيات تستاهل مكانها", link("categories/pantry/"))}${grid(essentials)}</section>
    <section class="wrap service-cta"><div><span class="eyebrow">قريبين منك</span><h2>اختار الفرع الأقرب<br>إلك ولعيلتك</h2><p>تعرّف على مواقع فروع خيرات الجنة ومناطق الخدمة.</p><a class="primary-btn" href="${link("branches/")}">استكشف الفروع ${icon("arrow")}</a></div><div class="service-map">${icon("pin")}<span>عمّان<br><small>٤ فروع مذكورة في قنوات خيرات الجنة</small></span></div></section>
  </main>`;
}

function listingPage(mode) {
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  const category = mode.startsWith("category:") ? getCategory(mode.split(":")[1]) : null;
  const title = mode === "search" ? "نتائج البحث" : category?.name || "جميع المنتجات";
  const base = category ? inventory.filter(item => item.category === category.match) : mode === "offers" ? inventory.filter(isVerified) : inventory;
  const heading = mode === "offers" ? "أسعار منشورة من الحساب الرسمي" : title;
  return `<main class="wrap page-main">${breadcrumbs([heading])}
    ${mode === "offers" ? `<section class="offers-hero"><div><span class="eyebrow">منشورات خيرات الجنة</span><h1>السعر من مصدره.<br><em>والتأكيد من الفرع.</em></h1><p>أسعار زيت الزيتون التالية وردت في منشور ٣ نوفمبر ٢٠٢٦. احتفظنا بها للمعاينة، وتحتاج تأكيداً قبل الشراء.</p><a href="${esc(base[0]?.priceSource || '#')}" target="_blank" rel="noopener" class="outline-btn">شاهد المنشور ${icon("arrow")}</a></div><img src="${asset("assets/olive-oil-tin-illustrative.png")}" alt="صورة توضيحية لتنكة زيت زيتون"></section>` : ""}
    <div class="listing-intro"><div><span class="eyebrow">${mode === "offers" ? "من أرشيف الأسعار" : "تسوّق بكل سهولة"}</span><h1>${heading}</h1><p>${mode === "offers" ? "الأسعار المعروضة وردت في منشور رسمي بتاريخ 3 نوفمبر 2026. تأكد من توفرها وسريانها مع الفرع." : "اختار المنتجات اللي تناسب بيتك، وشوف تفاصيلها قبل الإضافة للسلة."}</p></div><span class="item-count">${base.length} منتجات</span></div>
    <div class="listing-layout"><aside class="filters" id="filters"><strong>تصفّح الأقسام</strong><a href="${link("shop/")}" ${!category ? 'class="active"' : ""}>كل المنتجات</a>${departments.map(item=>`<a href="${categoryUrl(item)}" ${category?.slug === item.slug ? 'class="active"' : ""}>${item.name}</a>`).join("")}<small>الكميات والأسعار الأخرى بيانات تجريبية للتصميم.</small></aside>
    <div class="listing-content"><div class="listing-toolbar"><label class="refine">${icon("search")}<input id="catalog-search" type="search" value="${esc(query)}" placeholder="ابحث في المنتجات" aria-label="ابحث داخل المنتجات"></label><select id="sort-products" aria-label="ترتيب المنتجات"><option value="default">الترتيب الافتراضي</option><option value="price-asc">السعر من الأقل</option><option value="price-desc">السعر من الأعلى</option><option value="name">الاسم</option></select><button id="filter-toggle" class="mobile-filter">${icon("filter")} الأقسام</button></div><div id="listing-grid">${grid(base)}</div><div id="no-results" class="empty-state" hidden><h2>ما لقينا نتيجة</h2><p>جرّب اسم منتج أو تصفّح الأقسام.</p><a class="primary-btn" href="${link("shop/")}">جميع المنتجات</a></div></div></div>
  </main>`;
}

function categoriesPage() {
  return `<main class="wrap page-main">${breadcrumbs(["الأقسام"])}<div class="page-heading"><span class="eyebrow">كل قسم إله حكاية</span><h1>شو ناقص البيت اليوم؟</h1><p>من طازة الصبح لتموينة الشهر.</p></div><div class="department-list">${departments.map(item=>`<a href="${categoryUrl(item)}" class="department-row"><div><span class="eyebrow">تسوق القسم</span><h2>${item.name}</h2><p>${item.short}</p><span class="see-all">تصفح المنتجات ${icon("arrow")}</span></div><img src="${asset(item.image)}" alt=""></a>`).join("")}</div></main>`;
}

function productPage(id) {
  const item = product(id);
  if (!item) return notFound();
  const category = departments.find(department=>department.match===item.category);
  const related = inventory.filter(other=>other.category===item.category && other.id!==item.id).slice(0,4);
  const favorite = readFavorites().includes(item.id);
  return `<main class="wrap page-main">${breadcrumbs([category?.name || "المنتجات",item.name])}
    <section class="product-page"><div class="product-gallery"><div class="product-main-image"><img src="${asset(productImage(item))}" alt="${esc(productImageAlt(item))}"></div><div class="gallery-thumbs"><button class="is-active" aria-label="الصورة الرئيسية"><img src="${asset(productImage(item))}" alt=""></button></div></div>
    <div class="product-info"><span class="eyebrow">${esc(item.category)}</span><h1>${esc(item.name)}</h1><p class="product-size">${esc(item.unit)} · المنتج والصورة للمعاينة</p><div class="product-rating">${icon("check")} <span>${available(item)>0 ? "متوفر في مخزون المعاينة" : "غير متوفر في المعاينة"}</span></div><div class="detail-price"><strong>${price(item.price)}</strong><small>${isVerified(item) ? "السعر منشور في 3 نوفمبر 2026. تحقق من توفره وسريانه لدى الفرع." : "سعر تطوير تجريبي وغير معتمد للبيع."}</small></div>
    <div class="purchase-box"><div class="quantity-control"><button data-detail-minus aria-label="تقليل الكمية">${icon("minus")}</button><output id="detail-qty">1</output><button data-detail-plus aria-label="زيادة الكمية">${icon("plus")}</button></div><button class="primary-btn" data-add-detail="${item.id}" ${available(item)<1 ? "disabled" : ""}>${icon("cart")} أضف للسلة</button><button class="detail-fav ${favorite ? "is-active" : ""}" data-favorite="${item.id}" aria-label="المفضلة">${icon("heart")}</button></div>
    <p class="purchase-note">للبضاعة الموزونة، السعر النهائي يتحدد حسب الوزن الفعلي بعد موافقتك في خدمة تشغيلية مرتبطة بالفرع.</p>
    <div class="product-meta"><div><span>القسم</span><strong>${esc(item.category)}</strong></div><div><span>العبوة</span><strong>${esc(item.unit)}</strong></div><div><span>رمز المنتج</span><strong dir="ltr">${esc(item.sku)}</strong></div></div>
    ${isVerified(item) ? `<a class="source-link" href="${esc(item.priceSource)}" target="_blank" rel="noopener">شاهد الإعلان الذي نُشر فيه السعر ${icon("arrow")}</a>` : ""}
    </div></section><section class="detail-description"><h2>عن المنتج</h2><p>${esc(item.name)} من قسم ${esc(item.category)}. تحقق من تفاصيل العلامة والتشغيلة والوزن المتاح مع الفرع قبل طلب فعلي.</p></section>
    ${related.length ? `<section class="section">${sectionHead("قد يعجبك أيضاً","من نفس القسم", category ? categoryUrl(category) : link("shop/"))}${grid(related)}</section>` : ""}
  </main>`;
}

function cartPage() {
  const lines = readCart().map(line=>({item:product(line.id),qty:line.qty})).filter(line=>line.item);
  const total = lines.reduce((sum,line)=>sum+line.qty*line.item.price,0);
  return `<main class="wrap page-main">${breadcrumbs(["سلة المشتريات"])}<div class="page-heading"><span class="eyebrow">طلبك على راحتك</span><h1>سلة المشتريات</h1><p>${lines.length} أصناف في السلة</p></div>${!lines.length ? `<div class="empty-state"><span class="empty-icon">${icon("cart")}</span><h2>لسا ما أضفت شي للسلة</h2><p>ابدأ بالأقسام أو اختار من أساسيات البيت.</p><a class="primary-btn" href="${link("shop/")}">تسوق المنتجات</a></div>` : `<div class="cart-layout"><div class="cart-list">${lines.map(({item,qty})=>`<article class="cart-row"><a href="${productUrl(item)}"><img src="${asset(productImage(item))}" alt="${esc(productImageAlt(item))}"></a><div class="cart-row-info"><a href="${productUrl(item)}" class="product-name">${esc(item.name)}</a><small>${esc(item.unit)}</small><button data-remove="${item.id}" class="remove-item">إزالة</button></div><div class="cart-row-actions"><strong>${price(item.price*qty)}</strong><div class="quantity-control"><button data-decrease="${item.id}" aria-label="تقليل ${esc(item.name)}">${icon("minus")}</button><span>${qty}</span><button data-increase="${item.id}" aria-label="زيادة ${esc(item.name)}">${icon("plus")}</button></div></div></article>`).join("")}</div><aside class="order-summary"><h2>ملخص السلة</h2><div><span>المنتجات</span><strong>${price(total)}</strong></div><div><span>التوصيل</span><strong>يحدده الفرع</strong></div><div class="summary-total"><span>مجموع المنتجات</span><strong>${price(total)}</strong></div><small>السعر والكمية في هذه المعاينة تجريبيان. يتم تأكيد الوزن والسعر ورسوم التوصيل قبل أي طلب فعلي.</small><a class="primary-btn" href="${link("checkout/")}">المتابعة إلى الدفع ${icon("arrow")}</a></aside></div>`}</main>`;
}

function checkoutPage() {
  if (!readCart().length) return `<main class="wrap page-main">${breadcrumbs(["الدفع"])}<div class="empty-state"><h1>السلة فارغة</h1><p>أضف منتجات قبل مراجعة الطلب.</p><a class="primary-btn" href="${link("shop/")}">تسوق المنتجات</a></div></main>`;
  const lines = readCart().map(line=>({item:product(line.id),qty:line.qty})).filter(line=>line.item);
  const total = lines.reduce((sum,line)=>sum+line.qty*line.item.price,0);
  return `<main class="wrap page-main">${breadcrumbs(["السلة","مراجعة الطلب"])}<div class="page-heading"><span class="eyebrow">خطوة أخيرة في المعاينة</span><h1>مراجعة الطلب</h1><p>تقدر تشوف شكل الرحلة قبل ربط استقبال الطلبات مع الفرع.</p></div><div class="checkout-layout">
    <form id="checkout-form" class="checkout-form"><section class="form-section"><div class="form-heading"><b>01</b><div><h2>طريقة الاستلام</h2><p>اختر الخيار المناسب لك.</p></div></div><div class="choice-row"><label><input type="radio" name="fulfilment" value="delivery" checked><span>${icon("truck")} توصيل</span></label><label><input type="radio" name="fulfilment" value="pickup"><span>${icon("pin")} استلام من الفرع</span></label></div></section><section class="form-section"><div class="form-heading"><b>02</b><div><h2>بيانات التواصل</h2><p>تستخدم في معاينة النموذج فقط.</p></div></div><div class="form-grid"><label>الاسم الكامل<input type="text" name="name" required autocomplete="name" placeholder="اكتب اسمك"></label><label>رقم الهاتف<input type="tel" name="phone" required pattern="0[0-9]{9}" inputmode="tel" placeholder="07XXXXXXXX"></label><label class="full">المنطقة أو الفرع<select name="area" required><option value="">اختر المنطقة أو الفرع</option><option>شارع مكة</option><option>أم السماق</option><option>شارع المدينة المنورة</option><option>الفحيص</option></select></label><label class="full" id="address-field">العنوان بالتفصيل<input type="text" name="address" placeholder="الشارع ورقم البناية"></label><label class="full">ملاحظة للطلب<textarea name="note" rows="3" placeholder="تعليمات اختيار المنتجات أو التسليم"></textarea></label></div></section><section class="form-section"><div class="form-heading"><b>03</b><div><h2>الدفع</h2><p>بوابة الدفع غير متصلة حالياً.</p></div></div><div class="offline-payment">خيارات الدفع وتأكيد الطلب تتطلب ربط نظام المبيعات وخدمة الفرع.</div></section><button class="primary-btn" type="submit">اعرض معاينة الطلب ${icon("arrow")}</button><p class="form-message" id="checkout-message" role="status"></p></form>
    <aside class="order-summary checkout-summary"><h2>طلبك</h2>${lines.map(({item,qty})=>`<div class="summary-line"><span>${esc(item.name)} <small>× ${qty}</small></span><strong>${price(item.price*qty)}</strong></div>`).join("")}<div class="summary-total"><span>مجموع المنتجات</span><strong>${price(total)}</strong></div><small>تكلفة التوصيل والسعر النهائي يحددهما الفرع بعد تأكيد التوفر والوزن.</small></aside></div></main>`;
}

function simplePage(type) {
  const headings = {
    account: ["حسابك في خيرات الجنة","مكان واحد لسلتك والمفضلة وطلباتك"],
    orders: ["طلباتك","عند تفعيل الحساب وربط الطلبات، تظهر طلباتك هنا"],
    favorites: ["منتجاتك المفضلة","اختياراتك التي حفظتها على هذا الجهاز"],
    branches: ["فروع خيرات الجنة","اختار الفرع اللي يناسب مشوارك"],
    help: ["نحن هنا للمساعدة","إجابات واضحة وطرق تواصل مباشرة"],
    admin: ["بوابة العمليات","عرض إدارة المخزون التجريبي"]
  };
  const [title,subtitle] = headings[type];
  let body = "";
  if (type === "favorites") {
    const items = readFavorites().map(product).filter(Boolean);
    body = items.length ? grid(items) : `<div class="empty-state"><span class="empty-icon">${icon("heart")}</span><h2>المفضلة فاضية حالياً</h2><p>اضغط القلب على المنتج اللي تحبه وارجع له بسهولة.</p><a class="primary-btn" href="${link("shop/")}">تصفح المنتجات</a></div>`;
  }
  if (type === "account") body = `<div class="account-grid"><a href="${link("favorites/")}">${icon("heart")}<strong>المفضلة</strong><span>منتجاتك المحفوظة على هذا الجهاز</span>${icon("arrow")}</a><a href="${link("cart/")}">${icon("cart")}<strong>السلة</strong><span>راجع اختياراتك قبل المتابعة</span>${icon("arrow")}</a><a href="${link("account/orders/")}">${icon("truck")}<strong>طلباتي</strong><span>تحتاج حساباً وربطاً بنظام الطلبات</span>${icon("arrow")}</a></div><div class="info-panel">تسجيل الدخول وسجل الطلبات يحتاجان خدمة حسابات من خيرات الجنة. يمكنك استخدام السلة والمفضلة محلياً في المعاينة.</div>`;
  if (type === "orders") body = `<div class="empty-state"><span class="empty-icon">${icon("truck")}</span><h2>ما في طلبات مرتبطة بحسابك</h2><p>سجل الطلبات يتاح بعد تشغيل الحسابات واستقبال الطلبات الفعلية.</p><a class="primary-btn" href="${link("shop/")}">تصفح المنتجات</a></div>`;
  if (type === "branches") body = `<div class="branch-grid">${[["شارع مكة","بجانب مكة مول"],["أم السماق","عمّان"],["شارع المدينة المنورة","عمّان"],["الفحيص","نزول البكالوريا"]].map(([name,place])=>`<article><span class="branch-icon">${icon("pin")}</span><h2>${name}</h2><p>${place}</p><a href="tel:+962770354848">تأكد من التغطية والتوفر ${icon("arrow")}</a></article>`).join("")}</div><p class="subtle-note">تتوفر معلومات الفروع من منشورات خيرات الجنة. حدود التوصيل وأوقات الخدمة تحتاج تأكيداً مباشراً من الفرع.</p>`;
  if (type === "help") body = `<div class="help-grid"><article><h2>كيف أتأكد من السعر؟</h2><p>بعض الأسعار في المعاينة للتصميم فقط. الأسعار التي تحمل رابط منشور تحتاج تأكيد سريانها من الفرع.</p></article><article><h2>هل أقدر أعمل طلب الآن؟</h2><p>يمكنك معاينة السلة ونموذج الطلب. استقبال الطلبات الفعلية يحتاج ربطاً بنظام الفروع.</p></article><article><h2>المنتجات الموزونة</h2><p>الوزن النهائي والسعر المرتبط به يحددهما الفرع قبل إتمام طلب فعلي.</p></article><article><h2>التواصل المباشر</h2><p><a href="tel:+962770354848">اتصل على 07 7035 4848</a> أو <a href="https://wa.me/962770354848" target="_blank" rel="noopener">راسلنا عبر واتساب</a>.</p></article></div>`;
  if (type === "admin") body = `<div class="info-panel"><h2>لوحة تشغيل للعرض الداخلي</h2><p>صفحة الإدارة الحالية تعرض بيانات محلية تجريبية. يلزم تسجيل دخول وصلاحيات وخادم قبل استخدامها للعمليات الفعلية.</p><a class="outline-btn" href="${link("admin.html")}">فتح العرض الداخلي ${icon("arrow")}</a></div>`;
  return `<main class="wrap page-main">${breadcrumbs([title])}<div class="page-heading"><span class="eyebrow">خيرات الجنة</span><h1>${title}</h1><p>${subtitle}</p></div>${body}</main>`;
}

function notFound() { return `<main class="wrap page-main"><div class="empty-state"><h1>الصفحة غير موجودة</h1><a class="primary-btn" href="${link("")}">العودة للرئيسية</a></div></main>`; }
function currentPage() {
  if (route === "home") return homePage();
  if (["shop","search","offers"].includes(route) || route.startsWith("category:")) return listingPage(route);
  if (route === "categories") return categoriesPage();
  if (route.startsWith("product:")) return productPage(route.split(":")[1]);
  if (route === "cart") return cartPage();
  if (route === "checkout") return checkoutPage();
  return simplePage(route);
}
let revealObserver;
let initialRevealComplete = false;
function render() {
  document.querySelector("#app").innerHTML = header() + currentPage() + footer() + '<div class="toast" role="status" aria-live="polite"></div>';
  bindPage();
  if (!initialRevealComplete) {
    setupReveal();
    initialRevealComplete = true;
  }
}
function toast(message) {
  const element = document.querySelector(".toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(()=>element.classList.remove("visible"),2400);
}
function saveCart(cart) { localStorage.setItem("khairat-store-cart-v1", JSON.stringify(cart)); }
function addItem(id, amount = 1) {
  const item = product(id);
  if (!item) return;
  const cart = readCart();
  const line = cart.find(entry=>entry.id===item.id);
  const next = (line?.qty || 0) + amount;
  if (next > available(item)) return toast("وصلت للكمية المتوفرة في المعاينة");
  if (line) line.qty = next;
  else cart.push({id:item.id,qty:next});
  saveCart(cart);
  render();
  toast("أضفنا المنتج للسلة");
}
function updateLine(id, delta) {
  let cart = readCart();
  const line = cart.find(entry=>entry.id===id);
  if (!line) return;
  const next = line.qty + delta;
  if (next > available(product(id))) return toast("الكمية المطلوبة غير متوفرة في المعاينة");
  if (next <= 0) cart = cart.filter(entry=>entry.id!==id);
  else line.qty = next;
  saveCart(cart);
  render();
}
function bindPage() {
  document.querySelectorAll("[data-add]").forEach(button=>button.addEventListener("click",()=>addItem(Number(button.dataset.add))));
  document.querySelectorAll("[data-favorite]").forEach(button=>button.addEventListener("click",()=>{
    const id = Number(button.dataset.favorite);
    const favorites = readFavorites();
    const next = favorites.includes(id) ? favorites.filter(value=>value!==id) : [...favorites,id];
    localStorage.setItem("khairat-store-favorites-v1",JSON.stringify(next));
    render();
    toast(next.includes(id) ? "حفظناه في المفضلة" : "أزلناه من المفضلة");
  }));
  document.querySelectorAll("[data-increase]").forEach(button=>button.addEventListener("click",()=>updateLine(Number(button.dataset.increase),1)));
  document.querySelectorAll("[data-decrease]").forEach(button=>button.addEventListener("click",()=>updateLine(Number(button.dataset.decrease),-1)));
  document.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{
    saveCart(readCart().filter(line=>line.id!==Number(button.dataset.remove)));
    render();
  }));
  document.querySelector("[data-detail-plus]")?.addEventListener("click",()=>{
    const output=document.querySelector("#detail-qty");
    const item=product(route.split(":")[1]);
    if (Number(output.value)<available(item)) output.value=Number(output.value)+1;
  });
  document.querySelector("[data-detail-minus]")?.addEventListener("click",()=>{
    const output=document.querySelector("#detail-qty");
    if (Number(output.value)>1) output.value=Number(output.value)-1;
  });
  document.querySelector("[data-add-detail]")?.addEventListener("click",button=>addItem(Number(button.currentTarget.dataset.addDetail),Number(document.querySelector("#detail-qty").value)));
  document.querySelector("#filter-toggle")?.addEventListener("click",()=>document.querySelector("#filters").classList.toggle("open"));
  const searchInput=document.querySelector("#catalog-search");
  const sort=document.querySelector("#sort-products");
  const applyFilters=()=>{
    const needle=(searchInput?.value||"").trim().toLowerCase();
    const group=route.startsWith("category:")?inventory.filter(item=>item.category===getCategory(route.split(":")[1])?.match):route==="offers"?inventory.filter(isVerified):inventory;
    const filtered=group.filter(item=>`${item.name} ${item.category} ${item.sku}`.toLowerCase().includes(needle));
    if(sort?.value==="price-asc") filtered.sort((a,b)=>a.price-b.price);
    if(sort?.value==="price-desc") filtered.sort((a,b)=>b.price-a.price);
    if(sort?.value==="name") filtered.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
    document.querySelector("#listing-grid").innerHTML=grid(filtered);
    document.querySelector("#listing-grid").hidden=!filtered.length;
    document.querySelector("#no-results").hidden=!!filtered.length;
    document.querySelector(".item-count").textContent=filtered.length+" منتجات";
    document.querySelectorAll("#listing-grid [data-add],#listing-grid [data-favorite]").forEach(button=>{
      if(button.dataset.add) button.addEventListener("click",()=>addItem(Number(button.dataset.add)));
      else button.addEventListener("click",()=>{
        const id=Number(button.dataset.favorite);
        const list=readFavorites();
        localStorage.setItem("khairat-store-favorites-v1",JSON.stringify(list.includes(id)?list.filter(x=>x!==id):[...list,id]));
        applyFilters();
      });
    });
  };
  searchInput?.addEventListener("input",applyFilters);
  sort?.addEventListener("change",applyFilters);
  if(searchInput?.value) applyFilters();
  const form=document.querySelector("#checkout-form");
  form?.addEventListener("change",()=>{
    const address=form.elements.address;
    const delivery=form.elements.fulfilment.value==="delivery";
    document.querySelector("#address-field").hidden=!delivery;
    address.required=delivery;
  });
  form?.addEventListener("submit",event=>{
    event.preventDefault();
    const message=document.querySelector("#checkout-message");
    message.textContent="هذه معاينة للطلب فقط. للتأكيد الحقيقي تواصل مع الفرع عبر الهاتف أو واتساب.";
    message.classList.add("visible");
  });
}
render();
function setupReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  revealObserver?.disconnect();
  const elements = document.querySelectorAll(".hero-copy, .benefits, .section-head, .category-grid, .editorial-banner, .product-grid, .service-cta, .offers-hero, .page-heading, .listing-intro, .product-page, .form-section, .account-grid, .branch-grid, .help-grid");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 30px 0px" });
  revealObserver = observer;
  elements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
  document.body.classList.add("motion-ready");
}

function setupMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    const follower = document.createElement("div");
    follower.className = "cursor-follower";
    follower.setAttribute("aria-hidden", "true");
    document.body.append(follower);
    let point = null;
    let frame = 0;
    const move = () => {
      frame = 0;
      if (!point) return;
      follower.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      follower.classList.add("is-visible");
      const target = point.target instanceof Element ? point.target : document.body;
      follower.classList.toggle("is-action", !!target.closest("a, button, input, select, textarea, label"));
    };
    document.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse") return;
      point = { x: event.clientX, y: event.clientY, target: event.target };
      if (!frame) frame = requestAnimationFrame(move);
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      follower.classList.remove("is-visible");
    });
  }
  document.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.pointerType !== "mouse" || !(event.target instanceof Element) || !event.target.closest("a, button")) return;
    const pulse = document.createElement("span");
    pulse.className = "click-pulse";
    pulse.style.left = event.clientX + "px";
    pulse.style.top = event.clientY + "px";
    pulse.setAttribute("aria-hidden", "true");
    document.body.append(pulse);
    pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
  }, { passive: true });
}
setupMotion();
if (!document.querySelector('link[rel="manifest"]')) {
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = asset("manifest.webmanifest");
  document.head.append(manifest);
}
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register(asset("sw.js"), { scope: root || "./" }).catch(() => {}));
}
