/**
 * ShopNova Thailand — Database Layer (SQLite WASM ผ่าน sql.js)
 *
 * - ใช้ schema + seed ชุดเดียวกับ SQL Journey (../js/schema.js → initialSQL)
 * - ทุก query รันผ่าน DB.query / DB.run ซึ่ง "bind parameter" เสมอ (บทที่ 21: SQL Injection)
 * - DB.transaction ห่อ BEGIN / COMMIT / ROLLBACK (บทที่ 22: Transactions)
 * - บันทึกสถานะฐานข้อมูลลง localStorage อัตโนมัติ (debounce)
 * - เก็บ log ทุกคำสั่งไว้ให้ SQL Inspector แสดง พร้อมชื่อบทเรียนที่เกี่ยวข้อง
 */
const DB = (() => {
  const STORAGE_KEY = "shopNovaDatabase_v1";
  const MAX_LOG = 150;

  let SQL = null;
  let db = null;
  let saveTimer = null;
  const log = [];
  const logListeners = new Set();

  // ---------- Persistence ----------
  function bytesToBase64(bytes) {
    const CHUNK = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }

  function save() {
    if (!db) return;
    try {
      localStorage.setItem(STORAGE_KEY, bytesToBase64(db.export()));
    } catch (e) {
      console.warn("บันทึกฐานข้อมูลลง localStorage ไม่สำเร็จ", e);
    } finally {
      // db.export() ของ sql.js ปิดแล้วเปิด connection ใหม่ → PRAGMA ทุกตัวถูกรีเซ็ต ต้องเปิด FK ซ้ำ
      db.run("PRAGMA foreign_keys = ON;");
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function loadSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const binary = atob(saved);
      return new SQL.Database(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    } catch (e) {
      console.warn("โหลดฐานข้อมูลจาก localStorage ไม่สำเร็จ", e);
      return null;
    }
  }

  // ---------- Schema ส่วนขยายของร้าน (บทที่ 24: Views & Indexes) ----------
  // ตารางหลัก 6 ตารางมาจากบทเรียน — ร้านเพิ่มแค่ VIEW / INDEX เพื่อให้ query อ่านง่ายและเร็วขึ้น
  const APP_SCHEMA = `
    CREATE VIEW IF NOT EXISTS v_order_totals AS
      SELECT o.order_id, o.customer_id, o.order_date, o.status, o.payment_method,
             COUNT(oi.order_item_id)              AS item_count,
             COALESCE(SUM(oi.quantity), 0)        AS total_qty,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY o.order_id;

    CREATE VIEW IF NOT EXISTS v_product_stats AS
      SELECT p.product_id,
             COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity END), 0) AS sold_qty,
             COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity * oi.unit_price END), 0) AS revenue,
             (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.product_id) AS review_count,
             (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.product_id) AS avg_review
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = oi.order_id
      GROUP BY p.product_id;

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer   ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_date       ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_items_order       ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_items_product     ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product   ON reviews(product_id);
  `;

  function applyAppSchema() {
    // PRAGMA ต้องตั้งทุกครั้งที่เปิด connection — เปิดการบังคับ FOREIGN KEY (บทที่ 23: Constraints)
    db.run("PRAGMA foreign_keys = ON;");
    db.run(APP_SCHEMA);
  }

  async function init() {
    SQL = await initSqlJs({ locateFile: (file) => `../vendor/${file}` });
    db = loadSaved();
    if (!db) {
      db = new SQL.Database();
      db.run(initialSQL);
      applyAppSchema();
      save();
    } else {
      applyAppSchema();
    }
    return db;
  }

  function reset() {
    db = new SQL.Database();
    db.run(initialSQL);
    applyAppSchema();
    save();
    log.length = 0;
    notifyLog();
  }

  // ---------- Log สำหรับ SQL Inspector ----------
  function notifyLog() {
    logListeners.forEach((fn) => fn(log));
  }

  function pushLog(entry) {
    if (entry.silent) return;
    log.unshift(entry);
    if (log.length > MAX_LOG) log.length = MAX_LOG;
    notifyLog();
  }

  function onLog(fn) {
    logListeners.add(fn);
    return () => logListeners.delete(fn);
  }

  // ---------- Query helpers ----------
  /**
   * รัน SELECT แล้วคืน array ของ object — ค่า parameter ถูก bind ผ่าน sql.js
   * (ไม่เคยต่อ string เข้ากับ SQL → ปลอดภัยจาก SQL Injection)
   */
  function query(sql, params = [], meta = {}) {
    const t0 = performance.now();
    const stmt = db.prepare(sql);
    const rows = [];
    try {
      stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    pushLog({ kind: "query", sql, params, rows: rows.length, ms: performance.now() - t0, ...meta, at: Date.now() });
    return rows;
  }

  function one(sql, params = [], meta = {}) {
    return query(sql, params, meta)[0] || null;
  }

  /** รัน DML/DDL แล้วคืนจำนวนแถวที่เปลี่ยน */
  function run(sql, params = [], meta = {}) {
    const t0 = performance.now();
    db.run(sql, params);
    const changes = db.getRowsModified();
    pushLog({ kind: "run", sql, params, rows: changes, ms: performance.now() - t0, ...meta, at: Date.now() });
    scheduleSave();
    return changes;
  }

  /**
   * ห่อหลายคำสั่งไว้ใน Transaction — ถ้า fn โยน error จะ ROLLBACK ทั้งหมด
   * (บทที่ 22: BEGIN / COMMIT / ROLLBACK)
   */
  function transaction(fn, meta = {}) {
    const t0 = performance.now();
    db.run("BEGIN;");
    pushLog({ kind: "tx", sql: "BEGIN;", params: [], rows: 0, ms: 0, ...meta, at: Date.now() });
    try {
      const result = fn();
      db.run("COMMIT;");
      pushLog({ kind: "tx", sql: "COMMIT;", params: [], rows: 0, ms: performance.now() - t0, ...meta, at: Date.now() });
      scheduleSave();
      return result;
    } catch (err) {
      db.run("ROLLBACK;");
      pushLog({ kind: "tx-fail", sql: "ROLLBACK;  -- " + err.message, params: [], rows: 0, ms: performance.now() - t0, ...meta, at: Date.now() });
      throw err;
    }
  }

  /** EXPLAIN QUERY PLAN สำหรับ SQL Inspector (บทที่ 24) */
  function explain(sql, params = []) {
    const stmt = db.prepare("EXPLAIN QUERY PLAN " + sql);
    const rows = [];
    try {
      stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    return rows;
  }

  function lastInsertId() {
    return one("SELECT last_insert_rowid() AS id", [], { silent: true }).id;
  }

  return { init, reset, save, query, one, run, transaction, explain, lastInsertId, onLog, getLog: () => log, clearLog: () => { log.length = 0; notifyLog(); } };
})();
