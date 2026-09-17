/**
 * ShopNova Thailand — แดชบอร์ดผู้ดูแล (Analytics + จัดการออเดอร์ / สินค้า / ลูกค้า)
 * ทุกกราฟและตารางคือ query จากหมวด Analytics / Problem Solving ของ SQL Journey
 */
const Admin = (() => {
  const {escapeHtml: esc, money, money2, number, dateTh, monthTh, stars, tierBadge, statusBadge, paymentLabel,
    productImage, categoryIcon, avatar, imgTag, toast, openModal, closeModal} = UI;

  const q = (def, params = []) => DB.query(def.sql, params, {lesson: def.lesson});
  const one = (def, params = []) => DB.one(def.sql, params, {lesson: def.lesson});
  const run = (def, params = []) => DB.run(def.sql, params, {lesson: def.lesson});

  const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
  const catColor = (categoryId) => SERIES[Math.min(Number(categoryId) - 1, 4)] || SERIES[4];

  function subnav(active) {
    const items = [["dashboard", "📊 แดชบอร์ด", "#/admin"], ["orders", "📦 ออเดอร์", "#/admin/orders"], ["products", "🏷️ สินค้า", "#/admin/products"], ["customers", "👥 ลูกค้า", "#/admin/customers"]];
    return `<nav class="subnav" aria-label="เมนูผู้ดูแล">${items.map(([k, l, h]) => `<a class="${active === k ? "active" : ""}" href="${h}">${l}</a>`).join("")}</nav>`;
  }

  // ==========================================================
  // Dashboard
  // ==========================================================
  function renderDashboard(view) {
    const k = one(Q.kpis);
    const st = one(Q.statusPivot);
    const monthly = q(Q.monthlySales);
    const byCat = q(Q.monthlyByCategory);
    const cats = q(Q.categories);
    const topProducts = q(Q.topProducts);
    const share = q(Q.categoryShare);
    const payments = q(Q.paymentBreakdown);
    const heat = q(Q.tierCategoryHeatmap);
    const mvp = q(Q.cityMvp);
    const rfm = q(Q.rfm);
    const atRisk = q(Q.atRiskCustomers, [90]);
    const never = q(Q.neverOrdered);
    const low = q(Q.lowStock, [5]);
    const feed = q(Q.activityFeed);

    const segCounts = rfm.reduce((m, r) => (m[r.segment] = (m[r.segment] || 0) + 1, m), {});
    const SEG = {Champion: "🏆", Loyal: "💙", New: "🌱", Regular: "👤", "At Risk": "🚨", Hibernating: "💤"};
    const best = monthly.find((m) => m.revenue_rank === 1);

    view.innerHTML = `
      ${subnav("dashboard")}
      <div class="page-head"><div><p class="eyebrow">ShopNova Admin</p><h1>แดชบอร์ดผู้ดูแล</h1><p class="muted">ข้อมูลสดจาก SQLite ในเบราว์เซอร์ — รายได้นับเฉพาะ <code>status = 'completed'</code> ตามนิยามในบทเรียน</p></div>
        <div class="page-actions"><button class="btn btn-ghost" data-action="open-sql">🧾 ดู SQL</button></div></div>

      <div class="stat-tiles stat-tiles-4">
        <div class="tile tile-hero"><span>รายได้รวม (completed)</span><strong>${money(k.revenue)}</strong><em class="sql-hint">SUM(quantity × unit_price)</em></div>
        <div class="tile"><span>ยอดค้างในระบบ (pending + shipped)</span><strong>${money(k.pipeline)}</strong></div>
        <div class="tile"><span>ยอดเฉลี่ยต่อออเดอร์</span><strong>${money(k.avg_order_value)}</strong><em class="sql-hint">AVG จาก VIEW v_order_totals</em></div>
        <div class="tile"><span>คะแนนรีวิวเฉลี่ย</span><strong>${k.avg_rating ?? "–"} ★</strong></div>
      </div>
      <div class="stat-tiles stat-tiles-6">
        <div class="tile tile-sm"><span>ออเดอร์ทั้งหมด</span><strong>${number(st.total)}</strong></div>
        <div class="tile tile-sm st-pending"><span>⏳ รอดำเนินการ</span><strong>${number(st.pending)}</strong></div>
        <div class="tile tile-sm st-shipped"><span>🚚 กำลังส่ง</span><strong>${number(st.shipped)}</strong></div>
        <div class="tile tile-sm st-completed"><span>✅ สำเร็จ</span><strong>${number(st.completed)}</strong></div>
        <div class="tile tile-sm st-cancelled"><span>✕ ยกเลิก</span><strong>${number(st.cancelled)}</strong></div>
        <div class="tile tile-sm ${k.unpaid ? "tile-warn" : ""}"><span>⚠️ ยังไม่ชำระ</span><strong>${number(k.unpaid)}</strong><em class="sql-hint">payment_method IS NULL</em></div>
      </div>

      <div class="dash-grid">
        <div id="chartMonthly" class="card span-2"></div>
        <div id="chartCumulative" class="card"></div>
        <section class="card">
          <div class="section-head"><h3>📈 เติบโตรายเดือน (MoM)</h3><p class="sql-hint">บท 46 · LAG() + บท 43 · เดือนทอง</p></div>
          <div class="table-scroll"><table class="table table-compact">
            <thead><tr><th>เดือน</th><th class="num">ออเดอร์</th><th class="num">รายได้</th><th class="num">MoM</th></tr></thead>
            <tbody>${monthly.slice().reverse().map((m) => `<tr class="${m.revenue_rank === 1 ? "row-best" : ""}">
              <td>${monthTh(m.month)} ${m.revenue_rank === 1 ? "🏆" : ""}</td><td class="num">${m.orders}</td><td class="num">${money(m.revenue)}</td>
              <td class="num">${m.mom_pct == null ? `<span class="muted">—</span>` : `<span class="delta ${m.mom_pct >= 0 ? "up" : "down"}">${m.mom_pct >= 0 ? "▲" : "▼"} ${Math.abs(m.mom_pct)}%</span>`}</td></tr>`).join("")}</tbody>
          </table></div>
          ${best ? `<p class="muted small">เดือนทอง: <strong>${monthTh(best.month, true)}</strong> ทำยอด ${money(best.revenue)} (RANK() OVER (ORDER BY revenue DESC) = 1)</p>` : ""}
        </section>
        <div id="chartTop" class="card span-2"></div>
        <div id="chartShare" class="card"></div>
        <div id="chartHeat" class="card span-2"></div>
        <section class="card">
          <div class="section-head"><h3>💳 ช่องทางชำระเงิน</h3><p class="sql-hint">บท 6 · COALESCE(NULL → 'ยังไม่ชำระ')</p></div>
          ${payments.map((p) => `<div class="bar-line"><span>${paymentLabel(p.method === "ยังไม่ชำระ" ? null : p.method)}</span><div class="meter"><i style="width:${p.pct}%"></i></div><strong>${p.orders}</strong><small>${p.pct}%</small></div>`).join("")}
        </section>

        <section class="card span-2">
          <div class="section-head"><h3>🎯 RFM Segmentation</h3><p class="sql-hint">บท 31 · Capstone: CTE + NTILE(3) + CASE</p></div>
          <div class="seg-chips">${Object.entries(SEG).map(([s, icon]) => `<span class="seg seg-${s.replace(/\s/g, "").toLowerCase()}">${icon} ${s} <strong>${segCounts[s] || 0}</strong></span>`).join("")}</div>
          <div class="table-scroll"><table class="table table-compact">
            <thead><tr><th>ลูกค้า</th><th>Segment</th><th class="num">R (วัน)</th><th class="num">F</th><th class="num">M</th><th class="num">Score</th></tr></thead>
            <tbody>${rfm.slice(0, 12).map((r) => `<tr>
              <td>${esc(r.name)} <small class="muted">${esc(r.city)}</small></td>
              <td><span class="seg seg-${r.segment.replace(/\s/g, "").toLowerCase()}">${SEG[r.segment]} ${r.segment}</span></td>
              <td class="num">${r.recency_days}</td><td class="num">${r.frequency}</td><td class="num">${money(r.monetary)}</td>
              <td class="num"><code>${r.r}${r.f}${r.m}</code></td></tr>`).join("")}</tbody>
          </table></div>
          <p class="muted small">แสดง 12 อันดับแรกจาก ${rfm.length} คนที่มีออเดอร์สำเร็จ · Score = R·F·M (1 = ดีที่สุด)</p>
        </section>

        <section class="card">
          <div class="section-head"><h3>🏙️ MVP ประจำเมือง</h3><p class="sql-hint">บท 48 · ROW_NUMBER() OVER (PARTITION BY city)</p></div>
          <ul class="list">${mvp.map((m) => `<li><div class="list-main"><strong>${esc(m.city)}</strong><br/><span>${esc(m.name)} ${tierBadge(m.member_tier)}</span></div><div class="list-right"><strong>${money(m.total)}</strong><small>จาก ${m.buyers_in_city} คน · เมืองรวม ${money(m.city_total)}</small></div></li>`).join("")}</ul>
        </section>

        <section class="card">
          <div class="section-head"><h3>🚨 ลูกค้ากำลังหลุดมือ</h3><p class="sql-hint">บท 49 · HAVING julianday('now') − MAX(order_date) > 90</p></div>
          ${atRisk.length ? `<ul class="list">${atRisk.map((c) => `<li><div class="list-main"><strong>${esc(c.name)}</strong> ${tierBadge(c.member_tier)}<br/><span>ซื้อล่าสุด ${dateTh(c.last_order_date)} · ${c.orders} ออเดอร์</span></div><div class="list-right"><strong>${money(c.total_spent)}</strong><small class="hint-warn">${c.days_since} วันแล้ว</small></div></li>`).join("")}</ul>` : `<p class="empty">ไม่มีลูกค้าที่หายไปเกิน 90 วัน 🎉</p>`}
        </section>

        <section class="card">
          <div class="section-head"><h3>😴 สมัครแล้วไม่เคยสั่งซื้อ</h3><p class="sql-hint">บท 13 · LEFT JOIN ... WHERE order_id IS NULL</p></div>
          ${never.length ? `<ul class="list">${never.map((c) => `<li><div class="list-main"><strong>${esc(c.name)}</strong> ${tierBadge(c.member_tier)}<br/><span>${esc(c.city)} · สมัคร ${dateTh(c.registered_date)}</span></div><div class="list-right"><a class="btn btn-xs btn-ghost" href="#/admin/customers?q=${encodeURIComponent(c.name)}">ดู</a></div></li>`).join("")}</ul>` : `<p class="empty">ลูกค้าทุกคนเคยสั่งซื้อแล้ว</p>`}
        </section>

        <section class="card">
          <div class="section-head"><h3>📉 สต็อกใกล้หมด (≤ 5)</h3><p class="sql-hint">บท 2 · WHERE stock <= ?</p></div>
          ${low.length ? `<ul class="list">${low.map((p) => `<li><div class="list-main">${imgTag(productImage(p.product_id, p.category_id, 96, 72), p.name, "list-thumb", categoryIcon(p.category_id))}<div><strong><a href="#/product/${p.product_id}">${esc(p.name)}</a></strong><br/><span>${esc(p.category_name)} · ขายแล้ว ${p.sold_qty || 0}</span></div></div><div class="list-right"><strong class="${p.stock === 0 ? "hint-warn" : ""}">${p.stock === 0 ? "หมด" : `เหลือ ${p.stock}`}</strong><button class="btn btn-xs btn-primary" data-action="restock" data-id="${p.product_id}" data-qty="10">+10</button></div></li>`).join("")}</ul>` : `<p class="empty">สต็อกทุกรายการเพียงพอ</p>`}
        </section>

        <section class="card span-2">
          <div class="section-head"><h3>🕒 กิจกรรมล่าสุด</h3><p class="sql-hint">บท 25 · UNION ALL (orders ∪ reviews) + บท 15 · ต่อข้อความด้วย ||</p></div>
          <ul class="feed">${feed.map((f) => `<li><span class="feed-icon">${f.kind === "order" ? "🧾" : "⭐"}</span><div><strong>${esc(f.who)}</strong> ${esc(f.detail)}</div><small>${dateTh(f.at)}</small> ${f.kind === "order" ? `<a class="btn btn-xs btn-ghost" href="#/order/${f.ref}">ดู</a>` : `<a class="btn btn-xs btn-ghost" href="#/product/${f.ref}">ดู</a>`}</li>`).join("")}</ul>
        </section>
      </div>`;

    // ---------- Charts ----------
    const catSeries = cats.slice(0, 4).map((c, i) => ({name: c.name, color: SERIES[i]}));
    const hasOther = byCat.some((m) => m.cat_other > 0);
    if (hasOther) catSeries.push({name: "อื่น ๆ", color: SERIES[4]});
    const byCatMap = new Map(byCat.map((m) => [m.month, m]));
    Charts.stackedBars(view.querySelector("#chartMonthly"), {
      title: "รายได้รายเดือน แยกตามหมวดหมู่",
      subtitle: "บท 41 · GROUP BY strftime('%Y-%m') + บท 28 · Pivot SUM(CASE WHEN category) + บท 29 · Recursive CTE เติมเดือนที่ไม่มียอด",
      series: catSeries,
      data: monthly.map((m) => {
        const r = byCatMap.get(m.month) || {};
        const vals = [r.cat1 || 0, r.cat2 || 0, r.cat3 || 0, r.cat4 || 0];
        if (hasOther) vals.push(r.cat_other || 0);
        return {label: m.month, values: vals};
      }),
      formatLabel: (l, full) => monthTh(l, full)
    });
    Charts.line(view.querySelector("#chartCumulative"), {
      title: "ยอดขายสะสม",
      subtitle: "บท 47 · SUM() OVER (ORDER BY month ROWS UNBOUNDED PRECEDING)",
      data: monthly.map((m) => ({label: m.month, value: m.cumulative, extra: `เดือนนี้ ${money(m.revenue)}`})),
      formatLabel: (l, full) => monthTh(l, full)
    });
    Charts.hbars(view.querySelector("#chartTop"), {
      title: "สินค้าทำรายได้สูงสุด 10 อันดับ",
      subtitle: "บท 40 · JOIN 4 ตาราง + GROUP BY + ORDER BY revenue DESC LIMIT 10",
      data: topProducts.map((p) => ({label: p.name, value: p.revenue, extra: `${p.qty} ชิ้น · ${esc(p.category_name)}`, category_id: p.category_id})),
      colorOf: (d) => catColor(d.category_id)
    });
    Charts.hbars(view.querySelector("#chartShare"), {
      title: "สัดส่วนรายได้ต่อหมวด",
      subtitle: "บท 45 · SUM() OVER () คิด % ของทั้งหมด",
      data: share.map((s) => ({label: `${s.name} (${s.pct}%)`, value: s.revenue, extra: `${s.qty} ชิ้น`, category_id: s.category_id})),
      colorOf: (d) => catColor(d.category_id)
    });
    const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
    const catNames = cats.map((c) => c.name);
    Charts.heatmap(view.querySelector("#chartHeat"), {
      title: "ใครซื้ออะไร — ระดับสมาชิก × หมวดหมู่",
      subtitle: "บท 26 · CROSS JOIN สร้างทุกช่องก่อน แล้ว LEFT JOIN ยอดขาย (ช่องว่าง = 0 ไม่หาย)",
      rows: tiers,
      cols: catNames,
      values: tiers.map((t) => catNames.map((c) => heat.find((h) => h.member_tier === t && h.category === c)?.revenue || 0))
    });
  }

  // ==========================================================
  // Orders
  // ==========================================================
  const ORDER_PAGE = 15;
  function renderOrders(view, params) {
    const f = {status: params.get("status") || "", q: (params.get("q") || "").trim(), unpaid: params.get("unpaid") === "1", page: Math.max(1, Number(params.get("page") || 1))};
    f.limit = ORDER_PAGE; f.offset = (f.page - 1) * ORDER_PAGE;
    const def = Q.adminOrders(f);
    const total = DB.one(def.countSql, def.countParams, {lesson: "บท 10 · COUNT(*)"}).total;
    const rows = DB.query(def.sql, def.params, {lesson: def.lesson});
    const pages = Math.max(1, Math.ceil(total / ORDER_PAGE));
    const link = (patch) => {
      const p = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === false) ? p.delete(k) : p.set(k, v));
      if (!("page" in patch)) p.delete("page");
      const s = p.toString();
      return `#/admin/orders${s ? "?" + s : ""}`;
    };
    view.innerHTML = `
      ${subnav("orders")}
      <div class="page-head"><div><p class="eyebrow">จัดการ</p><h1>ออเดอร์ <small class="muted">(${number(total)})</small></h1><p class="muted">เปลี่ยนสถานะด้วย <code>UPDATE ... WHERE status = ?</code> — ยกเลิกจะคืนสต็อกใน Transaction</p></div></div>
      <div class="toolbar">
        <div class="chips">
          <a class="chip ${!f.status ? "active" : ""}" href="${link({status: ""})}">ทั้งหมด</a>
          ${Object.entries(UI.STATUS_META).map(([s, m]) => `<a class="chip ${f.status === s ? "active" : ""}" href="${link({status: s})}">${m.icon} ${m.label}</a>`).join("")}
          <a class="chip ${f.unpaid ? "active" : ""}" href="${link({unpaid: f.unpaid ? "" : "1"})}">⚠️ ยังไม่ชำระ</a>
        </div>
        <form class="toolbar-search" id="orderSearch"><input type="search" name="q" value="${esc(f.q)}" placeholder="ค้นชื่อลูกค้า หรือเลขออเดอร์" /><button class="btn btn-ghost btn-sm">ค้นหา</button></form>
      </div>
      <div class="card">
        <div class="table-scroll"><table class="table">
          <thead><tr><th>ออเดอร์</th><th>ลูกค้า</th><th>วันที่</th><th>สถานะ</th><th>ชำระเงิน</th><th class="num">รายการ</th><th class="num">ยอดรวม</th><th>จัดการ</th></tr></thead>
          <tbody>${rows.length ? rows.map((o) => `<tr>
            <td><a href="#/order/${o.order_id}"><strong>#${o.order_id}</strong></a></td>
            <td>${esc(o.customer_name)}<br/><small class="muted">${esc(o.city)}</small> ${tierBadge(o.member_tier)}</td>
            <td>${dateTh(o.order_date)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>${paymentLabel(o.payment_method)}</td>
            <td class="num">${o.item_count}</td>
            <td class="num"><strong>${money(o.total)}</strong></td>
            <td><div class="row-actions">
              ${o.status === "pending" ? `<button class="btn btn-xs btn-primary" data-action="order-status" data-id="${o.order_id}" data-from="pending" data-to="shipped">🚚 จัดส่ง</button><button class="btn btn-xs btn-danger-ghost" data-action="order-cancel" data-id="${o.order_id}">ยกเลิก</button>` : ""}
              ${o.status === "shipped" ? `<button class="btn btn-xs btn-primary" data-action="order-status" data-id="${o.order_id}" data-from="shipped" data-to="completed">✅ สำเร็จ</button>` : ""}
              <button class="btn btn-xs btn-ghost" data-action="order-view" data-id="${o.order_id}">รายการ</button>
            </div></td></tr>`).join("") : `<tr><td colspan="8" class="empty">ไม่พบออเดอร์</td></tr>`}</tbody>
        </table></div>
        ${pages > 1 ? `<nav class="pagination"><a class="btn btn-ghost btn-sm ${f.page <= 1 ? "disabled" : ""}" href="${link({page: f.page - 1})}">← ก่อนหน้า</a><span>หน้า ${f.page} / ${pages}</span><a class="btn btn-ghost btn-sm ${f.page >= pages ? "disabled" : ""}" href="${link({page: f.page + 1})}">ถัดไป →</a></nav>` : ""}
      </div>`;
    view.querySelector("#orderSearch").addEventListener("submit", (e) => {e.preventDefault(); location.hash = link({q: new FormData(e.target).get("q")});});
  }

  function viewOrderItems(orderId) {
    const o = one(Q.orderById, [orderId]);
    const items = q(Q.orderItems, [orderId]);
    openModal(`📦 ออเดอร์ #${orderId} · ${esc(o.customer_name)}`, `
      <p class="muted">${dateTh(o.order_date)} · ${statusBadge(o.status)} · ${paymentLabel(o.payment_method)}</p>
      <div class="table-scroll"><table class="table table-compact">
        <thead><tr><th>สินค้า</th><th class="num">ราคา</th><th class="num">จำนวน</th><th class="num">รวม</th></tr></thead>
        <tbody>${items.map((i) => `<tr><td>${esc(i.name)}</td><td class="num">${money2(i.unit_price)}</td><td class="num">${i.quantity}</td><td class="num">${money2(i.line_total)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td colspan="3">รวม</td><td class="num"><strong>${money2(o.total)}</strong></td></tr></tfoot>
      </table></div>
      <div class="form-actions"><a class="btn btn-ghost" href="#/order/${orderId}" id="orderOpenLink">เปิดหน้าใบสั่งซื้อ</a></div>`);
    document.getElementById("orderOpenLink").addEventListener("click", closeModal);
  }

  function updateOrderStatus(orderId, from, to) {
    const changed = run(Q.orderStatusUpdate, [to, orderId, from]);
    if (changed) toast(`ออเดอร์ #${orderId}: ${esc(from)} → <strong>${esc(to)}</strong>`, "success");
    else toast(`อัปเดตไม่ได้ — ออเดอร์ไม่ได้อยู่ในสถานะ ${esc(from)} แล้ว (UPDATE 0 แถว)`, "warn");
    Router.refresh();
  }

  async function adminCancel(orderId) {
    const ok = await UI.confirmDialog("ยกเลิกออเดอร์?", `ยกเลิกออเดอร์ <strong>#${orderId}</strong> และคืนสต็อกสินค้า (Transaction)`, {okLabel: "ยกเลิกออเดอร์", danger: true});
    if (!ok) return;
    try {
      DB.transaction(() => {
        if (run(Q.cancelOrder, [orderId]) !== 1) throw new Error("ออเดอร์ไม่อยู่ในสถานะ pending");
        run(Q.restockOrder, [orderId, orderId]);
      }, {lesson: "บท 22 · Transaction ยกเลิก + คืนสต็อก"});
      toast(`ยกเลิกออเดอร์ #${orderId} แล้ว`, "success");
    } catch (err) {toast(`ROLLBACK: ${esc(err.message)}`, "error");}
    Router.refresh();
  }

  // ==========================================================
  // Products
  // ==========================================================
  function renderProducts(view, params) {
    const f = {category: params.get("category") || "", q: (params.get("q") || "").trim(), lowStock: params.get("low") === "1"};
    const cats = q(Q.categories);
    const def = Q.adminProducts(f);
    const rows = DB.query(def.sql, def.params, {lesson: def.lesson});
    const link = (patch) => {
      const p = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === false) ? p.delete(k) : p.set(k, v));
      const s = p.toString();
      return `#/admin/products${s ? "?" + s : ""}`;
    };
    view.innerHTML = `
      ${subnav("products")}
      <div class="page-head"><div><p class="eyebrow">จัดการ</p><h1>สินค้า <small class="muted">(${rows.length})</small></h1><p class="muted">INSERT / UPDATE / DELETE จริง — ลบสินค้าที่มีออเดอร์จะติด <code>FOREIGN KEY constraint</code> (PRAGMA foreign_keys = ON)</p></div>
        <div class="page-actions"><button class="btn btn-ghost" data-action="category-add">+ หมวดหมู่</button><button class="btn btn-primary" data-action="product-add">+ เพิ่มสินค้า</button></div></div>
      <div class="toolbar">
        <div class="chips">
          <a class="chip ${!f.category ? "active" : ""}" href="${link({category: ""})}">ทุกหมวด</a>
          ${cats.map((c) => `<a class="chip ${String(c.category_id) === f.category ? "active" : ""}" href="${link({category: c.category_id})}">${categoryIcon(c.category_id)} ${esc(c.name)} <span>${c.product_count}</span></a>`).join("")}
          <a class="chip ${f.lowStock ? "active" : ""}" href="${link({low: f.lowStock ? "" : "1"})}">📉 ใกล้หมด</a>
        </div>
        <form class="toolbar-search" id="productSearch"><input type="search" name="q" value="${esc(f.q)}" placeholder="ค้นชื่อสินค้า (LIKE)" /><button class="btn btn-ghost btn-sm">ค้นหา</button></form>
      </div>
      <div class="card">
        <div class="table-scroll"><table class="table">
          <thead><tr><th>สินค้า</th><th>หมวด</th><th class="num">ราคา</th><th class="num">สต็อก</th><th>คะแนน</th><th class="num">ขายแล้ว</th><th class="num">รายได้</th><th class="num">อันดับในหมวด</th><th>จัดการ</th></tr></thead>
          <tbody>${rows.length ? rows.map((p) => `<tr class="${p.stock <= 0 ? "row-muted" : ""}">
            <td class="cell-product">${imgTag(productImage(p.product_id, p.category_id, 96, 72), p.name, "list-thumb", categoryIcon(p.category_id))}<div><a href="#/product/${p.product_id}"><strong>${esc(p.name)}</strong></a><br/><small class="muted">#${p.product_id}</small></div></td>
            <td>${categoryIcon(p.category_id)} ${esc(p.category_name)}</td>
            <td class="num">${money(p.price)}</td>
            <td class="num"><span class="${p.stock <= 0 ? "hint-warn" : p.stock <= 5 ? "hint-low" : ""}">${p.stock}</span>
              <span class="stock-btns"><button class="btn btn-xs btn-ghost" data-action="restock" data-id="${p.product_id}" data-qty="-1" aria-label="ลดสต็อก">−</button><button class="btn btn-xs btn-ghost" data-action="restock" data-id="${p.product_id}" data-qty="1" aria-label="เพิ่มสต็อก">+</button><button class="btn btn-xs btn-ghost" data-action="restock" data-id="${p.product_id}" data-qty="10">+10</button></span></td>
            <td>${stars(p.rating)} <small class="muted">(${p.review_count || 0})</small></td>
            <td class="num">${number(p.sold_qty || 0)}</td>
            <td class="num">${money(p.revenue || 0)}</td>
            <td class="num">#${p.cat_rank}</td>
            <td><div class="row-actions"><button class="btn btn-xs btn-ghost" data-action="product-edit" data-id="${p.product_id}">แก้ไข</button><button class="btn btn-xs btn-danger-ghost" data-action="product-delete" data-id="${p.product_id}">ลบ</button></div></td>
          </tr>`).join("") : `<tr><td colspan="9" class="empty">ไม่พบสินค้า</td></tr>`}</tbody>
        </table></div>
      </div>`;
    view.querySelector("#productSearch").addEventListener("submit", (e) => {e.preventDefault(); location.hash = link({q: new FormData(e.target).get("q")});});
  }

  function productForm(p = null) {
    const cats = q(Q.categories);
    const isEdit = !!p;
    openModal(isEdit ? `✏️ แก้ไขสินค้า #${p.product_id}` : "➕ เพิ่มสินค้าใหม่", `
      <form id="productForm" class="form">
        <p class="help">${isEdit ? "<code>UPDATE products SET name = ?, category_id = ?, price = ?, stock = ? WHERE product_id = ?</code>" : "<code>INSERT INTO products (name, category_id, price, stock, rating) VALUES (?, ?, ?, ?, NULL)</code> — สินค้าใหม่ rating เป็น NULL จนกว่าจะมีรีวิว"}</p>
        <label>ชื่อสินค้า <input name="name" required minlength="3" value="${esc(p?.name || "")}" placeholder="เช่น Wireless Keyboard Slim" /></label>
        <div class="form-row">
          <label>หมวดหมู่ <select name="category_id" required>${cats.map((c) => `<option value="${c.category_id}" ${p && p.category_id === c.category_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
          <label>ราคา (บาท) <input name="price" type="number" min="1" step="0.01" required value="${p?.price ?? ""}" /></label>
          <label>สต็อก <input name="stock" type="number" min="0" step="1" required value="${p?.stock ?? 10}" /></label>
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">${isEdit ? "บันทึก" : "เพิ่มสินค้า"}</button></div>
      </form>`);
    document.getElementById("productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const vals = [String(fd.get("name")).trim(), Number(fd.get("category_id")), Number(fd.get("price")), Number(fd.get("stock"))];
      try {
        if (isEdit) run(Q.productUpdate, [...vals, p.product_id]);
        else run(Q.productInsert, vals);
        closeModal();
        toast(isEdit ? "บันทึกสินค้าแล้ว" : `เพิ่มสินค้า #${DB.lastInsertId()} แล้ว`, "success");
        Router.refresh();
      } catch (err) {toast(`บันทึกไม่สำเร็จ: ${esc(err.message)}`, "error");}
    });
  }

  async function deleteProduct(productId) {
    const p = DB.one("SELECT product_id, name FROM products WHERE product_id = ?", [productId], {lesson: "บท 2 · WHERE"});
    const refs = one(Q.productRefs, [productId, productId]);
    const blocked = refs.in_orders > 0 || refs.in_reviews > 0;
    const ok = await UI.confirmDialog("ลบสินค้า?", `ลบ <strong>${esc(p.name)}</strong> ด้วย <code>DELETE FROM products WHERE product_id = ${productId}</code><br/><br/>
      ${blocked ? `⚠️ สินค้านี้ถูกอ้างอิงใน <strong>order_items ${refs.in_orders} แถว</strong> และ <strong>reviews ${refs.in_reviews} แถว</strong> — FOREIGN KEY จะปฏิเสธการลบ (ลองดู error จริงได้)` : "สินค้านี้ยังไม่ถูกอ้างอิงจากตารางอื่น ลบได้"}`,
      {okLabel: "ลองลบ", danger: true});
    if (!ok) return;
    try {
      run(Q.productDelete, [productId]);
      toast(`ลบ ${esc(p.name)} แล้ว`, "success");
    } catch (err) {
      toast(`ลบไม่ได้: <code>${esc(err.message)}</code><br/><small>นี่คือ FOREIGN KEY ปกป้องความถูกต้องของข้อมูล (บท 23) — ในระบบจริงมักใช้ "ซ่อนสินค้า" แทนการลบ</small>`, "error", 7000);
    }
    Router.refresh();
  }

  function restock(productId, qty) {
    run(Q.stockAdjust, [qty, productId]);
    toast(`ปรับสต็อกสินค้า #${productId} ${qty > 0 ? "+" : ""}${qty}`, "success", 1500);
    Router.refresh();
  }

  function categoryForm() {
    openModal("➕ เพิ่มหมวดหมู่", `
      <form id="categoryForm" class="form">
        <p class="help"><code>name</code> มี UNIQUE — ตั้งชื่อซ้ำจะได้ error <code>UNIQUE constraint failed</code></p>
        <label>ชื่อหมวด <input name="name" required minlength="2" placeholder="เช่น Smart Home" /></label>
        <label>คำอธิบาย <input name="description" placeholder="อุปกรณ์บ้านอัจฉริยะ" /></label>
        <div class="form-actions"><button class="btn btn-primary" type="submit">เพิ่มหมวด</button></div>
      </form>`);
    document.getElementById("categoryForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        run(Q.categoryInsert, [String(fd.get("name")).trim(), String(fd.get("description") || "").trim() || null]);
        closeModal();
        toast("เพิ่มหมวดหมู่แล้ว", "success");
        Router.refresh();
      } catch (err) {toast(`เพิ่มไม่สำเร็จ: ${esc(err.message)}`, "error");}
    });
  }

  // ==========================================================
  // Customers
  // ==========================================================
  function renderCustomers(view, params) {
    const f = {tier: params.get("tier") || "", city: params.get("city") || "", q: (params.get("q") || "").trim(), vip: params.get("vip") === "1", sort: params.get("sort") || "spent"};
    const def = Q.adminCustomers(f);
    const rows = DB.query(def.sql, def.params, {lesson: def.lesson});
    const cities = q(Q.cities);
    const link = (patch) => {
      const p = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === false) ? p.delete(k) : p.set(k, v));
      const s = p.toString();
      return `#/admin/customers${s ? "?" + s : ""}`;
    };
    view.innerHTML = `
      ${subnav("customers")}
      <div class="page-head"><div><p class="eyebrow">จัดการ</p><h1>ลูกค้า <small class="muted">(${rows.length})</small></h1><p class="muted">LEFT JOIN เพื่อให้ลูกค้าที่ไม่มีออเดอร์ยังปรากฏ · COUNT(DISTINCT order_id) กันตัวเลขบวมจาก order_items</p></div></div>
      <div class="toolbar">
        <div class="chips">
          <a class="chip ${!f.tier && !f.vip ? "active" : ""}" href="${link({tier: "", vip: ""})}">ทั้งหมด</a>
          ${["Platinum", "Gold", "Silver", "Bronze"].map((t) => `<a class="chip ${f.tier === t ? "active" : ""}" href="${link({tier: t, vip: ""})}">${UI.TIER_META[t].icon} ${t}</a>`).join("")}
          <a class="chip ${f.vip ? "active" : ""}" href="${link({vip: f.vip ? "" : "1", tier: ""})}">👑 VIP (สูงกว่าค่าเฉลี่ย)</a>
        </div>
        <div class="toolbar-right">
          <select id="citySelect"><option value="">ทุกจังหวัด</option>${cities.map((c) => `<option value="${esc(c.city)}" ${f.city === c.city ? "selected" : ""}>${esc(c.city)}</option>`).join("")}</select>
          <select id="sortSelect"><option value="spent" ${f.sort === "spent" ? "selected" : ""}>ยอดซื้อสูงสุด</option><option value="orders" ${f.sort === "orders" ? "selected" : ""}>สั่งซื้อบ่อยสุด</option><option value="recent" ${f.sort === "recent" ? "selected" : ""}>สมัครล่าสุด</option></select>
          <form class="toolbar-search" id="customerSearch"><input type="search" name="q" value="${esc(f.q)}" placeholder="ชื่อ / อีเมล / จังหวัด" /><button class="btn btn-ghost btn-sm">ค้นหา</button></form>
        </div>
      </div>
      <div class="card">
        <div class="table-scroll"><table class="table">
          <thead><tr><th>ลูกค้า</th><th>จังหวัด</th><th>ระดับ</th><th>สมัครเมื่อ</th><th class="num">ออเดอร์</th><th class="num">ยอดซื้อสำเร็จ</th><th>ซื้อล่าสุด</th></tr></thead>
          <tbody>${rows.length ? rows.map((c) => `<tr>
            <td class="cell-product">${imgTag(avatar(c.name, 40), c.name, "list-avatar", "👤")}<div><strong>${esc(c.name)}</strong><br/><small class="muted">${esc(c.email)}</small></div></td>
            <td>${esc(c.city)}</td>
            <td><select class="tier-select" data-action="tier-change" data-id="${c.customer_id}" aria-label="ระดับสมาชิกของ ${esc(c.name)}">${["Bronze", "Silver", "Gold", "Platinum"].map((t) => `<option value="${t}" ${c.member_tier === t ? "selected" : ""}>${UI.TIER_META[t].icon} ${t}</option>`).join("")}</select></td>
            <td>${dateTh(c.registered_date)}</td>
            <td class="num">${c.order_count}</td>
            <td class="num"><strong>${money(c.total_spent)}</strong></td>
            <td>${c.last_order_date ? dateTh(c.last_order_date) : `<span class="muted">ไม่เคยสั่งซื้อ</span>`}</td>
          </tr>`).join("") : `<tr><td colspan="7" class="empty">ไม่พบลูกค้า</td></tr>`}</tbody>
        </table></div>
      </div>`;
    view.querySelector("#customerSearch").addEventListener("submit", (e) => {e.preventDefault(); location.hash = link({q: new FormData(e.target).get("q")});});
    view.querySelector("#citySelect").addEventListener("change", (e) => {location.hash = link({city: e.target.value});});
    view.querySelector("#sortSelect").addEventListener("change", (e) => {location.hash = link({sort: e.target.value});});
    view.querySelectorAll(".tier-select").forEach((sel) => sel.addEventListener("change", (e) => {
      run(Q.customerTierUpdate, [e.target.value, Number(e.target.dataset.id)]);
      toast(`อัปเดตระดับสมาชิกเป็น ${esc(e.target.value)}`, "success", 1500);
      Shop.refreshCustomer();
    }));
  }

  // ==========================================================
  // Actions
  // ==========================================================
  function handleAction(action, el) {
    const id = Number(el.dataset.id);
    switch (action) {
      case "order-status": updateOrderStatus(id, el.dataset.from, el.dataset.to); return true;
      case "order-cancel": adminCancel(id); return true;
      case "order-view": viewOrderItems(id); return true;
      case "product-add": productForm(); return true;
      case "product-edit": productForm(DB.one("SELECT * FROM products WHERE product_id = ?", [id], {lesson: "บท 2 · WHERE"})); return true;
      case "product-delete": deleteProduct(id); return true;
      case "restock": restock(id, Number(el.dataset.qty)); return true;
      case "category-add": categoryForm(); return true;
      default: return false;
    }
  }

  return {renderDashboard, renderOrders, renderProducts, renderCustomers, handleAction};
})();
