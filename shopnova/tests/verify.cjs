/**
 * ShopNova Thailand — ตรวจสอบ SQL ทุกคำสั่งใน js/queries.js กับ seed จริง (sql.js ตัวเดียวกับแอป)
 *   1. schema ส่วนขยาย (VIEW / INDEX) สร้างได้บน seed ของ SQL Journey
 *   2. query อ่านทุกตัวรันผ่านและคืนคอลัมน์ที่ UI ใช้
 *   3. flow เขียนจริง: สมัคร (UPSERT) → สั่งซื้อใน Transaction → ROLLBACK เมื่อสต็อกไม่พอ → รีวิว + CHECK → ยกเลิก + คืนสต็อก → FK ป้องกันลบ
 * รัน: node shopnova/tests/verify.cjs
 */
const path = require("path");
const fs = require("fs");
const root = path.join(__dirname, "..", "..");
const initSqlJs = require(path.join(root, "vendor", "sql-wasm.js"));

function loadBrowserGlobals(relPath, exportExpr, extraGlobals = "") {
  const src = fs.readFileSync(path.join(root, relPath), "utf8");
  return new Function(`${extraGlobals}\n${src}\nreturn ${exportExpr};`)();
}
const { initialSQL } = loadBrowserGlobals("js/schema.js", "{ initialSQL }");
const { Q } = loadBrowserGlobals("shopnova/js/queries.js", "{ Q }");
// ดึง APP_SCHEMA ออกจาก db.js โดยไม่ต้องมี DOM
const dbSrc = fs.readFileSync(path.join(root, "shopnova/js/db.js"), "utf8");
const APP_SCHEMA = dbSrc.match(/const APP_SCHEMA = `([\s\S]*?)`;/)[1];

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name} ${detail}`); } };

function query(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  try { stmt.bind(params); while (stmt.step()) rows.push(stmt.getAsObject()); } finally { stmt.free(); }
  return rows;
}
function run(db, sql, params = []) { db.run(sql, params); return db.getRowsModified(); }

(async () => {
  const SQL = await initSqlJs({ locateFile: (f) => path.join(root, "vendor", f) });
  const db = new SQL.Database();
  db.run(initialSQL);
  db.run("PRAGMA foreign_keys = ON;");
  db.run(APP_SCHEMA);
  console.log("\n[1] Schema ส่วนขยาย");
  ok("views + indexes สร้างได้", query(db, "SELECT COUNT(*) AS n FROM sqlite_master WHERE type IN ('view','index') AND name LIKE 'v_%' OR name LIKE 'idx_%'")[0].n >= 8);
  ok("PRAGMA foreign_keys เปิด", query(db, "PRAGMA foreign_keys")[0].foreign_keys === 1);

  console.log("\n[2] Query อ่าน (ทุกตัวใน Q)");
  const readCases = {
    storeStats: [[], ["products", "customers", "completed_orders", "avg_rating"]],
    categories: [[], ["category_id", "name", "product_count", "min_price"]],
    searchSuggest: [["%key%"], ["product_id", "name", "price", "category_name"]],
    bestSellers: [[8], ["product_id", "sold_qty", "revenue", "category_name"]],
    newArrivals: [[4], ["product_id", "rating"]],
    topRated: [[4], ["product_id", "rating"]],
    productDetail: [[1], ["product_id", "category_name", "sold_qty", "review_count", "avg_review"]],
    productRankInCategory: [[1], ["sales_rank", "products_in_cat"]],
    ratingBreakdown: [[1], ["total", "avg_rating", "star5", "star1", "no_comment"]],
    productReviews: [[1], ["review_id", "customer_name", "member_tier", "verified"]],
    relatedProducts: [[1, 1], ["product_id", "category_name"]],
    boughtTogether: [[1], ["product_id", "times_together"]],
    customerList: [[], ["customer_id", "name", "email"]],
    customerByEmail: [["somchai@example.com"], ["customer_id"]],
    customerById: [[1], ["customer_id", "member_tier"]],
    customerSummary: [[1], ["order_count", "total_spent", "spend_rank", "customer_total", "days_since_last"]],
    tierDiscount: [[2], ["member_tier", "discount_pct"]],
    customerOrders: [[1], ["order_id", "item_count", "total"]],
    orderById: [[101], ["order_id", "customer_name", "total", "total_qty"]],
    orderItems: [[101], ["product_id", "line_total", "current_price"]],
    checkoutStock: [[1], ["stock", "price"]],
    hasPurchased: [[1, 1], ["purchased"]],
    kpis: [[], ["revenue", "pipeline", "orders_total", "customers", "low_stock", "unpaid", "avg_order_value"]],
    statusPivot: [[], ["total", "pending", "shipped", "completed", "cancelled"]],
    monthlySales: [[], ["month", "orders", "revenue", "mom_pct", "cumulative", "revenue_rank"]],
    monthlyByCategory: [[], ["month", "cat1", "cat2", "cat3", "cat4", "cat_other"]],
    topProducts: [[], ["product_id", "qty", "revenue", "category_name"]],
    categoryShare: [[], ["category_id", "revenue", "pct"]],
    paymentBreakdown: [[], ["method", "orders", "pct"]],
    tierCategoryHeatmap: [[], ["member_tier", "category", "revenue"]],
    cityMvp: [[], ["city", "name", "total", "buyers_in_city", "city_total"]],
    rfm: [[], ["customer_id", "recency_days", "frequency", "monetary", "r", "f", "m", "segment"]],
    atRiskCustomers: [[90], ["customer_id", "days_since", "total_spent"]],
    neverOrdered: [[], ["customer_id", "name"]],
    lowStock: [[5], ["product_id", "stock", "sold_qty"]],
    activityFeed: [[], ["kind", "at", "who", "detail", "ref"]],
    productRefs: [[1, 1], ["in_orders", "in_reviews"]],
    cities: [[], ["city"]]
  };
  for (const [name, [params, cols]] of Object.entries(readCases)) {
    try {
      const rows = query(db, Q[name].sql, params);
      const missing = rows.length ? cols.filter((c) => !(c in rows[0])) : [];
      ok(`${name} (${rows.length} แถว)`, rows.length > 0 && missing.length === 0, missing.length ? `ขาดคอลัมน์ ${missing.join(", ")}` : rows.length === 0 ? "0 แถว" : "");
    } catch (e) { ok(name, false, e.message); }
  }
  // query แบบ builder
  const builders = [
    ["catalog(default)", Q.catalog({ sort: "popular", limit: 12, offset: 0 })],
    ["catalog(filters)", Q.catalog({ category: 2, q: "mouse", inStock: true, minPrice: 100, maxPrice: 5000, minRating: 4, sort: "rating", limit: 12, offset: 0 })],
    ["catalog(new)", Q.catalog({ newOnly: true, sort: "newest", limit: 12, offset: 0 })],
    ["adminOrders", Q.adminOrders({ status: "pending", q: "สม", unpaid: true, limit: 15, offset: 0 })],
    ["adminProducts", Q.adminProducts({ category: 4, q: "mic", lowStock: false })],
    ["adminCustomers(vip)", Q.adminCustomers({ vip: true, sort: "spent" })],
    ["adminCustomers(filters)", Q.adminCustomers({ tier: "Gold", city: "กรุงเทพฯ", q: "a", sort: "orders" })],
    ["cartProducts", Q.cartProducts([1, 2, 3])]
  ];
  for (const [name, def] of builders) {
    try {
      const rows = query(db, def.sql, def.params);
      if (def.countSql) query(db, def.countSql, def.countParams);
      ok(`${name} (${rows.length} แถว)`, true);
    } catch (e) { ok(name, false, e.message); }
  }
  // ความถูกต้องเชิงข้อมูล
  const monthly = query(db, Q.monthlySales.sql);
  ok("monthlySales เติมเดือนต่อเนื่องไม่มีช่องว่าง", monthly.every((m, i) => i === 0 || (() => { const [y1, m1] = monthly[i - 1].month.split("-").map(Number); const [y2, m2] = m.month.split("-").map(Number); return (y2 * 12 + m2) - (y1 * 12 + m1) === 1; })()));
  ok("monthlySales cumulative เท่ากับผลรวมสะสม", Math.abs(monthly[monthly.length - 1].cumulative - monthly.reduce((a, m) => a + m.revenue, 0)) < 0.01);
  const share = query(db, Q.categoryShare.sql);
  ok("categoryShare รวมเป็น 100%", Math.abs(share.reduce((a, s) => a + s.pct, 0) - 100) < 0.5, String(share.reduce((a, s) => a + s.pct, 0)));
  ok("neverOrdered = ลูกค้า 42/45/47/48", JSON.stringify(query(db, Q.neverOrdered.sql).map((r) => r.customer_id).sort()) === JSON.stringify([42, 45, 47, 48]));
  const kpi = query(db, Q.kpis.sql)[0];
  const lessonRevenue = query(db, "SELECT SUM(oi.quantity * oi.unit_price) AS r FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed'")[0].r;
  ok("kpis.revenue ตรงกับนิยามในบทเรียน", Math.abs(kpi.revenue - lessonRevenue) < 0.01);
  ok("heatmap มีครบ 4 tier × 4 หมวด = 16 ช่อง", query(db, Q.tierCategoryHeatmap.sql).length === 16);

  console.log("\n[3] Flow เขียนจริง");
  // UPSERT
  run(db, Q.registerUpsert.sql, ["ทดสอบ ระบบ", "test@shopnova.th", "กรุงเทพฯ"]);
  run(db, Q.registerUpsert.sql, ["ทดสอบ เปลี่ยนชื่อ", "test@shopnova.th", "ภูเก็ต"]);
  const me = query(db, Q.customerByEmail.sql, ["test@shopnova.th"])[0];
  ok("UPSERT: อีเมลซ้ำอัปเดตชื่อ/เมืองแทน error", me.name === "ทดสอบ เปลี่ยนชื่อ" && me.city === "ภูเก็ต" && query(db, "SELECT COUNT(*) AS n FROM customers WHERE email = 'test@shopnova.th'")[0].n === 1);

  // Checkout สำเร็จ
  const stockBefore = query(db, "SELECT stock FROM products WHERE product_id = 1")[0].stock;
  db.run("BEGIN");
  run(db, Q.checkoutOrderInsert.sql, [me.customer_id, "PromptPay"]);
  const orderId = query(db, "SELECT last_insert_rowid() AS id")[0].id;
  ok("UPDATE stock แบบมีเงื่อนไข เปลี่ยน 1 แถว", run(db, Q.checkoutStockDeduct.sql, [2, 1, 2]) === 1);
  run(db, Q.checkoutItemInsert.sql, [orderId, 1, 2, 2490]);
  db.run("COMMIT");
  ok("checkout: order_date = วันนี้ และ stock ลดลง 2", query(db, "SELECT order_date = date('now','localtime') AS today FROM orders WHERE order_id = ?", [orderId])[0].today === 1 && query(db, "SELECT stock FROM products WHERE product_id = 1")[0].stock === stockBefore - 2);
  ok("v_order_totals เห็นออเดอร์ใหม่ยอด 4,980", Math.abs(query(db, Q.orderById.sql, [orderId])[0].total - 4980) < 0.01);

  // ROLLBACK เมื่อสต็อกไม่พอ
  const ordersBefore = query(db, "SELECT COUNT(*) AS n FROM orders")[0].n;
  db.run("BEGIN");
  run(db, Q.checkoutOrderInsert.sql, [me.customer_id, null]);
  const changed = run(db, Q.checkoutStockDeduct.sql, [999, 1, 999]);
  db.run("ROLLBACK");
  ok("ROLLBACK: สต็อกไม่พอ → UPDATE 0 แถว และ orders ไม่เพิ่ม", changed === 0 && query(db, "SELECT COUNT(*) AS n FROM orders")[0].n === ordersBefore);

  // Tier recalc: เพิ่มยอดให้ถึง Silver
  run(db, Q.tierRecalc.sql, [me.customer_id, me.customer_id]);
  ok("tierRecalc: ยอด 4,980 ยังเป็น Bronze", query(db, "SELECT member_tier FROM customers WHERE customer_id = ?", [me.customer_id])[0].member_tier === "Bronze");
  db.run("BEGIN");
  run(db, Q.checkoutOrderInsert.sql, [me.customer_id, "Credit Card"]);
  const o2 = query(db, "SELECT last_insert_rowid() AS id")[0].id;
  run(db, Q.checkoutStockDeduct.sql, [1, 3, 1]);
  run(db, Q.checkoutItemInsert.sql, [o2, 3, 1, 7990]);
  db.run("COMMIT");
  run(db, Q.tierRecalc.sql, [me.customer_id, me.customer_id]);
  ok("tierRecalc: ยอดสะสม 12,970 → Silver (อัปเกรดอย่างเดียว)", query(db, "SELECT member_tier FROM customers WHERE customer_id = ?", [me.customer_id])[0].member_tier === "Silver");
  run(db, "UPDATE customers SET member_tier = 'Platinum' WHERE customer_id = ?", [me.customer_id]);
  run(db, Q.tierRecalc.sql, [me.customer_id, me.customer_id]);
  ok("tierRecalc: ไม่ลดระดับ Platinum ลง", query(db, "SELECT member_tier FROM customers WHERE customer_id = ?", [me.customer_id])[0].member_tier === "Platinum");

  // Pay / Cancel + restock
  ok("payOrder: ออเดอร์ที่จ่ายแล้วอัปเดต 0 แถว", run(db, Q.payOrder.sql, ["TrueMoney", orderId, me.customer_id]) === 0);
  const stockMid = query(db, "SELECT stock FROM products WHERE product_id = 1")[0].stock;
  db.run("BEGIN");
  ok("cancelOrder: pending → cancelled 1 แถว", run(db, Q.cancelOrder.sql, [orderId]) === 1);
  run(db, Q.restockOrder.sql, [orderId, orderId]);
  db.run("COMMIT");
  ok("restockOrder: คืนสต็อก +2", query(db, "SELECT stock FROM products WHERE product_id = 1")[0].stock === stockMid + 2);
  ok("cancelOrder ซ้ำ: 0 แถว (ไม่ใช่ pending แล้ว)", run(db, Q.cancelOrder.sql, [orderId]) === 0);

  // Review + CHECK + rating refresh
  const before = query(db, "SELECT rating FROM products WHERE product_id = 36")[0].rating;
  run(db, Q.reviewInsert.sql, [36, me.customer_id, 4, "   "]);
  run(db, Q.productRatingRefresh.sql, [36, 36]);
  const after = query(db, "SELECT rating FROM products WHERE product_id = 36")[0].rating;
  ok("reviewInsert: comment ว่าง → NULL และ rating สินค้าใหม่ NULL → 4.0", before === null && after === 4 && query(db, "SELECT comment FROM reviews WHERE product_id = 36 AND customer_id = ?", [me.customer_id])[0].comment === null);
  let checkErr = "";
  try { run(db, Q.reviewInsert.sql, [36, me.customer_id, 9, "x"]); } catch (e) { checkErr = e.message; }
  ok("CHECK(rating 1-5) ปฏิเสธ rating = 9", /CHECK constraint failed/i.test(checkErr), checkErr);

  // Order status state machine
  ok("orderStatusUpdate: shipped → completed จาก pending = 0 แถว", run(db, Q.orderStatusUpdate.sql, ["completed", o2, "shipped"]) === 0);
  ok("orderStatusUpdate: pending → shipped = 1 แถว", run(db, Q.orderStatusUpdate.sql, ["shipped", o2, "pending"]) === 1);

  // Products CRUD + FK
  run(db, Q.productInsert.sql, ["Test Gadget", 2, 999, 5]);
  const newId = query(db, "SELECT last_insert_rowid() AS id")[0].id;
  ok("productInsert: rating เป็น NULL", query(db, "SELECT rating FROM products WHERE product_id = ?", [newId])[0].rating === null);
  run(db, Q.productUpdate.sql, ["Test Gadget v2", 2, 1099, 7, newId]);
  run(db, Q.stockAdjust.sql, [-100, newId]);
  ok("stockAdjust: ไม่ติดลบ (MAX(0, ...))", query(db, "SELECT stock FROM products WHERE product_id = ?", [newId])[0].stock === 0);
  ok("productDelete: สินค้าใหม่ลบได้", run(db, Q.productDelete.sql, [newId]) === 1);
  let fkErr = "";
  try { run(db, Q.productDelete.sql, [1]); } catch (e) { fkErr = e.message; }
  ok("productDelete: สินค้าที่มีออเดอร์ติด FOREIGN KEY", /FOREIGN KEY constraint failed/i.test(fkErr), fkErr);
  let fkErr2 = "";
  try { run(db, Q.productInsert.sql, ["Bad Cat", 999, 10, 1]); } catch (e) { fkErr2 = e.message; }
  ok("productInsert: category_id ไม่มีจริงติด FK", /FOREIGN KEY constraint failed/i.test(fkErr2), fkErr2);
  let uqErr = "";
  try { run(db, Q.categoryInsert.sql, ["Accessories", "dup"]); } catch (e) { uqErr = e.message; }
  ok("categoryInsert: ชื่อซ้ำติด UNIQUE", /UNIQUE constraint failed/i.test(uqErr), uqErr);

  // EXPLAIN ใช้ index
  const plan = query(db, "EXPLAIN QUERY PLAN " + Q.productReviews.sql, [1]).map((r) => r.detail).join(" | ");
  ok("EXPLAIN: productReviews ใช้ idx_reviews_product", /idx_reviews_product/.test(plan), plan);

  console.log(`\nผ่าน ${pass} / ${pass + fail}${fail ? `  ❌ ล้มเหลว ${fail}` : "  ✅"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
