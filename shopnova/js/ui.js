/**
 * ShopNova Thailand — UI helpers (format, images, toast, modal, drawers)
 */
const UI = (() => {
  // ---------- Formatting ----------
  const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
  const thb2 = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = new Intl.NumberFormat("th-TH");

  const money = (v) => thb.format(Number(v) || 0);
  const money2 = (v) => thb2.format(Number(v) || 0);
  const number = (v) => num.format(Number(v) || 0);

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  /** '2026-03-05' → '5 มี.ค. 2569' */
  function dateTh(iso) {
    if (!iso) return "—";
    const [y, m, d] = String(iso).split("-").map(Number);
    if (!y || !m || !d) return iso;
    return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
  }
  /** '2026-03' → 'มี.ค. 69' */
  function monthTh(ym, full = false) {
    const [y, m] = String(ym).split("-").map(Number);
    if (!y || !m) return ym;
    return full ? `${THAI_MONTHS_FULL[m - 1]} ${y + 543}` : `${THAI_MONTHS[m - 1]} ${String(y + 543).slice(-2)}`;
  }

  function stars(rating, { showValue = true } = {}) {
    if (rating === null || rating === undefined) {
      return `<span class="stars stars-none" title="สินค้าใหม่ ยังไม่มีคะแนน">☆☆☆☆☆ <small>ใหม่</small></span>`;
    }
    const r = Number(rating);
    const full = Math.floor(r);
    const half = r - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return `<span class="stars" title="${r.toFixed(1)} / 5">${"★".repeat(full)}${half ? "½" : ""}${"☆".repeat(empty)}${showValue ? ` <small>${r.toFixed(1)}</small>` : ""}</span>`;
  }

  const TIER_META = {
    Bronze:   { icon: "🥉", cls: "tier-bronze",   discount: 0 },
    Silver:   { icon: "🥈", cls: "tier-silver",   discount: 3 },
    Gold:     { icon: "🥇", cls: "tier-gold",     discount: 5 },
    Platinum: { icon: "💎", cls: "tier-platinum", discount: 8 }
  };
  function tierBadge(tier) {
    const m = TIER_META[tier] || TIER_META.Bronze;
    return `<span class="tier ${m.cls}">${m.icon} ${escapeHtml(tier || "Bronze")}</span>`;
  }

  const STATUS_META = {
    pending:   { label: "รอดำเนินการ", icon: "⏳", cls: "st-pending" },
    shipped:   { label: "กำลังจัดส่ง", icon: "🚚", cls: "st-shipped" },
    completed: { label: "สำเร็จ",      icon: "✅", cls: "st-completed" },
    cancelled: { label: "ยกเลิก",      icon: "✕",  cls: "st-cancelled" }
  };
  function statusBadge(status) {
    const m = STATUS_META[status] || { label: status, icon: "•", cls: "" };
    return `<span class="status ${m.cls}"><span aria-hidden="true">${m.icon}</span> ${escapeHtml(m.label)}</span>`;
  }

  const PAYMENT_ICONS = { "Credit Card": "💳", "PromptPay": "📱", "TrueMoney": "👛", "Cash on Delivery": "💵" };
  function paymentLabel(method) {
    if (!method) return `<span class="pay pay-none">⚠️ ยังไม่ชำระ</span>`;
    return `<span class="pay">${PAYMENT_ICONS[method] || "💰"} ${escapeHtml(method)}</span>`;
  }

  // ---------- รูปสินค้าออนไลน์ (Unsplash) — map ตาม product_id ของ seed ----------
  const PRODUCT_PHOTOS = {
    1: "photo-1585079542156-2755d9c8a094",  2: "photo-1527864550417-7fd91fc51a46",
    3: "photo-1527443224154-c4a3942d3acf",  4: "photo-1588508065123-287b28e013da",
    5: "photo-1616763355603-9755a640a287",  6: "photo-1505740420928-5e560c06d30e",
    7: "photo-1590602847861-f357a9332bbc",  8: "photo-1593062096033-9a26b09da705",
    9: "photo-1611532736579-6b16e2b50449", 10: "photo-1608043152269-423dbba4e7e1",
    12: "photo-1583863788434-e58a36330cf0", 13: "photo-1586953208448-b95a79798f07",
    14: "photo-1593642632823-8f785ba67e45", 15: "photo-1595225476474-87563907a212",
    16: "photo-1615663245857-ac93bb7c39e7", 17: "photo-1547082299-de196ea013d6",
    18: "photo-1531492746076-161ca9bcad58", 19: "photo-1606904825846-647eb07f5be2",
    20: "photo-1626379953822-baec19c3accd", 21: "photo-1524758631624-e2822e304c36",
    22: "photo-1580480055273-228ff5388ef8", 23: "photo-1519389950473-47ba0277781c",
    24: "photo-1590658268037-6bf12165a8df", 25: "photo-1545454675-3531b543be5d",
    26: "photo-1567690187548-f07b1d7bf5a9", 27: "photo-1598653222000-6b7b7a552625",
    28: "photo-1516280440614-37939bbacd81", 29: "photo-1546435770-a3e426bf472b",
    30: "photo-1599669454699-248893623440", 31: "photo-1541807084-5c52b6b3adef",
    32: "photo-1512941937669-90a1b58e7e9c", 33: "photo-1609091839311-d5365f9ff1c5",
    34: "photo-1496181133206-80ce9b88a853", 35: "photo-1561154464-82e9adf32764",
    36: "photo-1507473885765-e6ed057f782c", 37: "photo-1585792180666-f7347c490ee2",
    38: "photo-1606220588913-b3aacb4d2f46", 39: "photo-1527814050087-3793815479db",
    40: "photo-1598550476439-6847785fcea6"
  };
  const CATEGORY_PHOTOS = {
    1: "photo-1593640408182-31c70c8268f5",
    2: "photo-1625948515291-69613efd103f",
    3: "photo-1524758631624-e2822e304c36",
    4: "photo-1505740420928-5e560c06d30e"
  };
  const CATEGORY_KEYWORD = { 1: "computer", 2: "gadget", 3: "office", 4: "audio" };
  const CATEGORY_ICON = { 1: "💻", 2: "🔌", 3: "🪑", 4: "🎧" };

  function productImage(productId, categoryId, w = 480, h = 360) {
    const photo = PRODUCT_PHOTOS[productId];
    if (photo) return `https://images.unsplash.com/${photo}?w=${w}&h=${h}&q=70&auto=format&fit=crop`;
    // สินค้าที่แอดมินเพิ่มใหม่ — ใช้รูปตามคำค้นหมวดหมู่ (lock ให้รูปคงที่ต่อสินค้า)
    return `https://loremflickr.com/${w}/${h}/${CATEGORY_KEYWORD[categoryId] || "technology"}?lock=${productId}`;
  }
  function categoryImage(categoryId, w = 640, h = 360) {
    const photo = CATEGORY_PHOTOS[categoryId];
    if (photo) return `https://images.unsplash.com/${photo}?w=${w}&h=${h}&q=70&auto=format&fit=crop`;
    return `https://loremflickr.com/${w}/${h}/technology?lock=${100 + categoryId}`;
  }
  function categoryIcon(categoryId) {
    return CATEGORY_ICON[categoryId] || "📦";
  }
  function avatar(name, size = 64) {
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "?")}&size=${size}&backgroundType=gradientLinear&fontWeight=600`;
  }

  /** ถ้าโหลดรูปไม่สำเร็จ (ออฟไลน์) แสดง placeholder แบบ inline SVG แทน */
  function imgTag(src, alt, cls = "", icon = "📦") {
    const svg = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='#e2e8f0'/><text x='2' y='1.9' font-size='1.1' text-anchor='middle'>${icon}</text></svg>`
    )}`;
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="${cls}" loading="lazy" decoding="async" data-fallback="${svg}" />`;
  }
  // จับ error ของ <img> ทั้งหน้า (event capture เพราะ error ไม่ bubble)
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.dataset.fallback && img.src !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
    }
  }, true);

  // ---------- Toast ----------
  function toast(message, type = "info", ms = 3200) {
    const wrap = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${{ success: "✅", error: "❌", warn: "⚠️", info: "💡" }[type] || "💡"}</span><div>${message}</div>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  // ---------- Modal ----------
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  let modalOnClose = null;

  function openModal(title, html, { wide = false, onClose = null } = {}) {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = html;
    document.getElementById("modal").classList.toggle("modal-wide", wide);
    modalBackdrop.hidden = false;
    document.body.classList.add("no-scroll");
    modalOnClose = onClose;
    const first = modalBody.querySelector("input, select, textarea, button");
    if (first) setTimeout(() => first.focus(), 50);
  }
  function closeModal() {
    if (modalBackdrop.hidden) return;
    modalBackdrop.hidden = true;
    document.body.classList.remove("no-scroll");
    modalBody.innerHTML = "";
    if (modalOnClose) { const fn = modalOnClose; modalOnClose = null; fn(); }
  }
  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });

  // ---------- Drawers (ตะกร้า / SQL Inspector) ----------
  const backdrop = document.getElementById("drawerBackdrop");
  function openDrawer(id) {
    closeDrawers();
    const el = document.getElementById(id);
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
  }
  function closeDrawers() {
    document.querySelectorAll(".drawer.open").forEach((d) => {
      d.classList.remove("open");
      d.setAttribute("aria-hidden", "true");
    });
    backdrop.hidden = true;
    if (modalBackdrop.hidden) document.body.classList.remove("no-scroll");
  }
  backdrop.addEventListener("click", closeDrawers);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawers(); }
  });

  function debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function confirmDialog(title, message, { okLabel = "ยืนยัน", danger = false } = {}) {
    return new Promise((resolve) => {
      let done = false;
      openModal(title, `
        <p class="confirm-msg">${message}</p>
        <div class="form-actions">
          <button class="btn btn-ghost" id="confirmCancel">ยกเลิก</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="confirmOk">${escapeHtml(okLabel)}</button>
        </div>`, { onClose: () => { if (!done) { done = true; resolve(false); } } });
      document.getElementById("confirmCancel").onclick = () => { done = true; closeModal(); resolve(false); };
      document.getElementById("confirmOk").onclick = () => { done = true; closeModal(); resolve(true); };
    });
  }

  return {
    money, money2, number, escapeHtml, dateTh, monthTh, stars, tierBadge, TIER_META, statusBadge, STATUS_META,
    paymentLabel, productImage, categoryImage, categoryIcon, avatar, imgTag,
    toast, openModal, closeModal, openDrawer, closeDrawers, debounce, confirmDialog
  };
})();
