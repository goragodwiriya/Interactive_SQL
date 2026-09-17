/**
 * ShopNova Thailand — Router, Theme, SQL Inspector และการเริ่มต้นแอป
 */
const Router = (() => {
  const view = document.getElementById("view");
  let current = "";

  const routes = [
    { pattern: /^\/?$/, render: (m, p) => Shop.renderHome(view, p), nav: "home" },
    { pattern: /^\/shop$/, render: (m, p) => Shop.renderCatalog(view, p), nav: "shop" },
    { pattern: /^\/product\/(\d+)$/, render: (m) => Shop.renderProduct(view, Number(m[1])), nav: "shop" },
    { pattern: /^\/checkout$/, render: () => Shop.renderCheckout(view), nav: "" },
    { pattern: /^\/order\/(\d+)$/, render: (m) => Shop.renderOrder(view, Number(m[1])), nav: "" },
    { pattern: /^\/account$/, render: () => Shop.renderAccount(view), nav: "" },
    { pattern: /^\/admin$/, render: () => Admin.renderDashboard(view), nav: "admin" },
    { pattern: /^\/admin\/orders$/, render: (m, p) => Admin.renderOrders(view, p), nav: "admin" },
    { pattern: /^\/admin\/products$/, render: (m, p) => Admin.renderProducts(view, p), nav: "admin" },
    { pattern: /^\/admin\/customers$/, render: (m, p) => Admin.renderCustomers(view, p), nav: "admin" }
  ];

  function parse() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const [path, query = ""] = hash.split("?");
    return { path: path || "/", params: new URLSearchParams(query) };
  }

  function render() {
    const { path, params } = parse();
    const route = routes.find((r) => r.pattern.test(path));
    UI.closeDrawers();
    UI.closeModal();
    try {
      if (!route) {
        view.innerHTML = `<div class="empty-state"><div class="empty-icon">🧭</div><p>ไม่พบหน้า <code>${UI.escapeHtml(path)}</code></p><a class="btn btn-primary" href="#/">กลับหน้าแรก</a></div>`;
      } else {
        route.render(path.match(route.pattern), params);
      }
      document.querySelectorAll(".topnav a").forEach((a) => a.classList.toggle("active", !!route && a.dataset.nav === route.nav));
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="empty-state"><div class="empty-icon">💥</div><p>เกิดข้อผิดพลาด: <code>${UI.escapeHtml(err.message)}</code></p><button class="btn btn-primary" id="resetFromError">รีเซ็ตฐานข้อมูล</button></div>`;
      document.getElementById("resetFromError")?.addEventListener("click", resetDatabase);
    }
    const key = location.hash;
    if (key !== current) { window.scrollTo({ top: 0 }); current = key; }
  }

  function refresh() { render(); }

  window.addEventListener("hashchange", render);
  return { render, refresh };
})();

// ==========================================================
// Theme
// ==========================================================
function initTheme() {
  const saved = localStorage.getItem("shopNovaTheme");
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("shopNovaTheme", theme);
  document.getElementById("themeToggleBtn").textContent = theme === "dark" ? "☀️" : "🌙";
}

// ==========================================================
// SQL Inspector
// ==========================================================
let SqlInspector = null;
function initSqlInspector() {
  const body = document.getElementById("sqlLogBody");
  const count = document.getElementById("sqlCount");
  const esc = UI.escapeHtml;
  let rendered = 0;

  // ตัด indent ร่วมของทุกบรรทัดออก (SQL ใน queries.js เขียนย่อหน้าตามโค้ด)
  const dedent = (sql) => {
    const lines = sql.replace(/^\n+|\s+$/g, "").split("\n");
    const indents = lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return [lines[0].trim(), ...lines.slice(1).map((l) => l.slice(min))].join("\n");
  };
  const fmtParam = (p) => p === null ? "NULL" : typeof p === "string" ? `'${p}'` : String(p);
  const kindMeta = { query: ["SELECT", "k-query"], run: ["WRITE", "k-run"], tx: ["TX", "k-tx"], "tx-fail": ["ROLLBACK", "k-fail"] };

  function renderLog(log) {
    count.textContent = log.length;
    if (!document.getElementById("sqlDrawer").classList.contains("open")) { rendered = -1; return; }
    if (!log.length) { body.innerHTML = `<p class="empty">ยังไม่มีคำสั่ง — ลองกดดูสินค้า ค้นหา หรือสั่งซื้อ แล้วกลับมาดูที่นี่</p>`; rendered = 0; return; }
    body.innerHTML = log.map((e, i) => {
      const [label, cls] = kindMeta[e.kind] || ["SQL", ""];
      return `<article class="sql-entry ${cls}">
        <header>
          <span class="sql-kind">${label}</span>
          ${e.lesson ? `<span class="sql-lesson">${esc(e.lesson)}</span>` : ""}
          <span class="sql-meta">${e.kind === "query" ? `${e.rows} แถว` : e.kind === "run" ? `${e.rows} แถวถูกเปลี่ยน` : ""} ${e.ms ? `· ${e.ms.toFixed(1)} ms` : ""}</span>
        </header>
        <pre><code>${esc(dedent(e.sql))}</code></pre>
        ${e.params && e.params.length ? `<div class="sql-params">params: [${e.params.map((p) => `<code>${esc(fmtParam(p))}</code>`).join(", ")}]</div>` : ""}
        ${e.kind === "query" ? `<button class="btn btn-xs btn-ghost" data-explain="${i}">EXPLAIN QUERY PLAN</button><div class="sql-explain" hidden></div>` : ""}
      </article>`;
    }).join("");
    rendered = log.length;
  }

  body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-explain]");
    if (!btn) return;
    const entry = DB.getLog()[Number(btn.dataset.explain)];
    const box = btn.nextElementSibling;
    if (!box.hidden) { box.hidden = true; return; }
    try {
      const plan = DB.explain(entry.sql, entry.params);
      box.innerHTML = `<ul>${plan.map((r) => `<li class="${/USING INDEX|USING COVERING INDEX|SEARCH/.test(r.detail) ? "plan-index" : /SCAN/.test(r.detail) ? "plan-scan" : ""}">${esc(r.detail)}</li>`).join("")}</ul><small>SEARCH ... USING INDEX = ใช้ดัชนี · SCAN = อ่านทั้งตาราง (บท 24)</small>`;
    } catch (err) {
      box.innerHTML = `<small class="hint-warn">${esc(err.message)}</small>`;
    }
    box.hidden = false;
  });

  DB.onLog(renderLog);
  const open = () => { UI.openDrawer("sqlDrawer"); renderLog(DB.getLog()); };
  document.getElementById("sqlToggleBtn").addEventListener("click", () => {
    if (document.getElementById("sqlDrawer").classList.contains("open")) UI.closeDrawers();
    else open();
  });
  document.getElementById("sqlClearBtn").addEventListener("click", () => DB.clearLog());
  SqlInspector = { open };
}

// ==========================================================
// Reset
// ==========================================================
async function resetDatabase() {
  const ok = await UI.confirmDialog("รีเซ็ตฐานข้อมูล?", "ล้างออเดอร์ รีวิว และสินค้าที่เพิ่ม แล้วคืนฐานข้อมูลเป็นชุดเดียวกับบทเรียน (ตะกร้าและการล็อกอินจะถูกล้างด้วย)", { okLabel: "รีเซ็ต", danger: true });
  if (!ok) return;
  DB.reset();
  localStorage.removeItem("shopNovaCart");
  localStorage.removeItem("shopNovaSession");
  Shop.state.cart = [];
  Shop.state.customerId = null;
  Shop.refreshCustomer();
  Shop.renderCart();
  UI.toast("รีเซ็ตฐานข้อมูลเรียบร้อย", "success");
  location.hash = "#/";
  Router.refresh();
}

// ==========================================================
// Global action delegation (data-action)
// ==========================================================
function initActions() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (el.tagName === "SELECT") return; // select ใช้ change event
    switch (action) {
      case "close-drawers": UI.closeDrawers(); return;
      case "open-sql": SqlInspector.open(); return;
      case "open-cart": UI.openDrawer("cartDrawer"); return;
    }
    if (Shop.handleAction(action, el)) { e.preventDefault(); return; }
    if (Admin.handleAction(action, el)) { e.preventDefault(); }
  });
  document.getElementById("cartBtn").addEventListener("click", () => { Shop.renderCart(); UI.openDrawer("cartDrawer"); });
  document.getElementById("accountBtn").addEventListener("click", () => { location.hash = "#/account"; });
  document.getElementById("resetDbBtn").addEventListener("click", resetDatabase);
}

// ==========================================================
// Boot
// ==========================================================
async function initApp() {
  initTheme();
  initActions();
  initSqlInspector();
  const statusEl = document.getElementById("dbStatus");
  const statusText = document.getElementById("dbStatusText");
  try {
    await DB.init();
    statusEl.classList.add("ready");
    statusText.textContent = "SQLite พร้อมใช้งาน · บันทึกอัตโนมัติในเบราว์เซอร์";
    setTimeout(() => statusEl.classList.add("hide"), 2500);
    Shop.refreshCustomer();
    Shop.renderCart();
    Shop.initSearch();
    document.getElementById("cartCount").textContent = Shop.cartCount();
    Router.render();
  } catch (err) {
    console.error(err);
    statusText.textContent = "โหลดฐานข้อมูลไม่สำเร็จ";
    document.getElementById("view").innerHTML = `<div class="empty-state"><div class="empty-icon">💥</div><p>ไม่สามารถเริ่ม SQLite ได้: <code>${UI.escapeHtml(err.message)}</code></p><p class="muted">ต้องเปิดผ่าน HTTP server (เช่น <code>python3 -m http.server</code>) เพื่อโหลดไฟล์ WASM</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", initApp);
