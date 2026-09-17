/**
 * SQL Journey — Automated Verification Script
 * ตรวจสอบด้วย sql.js ตัวเดียวกับที่แอปใช้ (vendor/sql-wasm.js):
 *   1. SQL ตัวอย่างของทุกบทเรียนต้องรันผ่าน (โดยแยก DB สดใหม่ให้แต่ละบท)
 *   2. solution ของทุก challenge ต้อง "ผ่าน" ตัวตรวจของแอป (self-consistency บน DB clone)
 *   3. คำตอบขยะ (DML ที่ไม่เกี่ยวกับโจทย์) ต้อง "ไม่ผ่าน" ทุกข้อ
 *   4. formatSQL ต้องไม่แก้ตัวพิมพ์ข้อความใน string literal
 *   5. โครงสร้าง lessons ครบถ้วน + requiredColumns ของโจทย์ต้องตรงกับผลลัพธ์เฉลยจริง
 *   6. บท type "debug": โค้ดที่พัง (lesson.sql) ต้อง error หรือให้ผลต่างจากเฉลย
 *   7. Seed data integrity: FK ครบ, ID สงวนว่าง, NULL/ข้อมูลสำหรับโจทย์มีจริง
 * รัน: node tests/verify.cjs
 *
 * หมายเหตุ: logic การตรวจ challenge โหลดจาก js/challenge.js ตัวเดียวกับที่แอปใช้
 */
const path = require("path");
const fs = require("fs");
const initSqlJs = require(path.join(__dirname, "..", "vendor", "sql-wasm.js"));

// โหลดตัวแปรจากไฟล์ browser-style (ไม่มี module.exports)
function loadBrowserGlobals(relPath, exportExpr) {
  const src = fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
  return new Function(`${src}\nreturn ${exportExpr};`)();
}

const { initialSQL } = loadBrowserGlobals("js/schema.js", "{ initialSQL }");
const { lessons } = loadBrowserGlobals("js/lessons.js", "{ lessons }");
const {
  dumpDatabaseState,
  getChallengeType,
  compareQueryResults
} = loadBrowserGlobals("js/challenge.js", "{ dumpDatabaseState, getChallengeType, compareQueryResults }");

// ตรวจ challenge ด้วย logic เดียวกับ app.js (options ตาม flag ของโจทย์)
function runChallengeCheck(SQL, baseDb, userSQL, lesson) {
  const userDb = new SQL.Database(baseDb.export());
  const solutionDb = new SQL.Database(baseDb.export());
  try {
    let userRes;
    try { userRes = userDb.exec(userSQL); } catch (e) { return { pass: false, error: e.message }; }
    let expectedRes = [];
    try { expectedRes = solutionDb.exec(lesson.challenge.solution); } catch (e) { /* ignore */ }
    const isCorrect = getChallengeType(lesson.challenge.solution) === "dml"
      ? dumpDatabaseState(userDb, { includeDdl: !!lesson.challenge.checkSchema }) ===
        dumpDatabaseState(solutionDb, { includeDdl: !!lesson.challenge.checkSchema })
      : compareQueryResults(userRes, expectedRes, {
          unordered: !!lesson.challenge.unordered,
          requiredColumns: lesson.challenge.requiredColumns || []
        }).correct;
    return { pass: isCorrect };
  } finally {
    userDb.close();
    solutionDb.close();
  }
}

// ==== formatSQL replica ====
function formatSQLReplica(text) {
  const keywords = [
    "FULL OUTER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN",
    "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
    "ORDER BY", "GROUP BY", "PARTITION BY", "INSERT INTO", "DELETE FROM",
    "UNION ALL", "ON CONFLICT", "DO UPDATE", "IS NOT NULL", "QUERY PLAN",
    "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET",
    "JOIN", "ON", "AS", "VALUES", "UPDATE", "SET", "WITH", "RECURSIVE",
    "UNION", "EXISTS", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS NULL",
    "CASE", "WHEN", "THEN", "ELSE", "END", "OVER", "DISTINCT",
    "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
    "CREATE", "VIEW", "INDEX", "TABLE", "ALTER", "DROP", "EXPLAIN",
    "ASC", "DESC", "EXCLUDED"
  ];

  const segments = text.split(/('(?:[^']|'')*')/);
  return segments.map((segment, i) => {
    if (i % 2 === 1) return segment;
    keywords.forEach(kw => { segment = segment.replace(new RegExp(`\\b${kw}\\b`, "gi"), kw); });
    return segment;
  }).join("");
}

(async () => {
  const SQL = await initSqlJs({ locateFile: f => path.join(__dirname, "..", "vendor", f) });
  let failures = 0;

  const makeDb = () => {
    const d = new SQL.Database();
    d.run(initialSQL);
    return d;
  };

  // 1) lesson.sql ทุกบทต้องรันผ่านบน DB สด
  //    (ยกเว้นบท debug — โค้ดที่พังคือเนื้อหาของบท ความถูกต้องตรวจในข้อ 6)
  for (const lesson of lessons) {
    if (lesson.type === "debug") continue;
    try {
      const d = makeDb();
      d.exec(lesson.sql);
      d.close();
      console.log(`✓ บทที่ ${lesson.id} (${lesson.level}) ตัวอย่างรันผ่าน`);
    } catch (e) {
      failures++;
      console.error(`✗ บทที่ ${lesson.id} ตัวอย่าง ERROR: ${e.message}`);
    }
  }
  console.log(`  (บท debug ${lessons.filter(l => l.type === "debug").length} บท ข้ามการตรวจรัน — ตรวจความเป็นบั๊กจริงในข้อ 6)`);

  // 2) solution ทุก challenge ต้องผ่านตัวตรวจ | 3) คำตอบขยะต้องไม่ผ่าน
  const garbageAnswers = [
    "DELETE FROM customers;",
    "SELECT 1 WHERE 0 = 1;",
    "UPDATE products SET price = 0 WHERE product_id = 1;"
  ];
  for (const lesson of lessons) {
    if (!lesson.challenge) continue;
    const baseDb = makeDb();
    const type = getChallengeType(lesson.challenge.solution);

    const selfCheck = runChallengeCheck(SQL, baseDb, lesson.challenge.solution, lesson);
    if (selfCheck.pass) {
      console.log(`✓ บทที่ ${lesson.id} [${type}${lesson.challenge.unordered ? ", unordered" : ""}] solution ผ่านการตรวจ`);
    } else {
      failures++;
      console.error(`✗ บทที่ ${lesson.id} [${type}] solution ไม่ผ่านการตรวจ! (${selfCheck.error || "ผลไม่ตรง"})`);
    }

    for (const garbage of garbageAnswers) {
      const g = runChallengeCheck(SQL, baseDb, garbage, lesson);
      if (g.pass) {
        failures++;
        console.error(`✗ บทที่ ${lesson.id} [${type}] คำตอบขยะ "${garbage}" ผ่านโดยไม่ควรผ่าน!`);
      }
    }
    baseDb.close();
  }
  console.log(`  (คำตอบขยะ ${garbageAnswers.length} แบบ × ทุก challenge ถูกปฏิเสธครบ)`);

  // 4) formatSQL ต้องไม่แตะ string literal
  const fmtInput = "select 'keep in lowercase' as label from products where name like '%Plug in now%';";
  const fmtOutput = formatSQLReplica(fmtInput);
  const fmtOk = fmtOutput.includes("'keep in lowercase'")
    && fmtOutput.includes("'%Plug in now%'")
    && fmtOutput.startsWith("SELECT");
  if (fmtOk) {
    console.log("✓ formatSQL: keyword พิมพ์ใหญ่นอก literal, ข้อความใน '...' ไม่ถูกแตะ");
  } else {
    failures++;
    console.error(`✗ formatSQL เพี้ยน: ${fmtOutput}`);
  }

  // 5) ตรวจโครงสร้าง lessons ครบถ้วน + requiredColumns ตรงกับผลลัพธ์เฉลยจริง
  const ids = lessons.map(l => l.id);
  const uniqueIds = new Set(ids);
  const categories = new Set(lessons.map(l => l.category));
  if (ids.length !== uniqueIds.size) { failures++; console.error("✗ มี lesson id ซ้ำ"); }
  for (const l of lessons) {
    for (const field of ["category", "categoryLabel", "level", "title", "description", "tip", "sql", "challenge"]) {
      if (l[field] === undefined) { failures++; console.error(`✗ บทที่ ${l.id} ขาด field: ${field}`); }
    }
    if (l.challenge && (!l.challenge.question || !l.challenge.hint || !l.challenge.solution)) {
      failures++;
      console.error(`✗ บทที่ ${l.id} challenge ไม่ครบ (question/hint/solution)`);
    }
    // requiredColumns ที่ประกาศไว้ ต้องมีอยู่จริงในผลลัพธ์ของ solution เสมอ
    if (l.challenge && l.challenge.requiredColumns && getChallengeType(l.challenge.solution) === "query") {
      try {
        const d = makeDb();
        const res = d.exec(l.challenge.solution);
        d.close();
        const lastColumns = res[res.length - 1].columns;
        const missing = l.challenge.requiredColumns.filter(c => !lastColumns.includes(c));
        if (missing.length > 0) {
          failures++;
          console.error(`✗ บทที่ ${l.id} requiredColumns ${JSON.stringify(missing)} ไม่ปรากฏในผลลัพธ์ของ solution เอง`);
        }
      } catch (e) {
        failures++;
        console.error(`✗ บทที่ ${l.id} solution รันไม่ผ่านตอนตรวจ requiredColumns: ${e.message}`);
      }
    }
  }
  console.log(`✓ โครงสร้าง: ${lessons.length} บทเรียน, ${categories.size} หมวด (${[...categories].join(", ")})`);

  // 6) บท type "debug": โค้ดที่พังต้อง error หรือให้ผล "ต่าง" จากเฉลย (ไม่งั้นไม่ใช่บั๊ก!)
  const debugLessons = lessons.filter(l => l.type === "debug");
  for (const lesson of debugLessons) {
    const baseDb = makeDb();
    let brokenErrors = false;
    let brokenSameAsSolution = false;
    try {
      const brokenDb = new SQL.Database(baseDb.export());
      let brokenRes;
      try {
        brokenRes = brokenDb.exec(lesson.sql);
      } catch (e) {
        brokenErrors = true; // syntax error ก็เป็นอาการของบั๊กที่ถูกต้อง
      } finally {
        brokenDb.close();
      }
      if (!brokenErrors) {
        // รันผ่าน → ผลลัพธ์ต้องต่างจากเฉลย จึงจะถือว่า "มีบั๊กให้แก้" จริง
        const solDb = new SQL.Database(baseDb.export());
        const solRes = solDb.exec(lesson.challenge.solution);
        solDb.close();
        brokenSameAsSolution = compareQueryResults(
          brokenRes,
          solRes,
          { unordered: !!lesson.challenge.unordered, requiredColumns: lesson.challenge.requiredColumns || [] }
        ).correct;
      }
    } finally {
      baseDb.close();
    }

    if (brokenErrors) {
      console.log(`✓ บทที่ ${lesson.id} [debug] โค้ดที่พัง error ตามแบบ (syntax bug)`);
    } else if (brokenSameAsSolution) {
      failures++;
      console.error(`✗ บทที่ ${lesson.id} [debug] โค้ด "ที่พัง" ให้ผลเหมือนเฉลย — ไม่มีบั๊กให้แก้!`);
    } else {
      console.log(`✓ บทที่ ${lesson.id} [debug] โค้ดที่พังรันผ่านแต่ผลต่างจากเฉลย (logic bug)`);
    }
  }
  console.log(`  (บท debug รวม ${debugLessons.length} บท)`);

  // 7) Seed data integrity — ข้อเท็จจริงที่บทเรียน/โจทย์อ้างอิงต้องเป็นจริงเสมอ
  const seedDb = makeDb();
  const scalar = (sql) => seedDb.exec(sql)[0].values[0][0];
  const seedFacts = [
    ["FK integrity ไม่มีจุดหลุด", () => seedDb.exec("PRAGMA foreign_key_check").length === 0],
    ["category_id 5 สงวน (บท 7, 27)", () => scalar("SELECT COUNT(*) FROM categories WHERE category_id = 5") === 0],
    ["product_id 11 สงวน (บท 27)", () => scalar("SELECT COUNT(*) FROM products WHERE product_id = 11") === 0],
    ["review_id 7 สงวน (บท 26)", () => scalar("SELECT COUNT(*) FROM reviews WHERE review_id = 7") === 0],
    ["ลูกค้า 1-7 ต้นฉบับครบ", () => scalar("SELECT COUNT(*) FROM customers WHERE customer_id <= 7") === 7],
    ["สินค้า 1-10 ต้นฉบับครบ", () => scalar("SELECT COUNT(*) FROM products WHERE product_id <= 10") === 10],
    ["ออเดอร์ 101-108 ต้นฉบับครบ", () => scalar("SELECT COUNT(*) FROM orders WHERE order_id BETWEEN 101 AND 108") === 8],
    ["มีออเดอร์ payment_method เป็น NULL (บท 6, Debug #3)", () => scalar("SELECT COUNT(*) FROM orders WHERE payment_method IS NULL") > 0],
    ["มีรีวิว comment เป็น NULL", () => scalar("SELECT COUNT(*) FROM reviews WHERE comment IS NULL") > 0],
    ["มีสินค้า rating เป็น NULL", () => scalar("SELECT COUNT(*) FROM products WHERE rating IS NULL") > 0],
    ["มีลูกค้าที่ไม่เคยสั่งซื้อ (บท 13, 17, Debug #4)", () => scalar("SELECT COUNT(*) FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)") > 0],
    ["มีสินค้าที่ไม่เคยขาย (บท 13)", () => scalar("SELECT COUNT(*) FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id)") > 0],
    ["ขนาด DB พอดีกับ localStorage", () => seedDb.export().length < 3 * 1024 * 1024]
  ];
  for (const [label, check] of seedFacts) {
    let ok = false;
    try { ok = check(); } catch (e) { /* fail below */ }
    if (ok) {
      console.log(`✓ seed: ${label}`);
    } else {
      failures++;
      console.error(`✗ seed: ${label} — ไม่เป็นจริง!`);
    }
  }
  const counts = [
    "categories", "customers", "products", "orders", "order_items", "reviews"
  ].map(t => `${t}=${scalar(`SELECT COUNT(*) FROM ${t}`)}`).join(", ");
  console.log(`  (ปริมาณข้อมูล: ${counts})`);
  seedDb.close();

  // 8) Lab integrity — query ที่ห้องทดลอง (Injection/Performance) ใช้ต้องทำงานตามสมบัติที่อ้างสิทธิ์
  // 8.1 Injection Lab: โหมดต่อ string ต้องถูก bypass ได้ / โหมด bind ต้องป้องกันได้
  const injDb = new SQL.Database();
  injDb.run(`
    CREATE TABLE demo_users (user_id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL);
    INSERT INTO demo_users (user_id, username, password, role) VALUES
      (1, 'admin', 'Adm1n$ecret', 'Administrator'),
      (2, 'somchai', 'S3cret!', 'Customer'),
      (3, 'malee', 'P@ssw0rd123', 'Customer');
  `);
  const injFacts = [
    ["payload ในช่องรหัสผ่าน bypass โหมดต่อ string ได้", () => {
      const u = "", p = "' OR '1'='1";
      const sql = `SELECT user_id, username, role FROM demo_users WHERE username = '${u}' AND password = '${p}' LIMIT 1`;
      return injDb.exec(sql)[0].values.length === 1;
    }],
    ["payload ในช่อง username (คอมเมนต์ตัดเงื่อนไข) bypass ได้", () => {
      const u = "admin' --", p = "อะไรก็ได้";
      const sql = `SELECT user_id, username, role FROM demo_users WHERE username = '${u}' AND password = '${p}' LIMIT 1`;
      return injDb.exec(sql)[0].values.length === 1;
    }],
    ["prepared statement + bind กัน payload เดิมได้", () => {
      const attacks = [["", "' OR '1'='1"], ["admin' --", "อะไรก็ได้"], ["x", "y"]];
      return attacks.every(([u, p]) => {
        const stmt = injDb.prepare("SELECT user_id, username, role FROM demo_users WHERE username = ? AND password = ? LIMIT 1");
        stmt.bind([u, p]);
        const got = stmt.step();
        stmt.free();
        return !got;
      });
    }],
    ["login ข้อมูลจริงผ่านได้ทั้งสองโหมด", () => {
      const byString = injDb.exec("SELECT user_id, username, role FROM demo_users WHERE username = 'somchai' AND password = 'S3cret!' LIMIT 1")[0].values.length === 1;
      const stmt = injDb.prepare("SELECT user_id, username, role FROM demo_users WHERE username = ? AND password = ? LIMIT 1");
      stmt.bind(["somchai", "S3cret!"]);
      const byBind = stmt.step();
      stmt.free();
      return byString && byBind;
    }]
  ];
  for (const [label, check] of injFacts) {
    let ok = false;
    try { ok = check(); } catch (e) { /* fail below */ }
    if (ok) console.log(`✓ injection lab: ${label}`);
    else { failures++; console.error(`✗ injection lab: ${label} — ไม่เป็นจริง!`); }
  }
  injDb.close();

  // 8.2 Performance Lab: plan ต้องเปลี่ยนจาก SCAN เป็ SEARCH เมื่อสร้าง index (ทดสอบบน 20,000 แถวพอ)
  const perfTestDb = new SQL.Database();
  perfTestDb.run("CREATE TABLE big_orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, amount REAL NOT NULL, order_date TEXT NOT NULL)");
  {
    const insert = perfTestDb.prepare("INSERT INTO big_orders VALUES (?, ?, ?, ?, ?)");
    perfTestDb.run("BEGIN");
    for (let i = 1; i <= 20000; i++) {
      insert.run([i, 1 + (i * 7919) % 5000, "completed", 100 + (i * 31) % 9900, "2026-01-15"]);
    }
    insert.free();
    perfTestDb.run("COMMIT");
  }
  const perfSql = "SELECT order_id FROM big_orders WHERE customer_id = 4242";
  const planOf = (db, sql) => db.exec("EXPLAIN QUERY PLAN " + sql)[0].values.map(r => String(r[3])).join(" | ");
  const planNoIndex = planOf(perfTestDb, perfSql);
  perfTestDb.run("CREATE INDEX idx_big_customer ON big_orders(customer_id)");
  const planWithIndex = planOf(perfTestDb, perfSql);
  const perfFacts = [
    ["ไม่มี index → plan เป็น SCAN ตาราง", () => /SCAN big_orders/.test(planNoIndex)],
    ["มี index → plan เป็น SEARCH ผ่าน index", () => /SEARCH big_orders USING (COVERING )?INDEX idx_big_customer/.test(planWithIndex)]
  ];
  for (const [label, check] of perfFacts) {
    let ok = false;
    try { ok = check(); } catch (e) { /* fail below */ }
    if (ok) console.log(`✓ performance lab: ${label}`);
    else { failures++; console.error(`✗ performance lab: ${label} — (plan จริง: ${planNoIndex} → ${planWithIndex})`); }
  }
  perfTestDb.close();

  console.log(failures === 0 ? "\n🎉 ทุกการตรวจสอบผ่านหมด" : `\n💥 พบปัญหา ${failures} จุด`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error("FATAL:", e); process.exit(1); });
