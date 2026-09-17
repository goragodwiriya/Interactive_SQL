/**
 * ShopNova Thailand — หน้าร้าน (Storefront)
 * หน้าแรก / แคตตาล็อก / หน้าสินค้า / ตะกร้า / ชำระเงิน / บัญชีลูกค้า
 */
const Shop = (() => {
  const {escapeHtml: esc, money, money2, number, dateTh, stars, tierBadge, statusBadge, paymentLabel,
    productImage, categoryImage, categoryIcon, avatar, imgTag, toast, openModal, closeModal} = UI;

  const CART_KEY = "shopNovaCart";
  const SESSION_KEY = "shopNovaSession";
  const PAGE_SIZE = 12;

  const state = {
    cart: loadJson(CART_KEY, []),          // [{ id, qty }]
    customerId: loadJson(SESSION_KEY, null),
    customer: null
  };

  function loadJson(key, fallback) {
    try {const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback;} catch {return fallback;}
  }
  function saveJson(key, v) {
    try {localStorage.setItem(key, JSON.stringify(v));} catch { /* ignore */}
  }

  const q = (def, params = []) => DB.query(def.sql, params, {lesson: def.lesson});
  const one = (def, params = []) => DB.one(def.sql, params, {lesson: def.lesson});
  const run = (def, params = []) => DB.run(def.sql, params, {lesson: def.lesson});

  // ==========================================================
  // Session (ลูกค้าที่ล็อกอิน)
  // ==========================================================
  function refreshCustomer() {
    state.customer = state.customerId ? one(Q.customerById, [state.customerId]) : null;
    if (state.customerId && !state.customer) {state.customerId = null; saveJson(SESSION_KEY, null);}
    renderAccountButton();
    return state.customer;
  }
  function renderAccountButton() {
    const el = document.getElementById("accountAvatar");
    if (state.customer) {
      el.innerHTML = imgTag(avatar(state.customer.name, 48), state.customer.name, "avatar-img", "👤");
      el.title = state.customer.name;
    } else {
      el.textContent = "👤";
    }
  }
  function loginAs(customerId) {
    state.customerId = customerId;
    saveJson(SESSION_KEY, customerId);
    refreshCustomer();
    toast(`ยินดีต้อนรับ <strong>${esc(state.customer.name)}</strong> ${tierBadge(state.customer.member_tier)}`, "success");
  }
  function logout() {
    state.customerId = null;
    saveJson(SESSION_KEY, null);
    refreshCustomer();
    toast("ออกจากระบบแล้ว", "info");
    location.hash = "#/";
  }

  function openLoginModal(afterLogin = null) {
    const customers = q(Q.customerList);
    openModal("👤 เข้าสู่ระบบ / สมัครสมาชิก", `
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="login" role="tab">เลือกลูกค้าที่มีอยู่</button>
        <button class="tab" data-tab="register" role="tab">สมัครสมาชิกใหม่</button>
      </div>
      <form id="loginForm" class="form tab-panel" data-panel="login">
        <p class="help">ร้านจำลองไม่มีรหัสผ่าน — เลือกลูกค้าจากตาราง <code>customers</code> ได้เลย (มี ${customers.length} คน)</p>
        <label>ลูกค้า
          <select name="customer_id" required>
            ${customers.map((c) => `<option value="${c.customer_id}" ${c.customer_id === 1 ? "selected" : ""}>${esc(c.name)} · ${esc(c.city)} · ${esc(c.member_tier)}</option>`).join("")}
          </select>
        </label>
        <label>หรือพิมพ์อีเมล
          <input name="email" type="email" placeholder="เช่น suda@example.com (ค้นด้วย WHERE email = ?)" />
        </label>
        <div class="form-actions"><button class="btn btn-primary" type="submit">เข้าสู่ระบบ</button></div>
      </form>
      <form id="registerForm" class="form tab-panel" data-panel="register" hidden>
        <p class="help">ใช้ <code>INSERT ... ON CONFLICT(email) DO UPDATE</code> — ถ้าอีเมลซ้ำจะอัปเดตชื่อ/เมืองแทนการ error</p>
        <label>ชื่อ-นามสกุล <input name="name" required minlength="2" placeholder="เช่น ปรียา ใจงาม" /></label>
        <label>อีเมล <input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>จังหวัด
          <input name="city" list="cityList" required placeholder="เช่น กรุงเทพฯ" />
          <datalist id="cityList">${q(Q.cities).map((c) => `<option value="${esc(c.city)}">`).join("")}</datalist>
        </label>
        <div class="form-actions"><button class="btn btn-primary" type="submit">สมัครและเข้าสู่ระบบ</button></div>
      </form>`);

    const body = document.getElementById("modalBody");
    body.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
      body.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
      body.querySelectorAll(".tab-panel").forEach((p) => {p.hidden = p.dataset.panel !== t.dataset.tab;});
    }));
    body.querySelector("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = String(fd.get("email") || "").trim();
      let customer = email ? one(Q.customerByEmail, [email]) : one(Q.customerById, [Number(fd.get("customer_id"))]);
      if (!customer) {toast(`ไม่พบลูกค้าอีเมล <strong>${esc(email)}</strong>`, "error"); return;}
      closeModal();
      loginAs(customer.customer_id);
      if (afterLogin) afterLogin();
      else Router.refresh();
    });
    body.querySelector("#registerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get("name")).trim();
      const email = String(fd.get("email")).trim().toLowerCase();
      const city = String(fd.get("city")).trim();
      try {
        run(Q.registerUpsert, [name, email, city]);
        const customer = one(Q.customerByEmail, [email]);
        closeModal();
        loginAs(customer.customer_id);
        if (afterLogin) afterLogin(); else Router.refresh();
      } catch (err) {
        toast(`สมัครไม่สำเร็จ: ${esc(err.message)}`, "error");
      }
    });
  }

  // ==========================================================
  // Cart
  // ==========================================================
  function cartCount() {return state.cart.reduce((a, c) => a + c.qty, 0);}
  function saveCart() {saveJson(CART_KEY, state.cart); document.getElementById("cartCount").textContent = cartCount();}

  function cartDetails() {
    if (!state.cart.length) return [];
    const ids = state.cart.map((c) => c.id);
    const def = Q.cartProducts(ids);
    const rows = DB.query(def.sql, def.params, {lesson: def.lesson});
    const byId = new Map(rows.map((r) => [r.product_id, r]));
    // สินค้าที่ถูกลบไปแล้ว (แอดมินลบ) จะหลุดจากตะกร้าอัตโนมัติ
    state.cart = state.cart.filter((c) => byId.has(c.id));
    return state.cart.map((c) => ({...byId.get(c.id), qty: c.qty, line_total: byId.get(c.id).price * c.qty}));
  }

  function addToCart(productId, qty = 1) {
    const p = DB.one("SELECT product_id, name, stock FROM products WHERE product_id = ?", [productId], {lesson: "บท 2 · WHERE (ตรวจสต็อกก่อนใส่ตะกร้า)"});
    if (!p) return;
    const item = state.cart.find((c) => c.id === productId);
    const current = item ? item.qty : 0;
    if (p.stock <= 0) {toast(`<strong>${esc(p.name)}</strong> สินค้าหมดชั่วคราว`, "warn"); return;}
    if (current + qty > p.stock) {toast(`ใส่ได้สูงสุด ${p.stock} ชิ้น (สต็อกคงเหลือ)`, "warn"); return;}
    if (item) item.qty += qty; else state.cart.push({id: productId, qty});
    saveCart();
    toast(`เพิ่ม <strong>${esc(p.name)}</strong> ลงตะกร้าแล้ว`, "success", 1800);
    renderCart();
    document.getElementById("cartBtn").classList.add("bump");
    setTimeout(() => document.getElementById("cartBtn").classList.remove("bump"), 400);
  }
  function setCartQty(productId, qty) {
    const item = state.cart.find((c) => c.id === productId);
    if (!item) return;
    if (qty <= 0) state.cart = state.cart.filter((c) => c.id !== productId);
    else {
      const p = DB.one("SELECT stock FROM products WHERE product_id = ?", [productId], {lesson: "บท 2 · WHERE"});
      if (p && qty > p.stock) {toast(`สต็อกคงเหลือ ${p.stock} ชิ้น`, "warn"); qty = p.stock;}
      item.qty = qty;
    }
    saveCart();
    renderCart();
    if (location.hash.startsWith("#/checkout")) Router.refresh();
  }
  function clearCart() {state.cart = []; saveCart(); renderCart();}

  function renderCart() {
    const body = document.getElementById("cartBody");
    const foot = document.getElementById("cartFoot");
    const items = cartDetails();
    saveCart();
    if (!items.length) {
      body.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>ตะกร้ายังว่าง</p><a href="#/shop" class="btn btn-primary" data-action="close-drawers">เลือกซื้อสินค้า</a></div>`;
      foot.innerHTML = "";
      return;
    }
    const subtotal = items.reduce((a, i) => a + i.line_total, 0);
    body.innerHTML = items.map((i) => `
      <div class="cart-item">
        <a href="#/product/${i.product_id}" data-action="close-drawers">${imgTag(productImage(i.product_id, i.category_id, 160, 120), i.name, "cart-thumb", categoryIcon(i.category_id))}</a>
        <div class="cart-info">
          <a href="#/product/${i.product_id}" class="cart-name" data-action="close-drawers">${esc(i.name)}</a>
          <div class="cart-meta">${money(i.price)} × ${i.qty} ${i.qty >= i.stock ? `<span class="hint-warn">สูงสุดตามสต็อก</span>` : ""}</div>
          <div class="qty">
            <button data-action="cart-dec" data-id="${i.product_id}" aria-label="ลดจำนวน">−</button>
            <span>${i.qty}</span>
            <button data-action="cart-inc" data-id="${i.product_id}" aria-label="เพิ่มจำนวน" ${i.qty >= i.stock ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="cart-right">
          <strong>${money(i.line_total)}</strong>
          <button class="link-btn danger" data-action="cart-remove" data-id="${i.product_id}">ลบ</button>
        </div>
      </div>`).join("");
    const disc = state.customer ? UI.TIER_META[state.customer.member_tier]?.discount || 0 : 0;
    foot.innerHTML = `
      <div class="cart-total"><span>ยอดรวม ${items.length} รายการ (${cartCount()} ชิ้น)</span><strong>${money(subtotal)}</strong></div>
      ${disc ? `<div class="cart-disc">ส่วนลดสมาชิก ${esc(state.customer.member_tier)} ${disc}% จะคำนวณตอนชำระเงิน</div>` : `<div class="cart-disc">สมาชิก Silver ขึ้นไปได้ส่วนลดสูงสุด 8% — <button class="link-btn" data-action="open-login">เข้าสู่ระบบ</button></div>`}
      <a href="#/checkout" class="btn btn-primary btn-block" data-action="close-drawers">ไปชำระเงิน →</a>`;
  }

  // ==========================================================
  // Product card (ใช้ร่วมกันทุกหน้า)
  // ==========================================================
  function productCard(p, {rank = null} = {}) {
    const out = p.stock <= 0;
    const badges = [];
    if (rank) badges.push(`<span class="badge-chip badge-rank">#${rank} ขายดี</span>`);
    if (p.rating === null) badges.push(`<span class="badge-chip badge-new">ใหม่</span>`);
    if (p.cheapest_in_cat) badges.push(`<span class="badge-chip badge-deal">ถูกสุดในหมวด</span>`);
    if (out) badges.push(`<span class="badge-chip badge-out">สินค้าหมด</span>`);
    else if (p.stock <= 5) badges.push(`<span class="badge-chip badge-low">เหลือ ${p.stock} ชิ้น</span>`);
    return `
      <article class="product-card ${out ? "is-out" : ""}">
        <a class="product-media" href="#/product/${p.product_id}">
          ${imgTag(productImage(p.product_id, p.category_id), p.name, "product-img", categoryIcon(p.category_id))}
          <div class="badges">${badges.join("")}</div>
        </a>
        <div class="product-body">
          <a class="product-cat" href="#/shop?category=${p.category_id}">${categoryIcon(p.category_id)} ${esc(p.category_name)}</a>
          <h3><a href="#/product/${p.product_id}">${esc(p.name)}</a></h3>
          <div class="product-rating">${stars(p.rating)} ${p.review_count ? `<small>(${p.review_count} รีวิว)</small>` : ""} ${p.sold_qty ? `<small>· ขายแล้ว ${number(p.sold_qty)}</small>` : ""}</div>
          <div class="product-foot">
            <span class="price">${money(p.price)}</span>
            <button class="btn btn-sm ${out ? "btn-ghost" : "btn-primary"}" data-action="add-to-cart" data-id="${p.product_id}" ${out ? "disabled" : ""}>${out ? "หมด" : "+ ตะกร้า"}</button>
          </div>
        </div>
      </article>`;
  }
  const productGrid = (rows, opts = {}) => `<div class="product-grid">${rows.map((p, i) => productCard(p, {rank: opts.ranked ? i + 1 : null})).join("")}</div>`;

  // ==========================================================
  // หน้าแรก
  // ==========================================================
  function renderHome(view) {
    const stats = one(Q.storeStats);
    const cats = q(Q.categories);
    const best = q(Q.bestSellers, [8]);
    const fresh = q(Q.newArrivals, [4]);
    const top = q(Q.topRated, [4]);
    view.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">ShopNova Thailand · Gadget & Workspace Store</p>
          <h1>อุปกรณ์ทำงานที่ใช่<br/>ส่งตรงจาก <span class="grad">SQLite</span> ถึงโต๊ะคุณ</h1>
          <p class="lede">ร้านค้าออนไลน์จำลองที่ทำงานจริงบนเบราว์เซอร์ — ทุกการค้นหา ทุกตะกร้า ทุกออเดอร์ คือ SQL จริงจาก <a href="../index.html">SQL Journey</a> 54 บท</p>
          <div class="hero-actions">
            <a href="#/shop" class="btn btn-primary btn-lg">เลือกซื้อสินค้า</a>
            <button class="btn btn-ghost btn-lg" data-action="open-sql">🧾 ดู SQL เบื้องหลัง</button>
          </div>
          <div class="hero-stats">
            <div><strong>${number(stats.products)}</strong><span>สินค้า</span></div>
            <div><strong>${number(stats.customers)}</strong><span>สมาชิก</span></div>
            <div><strong>${number(stats.completed_orders)}</strong><span>ออเดอร์สำเร็จ</span></div>
            <div><strong>${stats.avg_rating ?? "–"} ★</strong><span>จาก ${number(stats.reviews)} รีวิว</span></div>
          </div>
        </div>
        <div class="hero-media">
          ${imgTag(categoryImage(1, 900, 640), "โต๊ะทำงานพร้อมอุปกรณ์", "hero-img", "💻")}
          <div class="hero-card">
            <span>🚚 ส่งฟรีทั่วไทย</span>
            <span>💎 สมาชิก Platinum ลด 8%</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>หมวดหมู่สินค้า</h2><p class="sql-hint">LEFT JOIN + GROUP BY — นับสินค้าต่อหมวด</p></div>
        <div class="category-grid">
          ${cats.map((c) => `
            <a class="category-card" href="#/shop?category=${c.category_id}">
              ${imgTag(categoryImage(c.category_id), c.name, "category-img", categoryIcon(c.category_id))}
              <div class="category-body">
                <h3>${categoryIcon(c.category_id)} ${esc(c.name)}</h3>
                <p>${esc(c.description || "")}</p>
                <span class="category-meta">${c.product_count} รายการ · เริ่ม ${money(c.min_price)}</span>
              </div>
            </a>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>🔥 ขายดีที่สุด</h2><p class="sql-hint">บท 40 · JOIN 4 ตาราง + GROUP BY + ORDER BY + LIMIT</p><a href="#/shop?sort=popular" class="link-more">ดูทั้งหมด →</a></div>
        ${productGrid(best, {ranked: true})}
      </section>

      <div class="two-col">
        <section class="section">
          <div class="section-head"><h2>✨ สินค้าใหม่</h2><p class="sql-hint">บท 6 · WHERE rating IS NULL</p><a href="#/shop?new=1" class="link-more">ดูทั้งหมด →</a></div>
          ${productGrid(fresh)}
        </section>
        <section class="section">
          <div class="section-head"><h2>⭐ คะแนนสูงสุด</h2><p class="sql-hint">บท 5 · ORDER BY rating DESC LIMIT 4</p><a href="#/shop?sort=rating" class="link-more">ดูทั้งหมด →</a></div>
          ${productGrid(top)}
        </section>
      </div>

      <section class="callout">
        <div>
          <h2>🧾 ทุกปุ่มบนหน้านี้คือ SQL</h2>
          <p>เปิด SQL Inspector เพื่อดูคำสั่งจริงพร้อมพารามิเตอร์ที่ถูก bind, เวลาที่ใช้ และบทเรียนที่สอนคำสั่งนั้น — แล้วลองสั่งซื้อเพื่อดู <code>BEGIN → INSERT → UPDATE → COMMIT</code> ทำงานจริง</p>
        </div>
        <button class="btn btn-primary" data-action="open-sql">เปิด SQL Inspector</button>
      </section>`;
  }

  // ==========================================================
  // แคตตาล็อก
  // ==========================================================
  function renderCatalog(view, params) {
    const f = {
      category: params.get("category") || "",
      q: (params.get("q") || "").trim(),
      sort: params.get("sort") || "popular",
      inStock: params.get("stock") === "1",
      newOnly: params.get("new") === "1",
      minPrice: params.get("min") ? Number(params.get("min")) : null,
      maxPrice: params.get("max") ? Number(params.get("max")) : null,
      minRating: params.get("rating") ? Number(params.get("rating")) : null,
      page: Math.max(1, Number(params.get("page") || 1))
    };
    f.limit = PAGE_SIZE;
    f.offset = (f.page - 1) * PAGE_SIZE;
    const cats = q(Q.categories);
    const def = Q.catalog(f);
    const total = DB.one(def.countSql, def.countParams, {lesson: "บท 10 · COUNT(*) สำหรับแบ่งหน้า"}).total;
    const rows = DB.query(def.sql, def.params, {lesson: def.lesson});
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const activeCat = cats.find((c) => String(c.category_id) === String(f.category));

    const link = (patch) => {
      const p = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === false) ? p.delete(k) : p.set(k, v));
      if (!("page" in patch)) p.delete("page");
      const s = p.toString();
      return `#/shop${s ? "?" + s : ""}`;
    };

    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">แคตตาล็อก</p>
          <h1>${activeCat ? `${categoryIcon(activeCat.category_id)} ${esc(activeCat.name)}` : f.newOnly ? "✨ สินค้าใหม่" : f.q ? `ผลการค้นหา “${esc(f.q)}”` : "สินค้าทั้งหมด"}</h1>
          <p class="muted">พบ ${number(total)} รายการ${f.q ? ` · <code>WHERE name LIKE '%${esc(f.q)}%'</code> (bind เป็น parameter)` : ""}</p>
        </div>
        <label class="sort">เรียงตาม
          <select id="sortSelect">
            ${[["popular", "ขายดี"], ["rating", "คะแนนสูงสุด"], ["price_asc", "ราคาต่ำ → สูง"], ["price_desc", "ราคาสูง → ต่ำ"], ["newest", "ใหม่ล่าสุด"], ["name", "ชื่อ A → Z"]]
        .map(([v, l]) => `<option value="${v}" ${f.sort === v ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="catalog">
        <aside class="filters">
          <div class="filter-group">
            <h4>หมวดหมู่</h4>
            <a class="filter-link ${!f.category ? "active" : ""}" href="${link({category: ""})}">ทั้งหมด</a>
            ${cats.map((c) => `<a class="filter-link ${String(c.category_id) === String(f.category) ? "active" : ""}" href="${link({category: c.category_id})}">${categoryIcon(c.category_id)} ${esc(c.name)} <span>${c.product_count}</span></a>`).join("")}
          </div>
          <form class="filter-group" id="priceForm">
            <h4>ช่วงราคา (บาท)</h4>
            <div class="price-inputs">
              <input type="number" name="min" min="0" placeholder="ต่ำสุด" value="${f.minPrice ?? ""}" />
              <span>–</span>
              <input type="number" name="max" min="0" placeholder="สูงสุด" value="${f.maxPrice ?? ""}" />
            </div>
            <button class="btn btn-ghost btn-sm btn-block" type="submit">ใช้ช่วงราคา</button>
          </form>
          <div class="filter-group">
            <h4>คะแนน</h4>
            ${[4.5, 4, 3].map((r) => `<a class="filter-link ${f.minRating === r ? "active" : ""}" href="${link({rating: f.minRating === r ? "" : r})}">${"★".repeat(Math.floor(r))}${r % 1 ? "½" : ""} ${r} ขึ้นไป</a>`).join("")}
          </div>
          <div class="filter-group">
            <h4>อื่น ๆ</h4>
            <a class="filter-link ${f.inStock ? "active" : ""}" href="${link({stock: f.inStock ? "" : "1"})}">✅ เฉพาะที่มีสินค้า</a>
            <a class="filter-link ${f.newOnly ? "active" : ""}" href="${link({new: f.newOnly ? "" : "1"})}">✨ สินค้าใหม่ (rating IS NULL)</a>
          </div>
          ${(f.category || f.q || f.inStock || f.newOnly || f.minPrice != null || f.maxPrice != null || f.minRating) ? `<a class="btn btn-ghost btn-sm btn-block" href="#/shop">ล้างตัวกรองทั้งหมด</a>` : ""}
        </aside>
        <div class="catalog-main">
          ${rows.length ? productGrid(rows) : `<div class="empty-state"><div class="empty-icon">🔍</div><p>ไม่พบสินค้าตามเงื่อนไข</p><a class="btn btn-primary" href="#/shop">ดูสินค้าทั้งหมด</a></div>`}
          ${pages > 1 ? `<nav class="pagination" aria-label="แบ่งหน้า">
            <a class="btn btn-ghost btn-sm ${f.page <= 1 ? "disabled" : ""}" href="${link({page: f.page - 1})}">← ก่อนหน้า</a>
            <span>หน้า ${f.page} / ${pages} · <code>LIMIT ${PAGE_SIZE} OFFSET ${f.offset}</code></span>
            <a class="btn btn-ghost btn-sm ${f.page >= pages ? "disabled" : ""}" href="${link({page: f.page + 1})}">ถัดไป →</a>
          </nav>` : ""}
        </div>
      </div>`;

    view.querySelector("#sortSelect").addEventListener("change", (e) => {location.hash = link({sort: e.target.value});});
    view.querySelector("#priceForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      location.hash = link({min: fd.get("min") || "", max: fd.get("max") || ""});
    });
  }

  // ==========================================================
  // หน้าสินค้า
  // ==========================================================
  function renderProduct(view, id) {
    const p = one(Q.productDetail, [id]);
    if (!p) {view.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>ไม่พบสินค้า #${id}</p><a class="btn btn-primary" href="#/shop">กลับไปหน้าสินค้า</a></div>`; return;}
    const rank = one(Q.productRankInCategory, [id]);
    const breakdown = one(Q.ratingBreakdown, [id]);
    const reviews = q(Q.productReviews, [id]);
    const related = q(Q.relatedProducts, [id, id]);
    const together = q(Q.boughtTogether, [id]);
    const purchased = state.customer ? one(Q.hasPurchased, [state.customer.customer_id, id]).purchased : 0;
    const inCart = state.cart.find((c) => c.id === id)?.qty || 0;
    const out = p.stock <= 0;

    const starRow = (n) => {
      const cnt = breakdown[`star${n}`] || 0;
      const pct = breakdown.total ? Math.round((100 * cnt) / breakdown.total) : 0;
      return `<div class="star-row"><span>${n} ★</span><div class="meter"><i style="width:${pct}%"></i></div><span>${cnt}</span></div>`;
    };

    view.innerHTML = `
      <nav class="crumbs"><a href="#/">หน้าแรก</a> › <a href="#/shop">สินค้า</a> › <a href="#/shop?category=${p.category_id}">${esc(p.category_name)}</a> › <span>${esc(p.name)}</span></nav>
      <section class="product-hero">
        <div class="product-gallery">
          ${imgTag(productImage(p.product_id, p.category_id, 900, 675), p.name, "product-hero-img", categoryIcon(p.category_id))}
          ${p.rating === null ? `<span class="badge-chip badge-new badge-float">สินค้าใหม่</span>` : ""}
        </div>
        <div class="product-info">
          <a class="product-cat" href="#/shop?category=${p.category_id}">${categoryIcon(p.category_id)} ${esc(p.category_name)}</a>
          <h1>${esc(p.name)}</h1>
          <div class="product-rating-lg">${stars(p.rating)} <span class="muted">· ${breakdown.total} รีวิว · ขายแล้ว ${number(p.sold_qty || 0)} ชิ้น${rank ? ` · อันดับ #${rank.sales_rank} จาก ${rank.products_in_cat} ในหมวด` : ""}</span></div>
          <div class="price-lg">${money(p.price)}</div>
          <p class="muted">${esc(p.category_desc || "")}</p>
          <div class="stock-line ${out ? "stock-out" : p.stock <= 5 ? "stock-low" : "stock-ok"}">
            ${out ? "✕ สินค้าหมดชั่วคราว" : p.stock <= 5 ? `⚠️ เหลือเพียง ${p.stock} ชิ้น` : `✅ พร้อมส่ง (คงเหลือ ${p.stock} ชิ้น)`}
          </div>
          <div class="buy-row">
            <div class="qty qty-lg">
              <button type="button" id="qtyDec" aria-label="ลด" ${out ? "disabled" : ""}>−</button>
              <input type="number" id="qtyInput" value="1" min="1" max="${Math.max(1, p.stock - inCart)}" ${out ? "disabled" : ""} />
              <button type="button" id="qtyInc" aria-label="เพิ่ม" ${out ? "disabled" : ""}>+</button>
            </div>
            <button class="btn btn-primary btn-lg" id="addBtn" ${out ? "disabled" : ""}>🛒 ${out ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}</button>
            ${inCart ? `<span class="muted">อยู่ในตะกร้าแล้ว ${inCart} ชิ้น</span>` : ""}
          </div>
          <ul class="perks">
            <li>🚚 จัดส่งฟรีทั่วประเทศ</li>
            <li>🔄 เปลี่ยน/คืนได้ใน 7 วัน</li>
            <li>💎 สมาชิก Silver+ รับส่วนลดสูงสุด 8%</li>
          </ul>
        </div>
      </section>

      <section class="section review-section">
        <div class="section-head"><h2>รีวิวจากลูกค้า</h2><p class="sql-hint">บท 28 · SUM(CASE WHEN rating = n) + บท 25 · EXISTS ตรวจผู้ซื้อจริง</p></div>
        <div class="review-layout">
          <div class="review-summary">
            <div class="big-rating">${breakdown.avg_rating ?? "–"}<small>/5</small></div>
            ${stars(breakdown.avg_rating, {showValue: false})}
            <p class="muted">${breakdown.total} รีวิว${breakdown.no_comment ? ` · ${breakdown.no_comment} รายการให้แค่คะแนน (comment IS NULL)` : ""}</p>
            ${[5, 4, 3, 2, 1].map(starRow).join("")}
            ${state.customer
        ? `<button class="btn btn-primary btn-block" data-action="write-review" data-id="${p.product_id}">✍️ เขียนรีวิว ${purchased ? "(ซื้อแล้ว ✓)" : ""}</button>`
        : `<button class="btn btn-ghost btn-block" data-action="open-login">เข้าสู่ระบบเพื่อรีวิว</button>`}
          </div>
          <div class="review-list">
            ${reviews.length ? reviews.map((r) => `
              <article class="review">
                ${imgTag(avatar(r.customer_name, 48), r.customer_name, "review-avatar", "👤")}
                <div>
                  <div class="review-head"><strong>${esc(r.customer_name)}</strong> ${tierBadge(r.member_tier)} ${r.verified ? `<span class="verified">✓ ซื้อสินค้านี้จริง</span>` : ""}<span class="muted">· ${esc(r.city)} · ${dateTh(r.review_date)}</span></div>
                  <div>${stars(r.rating, {showValue: false})}</div>
                  <p>${r.comment ? esc(r.comment) : `<em class="muted">ให้คะแนนโดยไม่แสดงความคิดเห็น</em>`}</p>
                </div>
              </article>`).join("") : `<p class="empty">ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวสินค้านี้!</p>`}
          </div>
        </div>
      </section>

      ${together.length ? `<section class="section">
        <div class="section-head"><h2>🧩 ลูกค้ามักซื้อคู่กับ</h2><p class="sql-hint">บท 26 · SELF JOIN order_items กับตัวเอง</p></div>
        ${productGrid(together)}
      </section>` : ""}
      ${related.length ? `<section class="section">
        <div class="section-head"><h2>สินค้าในหมวดเดียวกัน</h2><p class="sql-hint">บท 17 · Subquery หา category_id</p></div>
        ${productGrid(related)}
      </section>` : ""}`;

    const qtyInput = view.querySelector("#qtyInput");
    const clamp = () => {qtyInput.value = Math.min(Math.max(1, Number(qtyInput.value) || 1), Number(qtyInput.max) || 1);};
    view.querySelector("#qtyDec").addEventListener("click", () => {qtyInput.value = Number(qtyInput.value) - 1; clamp();});
    view.querySelector("#qtyInc").addEventListener("click", () => {qtyInput.value = Number(qtyInput.value) + 1; clamp();});
    qtyInput.addEventListener("change", clamp);
    view.querySelector("#addBtn").addEventListener("click", () => {clamp(); addToCart(p.product_id, Number(qtyInput.value)); Router.refresh();});
  }

  function openReviewModal(productId) {
    if (!state.customer) {openLoginModal(() => openReviewModal(productId)); return;}
    const p = DB.one("SELECT product_id, name FROM products WHERE product_id = ?", [productId], {lesson: "บท 2 · WHERE"});
    openModal(`✍️ รีวิว ${esc(p.name)}`, `
      <form id="reviewForm" class="form">
        <p class="help">คอลัมน์ <code>rating</code> มี <code>CHECK(rating BETWEEN 1 AND 5)</code> — ลองส่งค่านอกช่วงผ่าน DevTools แล้วดู error ได้เลย</p>
        <fieldset class="rating-pick" id="ratingPick">
          <legend>คะแนน</legend>
          ${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}" ${n === 5 ? "checked" : ""} /><span>★</span></label>`).join("")}
        </fieldset>
        <label>ความคิดเห็น (เว้นว่างได้ → บันทึกเป็น NULL ด้วย NULLIF(TRIM(?), ''))
          <textarea name="comment" rows="3" placeholder="เล่าประสบการณ์การใช้งาน..."></textarea>
        </label>
        <div class="form-actions"><button class="btn btn-primary" type="submit">ส่งรีวิว</button></div>
      </form>`);
    document.getElementById("reviewForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        DB.transaction(() => {
          run(Q.reviewInsert, [productId, state.customer.customer_id, Number(fd.get("rating")), String(fd.get("comment") || "")]);
          run(Q.productRatingRefresh, [productId, productId]);
        }, {lesson: "บท 22 · Transaction (รีวิว + อัปเดต rating เฉลี่ย)"});
        closeModal();
        toast("ขอบคุณสำหรับรีวิว! คะแนนเฉลี่ยของสินค้าถูกคำนวณใหม่แล้ว", "success");
        Router.refresh();
      } catch (err) {
        toast(`บันทึกรีวิวไม่สำเร็จ: ${esc(err.message)}`, "error");
      }
    });
  }

  // ==========================================================
  // Checkout (Transaction จริง)
  // ==========================================================
  function renderCheckout(view) {
    const items = cartDetails();
    saveCart();
    if (!items.length) {
      view.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>ตะกร้ายังว่าง</p><a class="btn btn-primary" href="#/shop">เลือกซื้อสินค้า</a></div>`;
      return;
    }
    const customer = state.customer;
    const disc = customer ? one(Q.tierDiscount, [customer.customer_id]) : {member_tier: "-", discount_pct: 0};
    const subtotal = items.reduce((a, i) => a + i.line_total, 0);
    const discount = Math.round(subtotal * disc.discount_pct) / 100;
    const total = subtotal - discount;
    const shortage = items.filter((i) => i.qty > i.stock);

    view.innerHTML = `
      <div class="page-head"><div><p class="eyebrow">ขั้นตอนสุดท้าย</p><h1>ชำระเงิน</h1><p class="muted">ออเดอร์จะถูกบันทึกใน Transaction เดียว: <code>BEGIN → INSERT orders → UPDATE stock → INSERT order_items → COMMIT</code></p></div></div>
      <div class="checkout">
        <section class="card">
          <h2>รายการสินค้า (${items.length})</h2>
          ${items.map((i) => `
            <div class="co-item ${i.qty > i.stock ? "co-short" : ""}">
              ${imgTag(productImage(i.product_id, i.category_id, 160, 120), i.name, "cart-thumb", categoryIcon(i.category_id))}
              <div class="cart-info">
                <a href="#/product/${i.product_id}" class="cart-name">${esc(i.name)}</a>
                <div class="cart-meta">${money(i.price)} × ${i.qty} ${i.qty > i.stock ? `<span class="hint-warn">สต็อกเหลือ ${i.stock} — จะทำให้ ROLLBACK</span>` : ""}</div>
                <div class="qty"><button data-action="cart-dec" data-id="${i.product_id}">−</button><span>${i.qty}</span><button data-action="cart-inc" data-id="${i.product_id}">+</button></div>
              </div>
              <strong>${money(i.line_total)}</strong>
            </div>`).join("")}
        </section>
        <section class="card co-side">
          <h2>ผู้สั่งซื้อ</h2>
          ${customer ? `
            <div class="co-customer">
              ${imgTag(avatar(customer.name, 56), customer.name, "review-avatar", "👤")}
              <div><strong>${esc(customer.name)}</strong> ${tierBadge(customer.member_tier)}<br/><span class="muted">${esc(customer.email)} · ${esc(customer.city)}</span></div>
            </div>
            <button class="link-btn" data-action="open-login">เปลี่ยนบัญชี</button>`
        : `<p class="muted">ต้องเข้าสู่ระบบก่อนสั่งซื้อ (ออเดอร์ต้องมี <code>customer_id</code> ตาม FOREIGN KEY)</p><button class="btn btn-primary btn-block" data-action="open-login">เข้าสู่ระบบ / สมัครสมาชิก</button>`}
          <h2>วิธีชำระเงิน</h2>
          <form id="checkoutForm" class="form">
            <div class="pay-options">
              ${[["PromptPay", "📱 PromptPay"], ["Credit Card", "💳 บัตรเครดิต"], ["TrueMoney", "👛 TrueMoney Wallet"], ["Cash on Delivery", "💵 เก็บเงินปลายทาง"], ["", "⏳ ชำระภายหลัง (payment_method = NULL)"]]
        .map(([v, l], i) => `<label class="pay-opt"><input type="radio" name="payment" value="${esc(v)}" ${i === 0 ? "checked" : ""} /><span>${l}</span></label>`).join("")}
            </div>
            <label class="check-line demo-line"><input type="checkbox" name="simulateFail" /> 🧪 จำลองความล้มเหลวกลางทาง (เพื่อดู ROLLBACK ทำงาน — ออเดอร์จะไม่ถูกบันทึกเลย)</label>
            <div class="totals">
              <div><span>ยอดสินค้า</span><span>${money2(subtotal)}</span></div>
              <div><span>ส่วนลดสมาชิก ${customer ? `${esc(disc.member_tier)} ${disc.discount_pct}%` : "—"}</span><span>− ${money2(discount)}</span></div>
              <div><span>ค่าจัดส่ง</span><span>ฟรี</span></div>
              <div class="grand"><span>ยอดชำระ</span><span>${money2(total)}</span></div>
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="submit" ${!customer || shortage.length ? "disabled" : ""}>✅ ยืนยันคำสั่งซื้อ</button>
            ${shortage.length ? `<p class="hint-warn">ปรับจำนวนสินค้าที่เกินสต็อกก่อน</p>` : ""}
          </form>
        </section>
      </div>`;

    view.querySelector("#checkoutForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!state.customer) {openLoginModal(); return;}
      const fd = new FormData(e.target);
      placeOrder({payment: fd.get("payment") || null, simulateFail: fd.get("simulateFail") === "on", discountPct: disc.discount_pct});
    });
  }

  function placeOrder({payment, simulateFail, discountPct}) {
    const items = cartDetails();
    const cid = state.customer.customer_id;
    let orderId = null;
    try {
      DB.transaction(() => {
        run(Q.checkoutOrderInsert, [cid, payment]);
        orderId = DB.lastInsertId();
        items.forEach((i, idx) => {
          const cur = one(Q.checkoutStock, [i.product_id]);
          if (!cur) throw new Error(`ไม่พบสินค้า #${i.product_id}`);
          if (simulateFail && idx === items.length - 1) throw new Error(`🧪 จำลองข้อผิดพลาด: ระบบชำระเงินล่มระหว่างบันทึก "${cur.name}"`);
          const changed = run(Q.checkoutStockDeduct, [i.qty, i.product_id, i.qty]);
          if (changed !== 1) throw new Error(`สต็อกของ "${cur.name}" ไม่พอ (เหลือ ${cur.stock} ชิ้น ต้องการ ${i.qty})`);
          // ราคา ณ เวลาซื้อ = ราคาปัจจุบันหักส่วนลดสมาชิก
          const unit = Math.round(cur.price * (100 - discountPct)) / 100;
          run(Q.checkoutItemInsert, [orderId, i.product_id, i.qty, unit]);
        });
      }, {lesson: "บท 22 · Transaction สั่งซื้อ"});
      // นอก transaction: อัปเกรดระดับสมาชิกถ้ายอดสะสมถึงเกณฑ์
      const before = state.customer.member_tier;
      run(Q.tierRecalc, [cid, cid]);
      refreshCustomer();
      clearCart();
      toast(`สั่งซื้อสำเร็จ! ออเดอร์ <strong>#${orderId}</strong> ถูก COMMIT แล้ว`, "success", 4500);
      if (state.customer.member_tier !== before) {
        setTimeout(() => toast(`🎉 ยินดีด้วย! คุณได้เลื่อนระดับเป็น ${tierBadge(state.customer.member_tier)}`, "success", 5000), 600);
      }
      location.hash = `#/order/${orderId}`;
    } catch (err) {
      toast(`คำสั่งซื้อถูก <strong>ROLLBACK</strong> — ${esc(err.message)}<br/><small>ไม่มีแถวใดถูกบันทึก ทั้ง orders, order_items และสต็อก (ดูใน SQL Inspector)</small>`, "error", 7000);
      Router.refresh();
    }
  }

  // ==========================================================
  // หน้าออเดอร์ (ใบเสร็จ)
  // ==========================================================
  function renderOrder(view, orderId) {
    const o = one(Q.orderById, [orderId]);
    if (!o) {view.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>ไม่พบออเดอร์ #${orderId}</p></div>`; return;}
    const items = q(Q.orderItems, [orderId]);
    const mine = state.customer && state.customer.customer_id === o.customer_id;
    const steps = ["pending", "shipped", "completed"];
    const stepIdx = steps.indexOf(o.status);
    view.innerHTML = `
      <div class="page-head"><div><p class="eyebrow">ใบสั่งซื้อ</p><h1>ออเดอร์ #${o.order_id}</h1><p class="muted">${dateTh(o.order_date)} · ${statusBadge(o.status)} · ${paymentLabel(o.payment_method)}</p></div>
        <div class="page-actions">${mine ? `<a class="btn btn-ghost" href="#/account">← บัญชีของฉัน</a>` : ""}<a class="btn btn-ghost" href="#/shop">ซื้อต่อ</a></div></div>
      ${o.status !== "cancelled" ? `<ol class="timeline">${steps.map((s, i) => `<li class="${i <= stepIdx ? "done" : ""}"><span>${UI.STATUS_META[s].icon}</span>${UI.STATUS_META[s].label}</li>`).join("")}</ol>` : `<p class="hint-warn">ออเดอร์นี้ถูกยกเลิก — สินค้าถูกคืนเข้าสต็อกแล้ว</p>`}
      <div class="checkout">
        <section class="card">
          <h2>รายการสินค้า</h2>
          <div class="table-scroll"><table class="table">
            <thead><tr><th>สินค้า</th><th class="num">ราคา/หน่วย</th><th class="num">จำนวน</th><th class="num">รวม</th></tr></thead>
            <tbody>${items.map((i) => `<tr>
              <td><a href="#/product/${i.product_id}">${esc(i.name)}</a>${i.unit_price < i.current_price ? `<br/><small class="muted">ราคาปกติ ${money(i.current_price)} (ราคาที่ซื้อรวมส่วนลดสมาชิก)</small>` : ""}</td>
              <td class="num">${money2(i.unit_price)}</td><td class="num">${i.quantity}</td><td class="num"><strong>${money2(i.line_total)}</strong></td></tr>`).join("")}</tbody>
            <tfoot><tr><td colspan="3">ยอดรวม ${o.total_qty} ชิ้น</td><td class="num"><strong>${money2(o.total)}</strong></td></tr></tfoot>
          </table></div>
          ${mine && (o.status === "shipped" || o.status === "completed") ? `<p class="muted">ได้รับสินค้าแล้ว? <strong>เขียนรีวิว</strong>ได้จากหน้าสินค้าแต่ละชิ้น</p>` : ""}
        </section>
        <section class="card co-side">
          <h2>ผู้สั่งซื้อ</h2>
          <div class="co-customer">${imgTag(avatar(o.customer_name, 56), o.customer_name, "review-avatar", "👤")}<div><strong>${esc(o.customer_name)}</strong> ${tierBadge(o.member_tier)}<br/><span class="muted">${esc(o.email)} · ${esc(o.city)}</span></div></div>
          ${mine && o.status === "pending" ? `
            <h2>จัดการออเดอร์</h2>
            ${!o.payment_method ? `<button class="btn btn-primary btn-block" data-action="pay-order" data-id="${o.order_id}">💳 ชำระเงินตอนนี้</button>` : ""}
            <button class="btn btn-danger-ghost btn-block" data-action="cancel-order" data-id="${o.order_id}">ยกเลิกออเดอร์ (คืนสต็อก)</button>` : ""}
        </section>
      </div>`;
  }

  function openPayModal(orderId) {
    openModal(`💳 ชำระเงินออเดอร์ #${orderId}`, `
      <form id="payForm" class="form">
        <p class="help"><code>UPDATE orders SET payment_method = ? WHERE ... AND payment_method IS NULL</code> — อัปเดตเฉพาะออเดอร์ที่ยังไม่ชำระ</p>
        <div class="pay-options">
          ${[["PromptPay", "📱 PromptPay"], ["Credit Card", "💳 บัตรเครดิต"], ["TrueMoney", "👛 TrueMoney Wallet"], ["Cash on Delivery", "💵 เก็บเงินปลายทาง"]]
        .map(([v, l], i) => `<label class="pay-opt"><input type="radio" name="payment" value="${esc(v)}" ${i === 0 ? "checked" : ""} /><span>${l}</span></label>`).join("")}
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">ยืนยันการชำระ</button></div>
      </form>`);
    document.getElementById("payForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const method = new FormData(e.target).get("payment");
      const changed = run(Q.payOrder, [method, orderId, state.customer.customer_id]);
      closeModal();
      if (changed) toast(`ชำระเงินออเดอร์ #${orderId} ด้วย ${esc(method)} เรียบร้อย`, "success");
      else toast("ออเดอร์นี้ชำระแล้วหรือไม่อยู่ในสถานะรอดำเนินการ (UPDATE 0 แถว)", "warn");
      Router.refresh();
    });
  }

  async function cancelOrder(orderId) {
    const ok = await UI.confirmDialog("ยกเลิกออเดอร์?", `ยกเลิกออเดอร์ <strong>#${orderId}</strong> — ระบบจะคืนสต็อกสินค้าทุกรายการภายใน Transaction เดียวกัน`, {okLabel: "ยกเลิกออเดอร์", danger: true});
    if (!ok) return;
    try {
      DB.transaction(() => {
        const changed = run(Q.cancelOrder, [orderId]);
        if (changed !== 1) throw new Error("ออเดอร์ไม่อยู่ในสถานะ pending แล้ว");
        run(Q.restockOrder, [orderId, orderId]);
      }, {lesson: "บท 22 · Transaction ยกเลิก + คืนสต็อก"});
      toast(`ยกเลิกออเดอร์ #${orderId} และคืนสต็อกแล้ว`, "success");
    } catch (err) {
      toast(`ยกเลิกไม่สำเร็จ (ROLLBACK): ${esc(err.message)}`, "error");
    }
    Router.refresh();
  }

  // ==========================================================
  // บัญชีของฉัน
  // ==========================================================
  function renderAccount(view) {
    if (!state.customer) {
      view.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและระดับสมาชิก</p><button class="btn btn-primary" data-action="open-login">เข้าสู่ระบบ / สมัครสมาชิก</button></div>`;
      return;
    }
    const c = state.customer;
    const sum = one(Q.customerSummary, [c.customer_id]);
    const orders = q(Q.customerOrders, [c.customer_id]);
    const disc = UI.TIER_META[c.member_tier]?.discount || 0;
    const nextTier = {Bronze: ["Silver", 8000], Silver: ["Gold", 20000], Gold: ["Platinum", 40000]}[c.member_tier];
    const lifetime = DB.one(`SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.customer_id = ? AND o.status <> 'cancelled'`, [c.customer_id], {lesson: "บท 10 · SUM (ยอดสะสมไม่รวมยกเลิก)"}).total;

    view.innerHTML = `
      <div class="account">
        <aside class="card profile">
          ${imgTag(avatar(c.name, 96), c.name, "profile-avatar", "👤")}
          <h1>${esc(c.name)}</h1>
          ${tierBadge(c.member_tier)}
          <p class="muted">${esc(c.email)}<br/>${esc(c.city)} · สมาชิกตั้งแต่ ${dateTh(c.registered_date)}</p>
          <div class="profile-perk">ส่วนลดสมาชิก <strong>${disc}%</strong>${nextTier ? `<br/><small>อีก ${money(Math.max(0, nextTier[1] - lifetime))} ถึงระดับ ${nextTier[0]}</small>` : `<br/><small>ระดับสูงสุดแล้ว 💎</small>`}</div>
          ${nextTier ? `<div class="meter meter-lg"><i style="width:${Math.min(100, (100 * lifetime) / nextTier[1]).toFixed(1)}%"></i></div>` : ""}
          <button class="btn btn-ghost btn-block" data-action="open-login">สลับบัญชี</button>
          <button class="btn btn-ghost btn-block" data-action="logout">ออกจากระบบ</button>
        </aside>
        <div class="account-main">
          <div class="stat-tiles">
            <div class="tile"><span>ออเดอร์ทั้งหมด</span><strong>${number(sum.order_count)}</strong></div>
            <div class="tile"><span>ยอดซื้อสำเร็จ</span><strong>${money(sum.total_spent)}</strong></div>
            <div class="tile"><span>อันดับยอดซื้อ</span><strong>#${sum.spend_rank}<small> / ${sum.customer_total}</small></strong><em class="sql-hint">RANK() OVER (ORDER BY ...)</em></div>
            <div class="tile"><span>สั่งซื้อครั้งล่าสุด</span><strong>${sum.last_order_date ? `${sum.days_since_last} วันก่อน` : "—"}</strong><em class="sql-hint">julianday('now') − julianday(MAX(order_date))</em></div>
          </div>
          <section class="card">
            <div class="section-head"><h2>ประวัติการสั่งซื้อ</h2><p class="sql-hint">บท 24 · VIEW v_order_totals (รวมยอดต่อออเดอร์ให้แล้ว)</p></div>
            ${orders.length ? `<div class="table-scroll"><table class="table">
              <thead><tr><th>ออเดอร์</th><th>วันที่</th><th>สถานะ</th><th>ชำระเงิน</th><th class="num">รายการ</th><th class="num">ยอดรวม</th><th></th></tr></thead>
              <tbody>${orders.map((o) => `<tr>
                <td><a href="#/order/${o.order_id}"><strong>#${o.order_id}</strong></a></td>
                <td>${dateTh(o.order_date)}</td>
                <td>${statusBadge(o.status)}</td>
                <td>${paymentLabel(o.payment_method)}</td>
                <td class="num">${o.item_count}</td>
                <td class="num"><strong>${money(o.total)}</strong></td>
                <td><div class="row-actions">
                  ${o.status === "pending" && !o.payment_method ? `<button class="btn btn-xs btn-primary" data-action="pay-order" data-id="${o.order_id}">ชำระ</button>` : ""}
                  ${o.status === "pending" ? `<button class="btn btn-xs btn-danger-ghost" data-action="cancel-order" data-id="${o.order_id}">ยกเลิก</button>` : ""}
                  <a class="btn btn-xs btn-ghost" href="#/order/${o.order_id}">ดู</a>
                </div></td></tr>`).join("")}</tbody>
            </table></div>` : `<p class="empty">ยังไม่มีออเดอร์ — <a href="#/shop">เริ่มช้อปเลย</a> (คุณคือลูกค้าที่โจทย์ LEFT JOIN ตามหา!)</p>`}
          </section>
        </div>
      </div>`;
  }

  // ==========================================================
  // Search suggestions (header)
  // ==========================================================
  function initSearch() {
    const input = document.getElementById("searchInput");
    const box = document.getElementById("searchSuggest");
    const form = document.getElementById("searchForm");
    const suggest = UI.debounce(() => {
      const term = input.value.trim();
      if (term.length < 2) {box.hidden = true; return;}
      const rows = q(Q.searchSuggest, [`%${term}%`]);
      if (!rows.length) {box.innerHTML = `<div class="suggest-empty">ไม่พบ “${esc(term)}”</div>`; box.hidden = false; return;}
      box.innerHTML = rows.map((r) => `<a href="#/product/${r.product_id}"><span>${esc(r.name)}</span><small>${esc(r.category_name)} · ${money(r.price)}</small></a>`).join("")
        + `<a class="suggest-all" href="#/shop?q=${encodeURIComponent(term)}">ดูผลทั้งหมดสำหรับ “${esc(term)}” →</a>`;
      box.hidden = false;
    }, 150);
    input.addEventListener("input", suggest);
    input.addEventListener("focus", suggest);
    document.addEventListener("click", (e) => {if (!form.contains(e.target)) box.hidden = true;});
    box.addEventListener("click", () => {box.hidden = true;});
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      box.hidden = true;
      const term = input.value.trim();
      location.hash = term ? `#/shop?q=${encodeURIComponent(term)}` : "#/shop";
    });
  }

  // ==========================================================
  // Actions (event delegation)
  // ==========================================================
  function handleAction(action, el) {
    const id = Number(el.dataset.id);
    switch (action) {
      case "add-to-cart": addToCart(id); return true;
      case "cart-inc": setCartQty(id, (state.cart.find((c) => c.id === id)?.qty || 0) + 1); return true;
      case "cart-dec": setCartQty(id, (state.cart.find((c) => c.id === id)?.qty || 0) - 1); return true;
      case "cart-remove": setCartQty(id, 0); return true;
      case "open-login": openLoginModal(); return true;
      case "logout": logout(); return true;
      case "write-review": openReviewModal(id); return true;
      case "pay-order": openPayModal(id); return true;
      case "cancel-order": cancelOrder(id); return true;
      default: return false;
    }
  }

  return {state, refreshCustomer, renderCart, initSearch, handleAction, renderHome, renderCatalog, renderProduct, renderCheckout, renderOrder, renderAccount, openLoginModal, cartCount};
})();
