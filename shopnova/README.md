# ShopNova Thailand 🛍️

**ร้านค้าออนไลน์ที่ทำงานจริง 100% บนเบราว์เซอร์** — สร้างจากฐานข้อมูล ShopNova ชุดเดียวกับบทเรียน [SQL Journey](../README.md) ทุกปุ่มที่กดคือ SQL จริงจากบทเรียน และดูคำสั่งได้ทันทีผ่าน **SQL Inspector**

| | |
|---|---|
| Stack | HTML + Vanilla CSS + Vanilla JS (ไม่มี framework, ไม่ต้อง build) |
| Engine | SQLite 3 ผ่าน [sql.js](https://sql.js.org/) (WASM) — ใช้ `../vendor/` ร่วมกับ SQL Journey |
| ข้อมูล | `../js/schema.js` ตัวเดียวกับบทเรียน (48 ลูกค้า / 39 สินค้า / 148 ออเดอร์ / 66 รีวิว) |
| รูปภาพ | Unsplash (สินค้า/หมวดหมู่) · DiceBear (avatar) · มี placeholder เมื่อออฟไลน์ |
| Persist | สถานะฐานข้อมูล ตะกร้า และการล็อกอินเก็บใน `localStorage` — รีเซ็ตได้จาก footer |

เปิดใช้งาน: รัน static server ที่โฟลเดอร์ `Interactive_SQL/` แล้วเปิด `http://localhost:8080/shopnova/` (ต้องผ่าน HTTP เพื่อโหลด WASM)

---

## ฟีเจอร์ ↔ บทเรียน

### หน้าร้าน (ลูกค้า)

| ฟีเจอร์ | SQL ที่ใช้ | บทเรียน |
|---|---|---|
| หน้าแรก: สถิติร้าน, หมวดหมู่, ขายดี, สินค้าใหม่, คะแนนสูงสุด | Scalar subquery · `LEFT JOIN + GROUP BY` · JOIN 4 ตาราง + `LIMIT` · `rating IS NULL` | 6, 10, 13, 17, 40 |
| ค้นหา + คำแนะนำขณะพิมพ์ | `LIKE ?` bind เป็น parameter — ลองพิมพ์ `' OR 1=1 --` ได้เลย ไม่มีผล | 4, 21 |
| แคตตาล็อก: กรองหมวด/ราคา/คะแนน/สต็อก, เรียง, แบ่งหน้า | `WHERE` แบบไดนามิก · `ORDER BY` จาก whitelist · `LIMIT ? OFFSET ?` · correlated subquery "ถูกสุดในหมวด" | 2, 3, 5, 17 |
| หน้าสินค้า: อันดับขายดีในหมวด, สรุปดาว, รีวิว, ผู้ซื้อจริง, ซื้อคู่กัน, สินค้าเกี่ยวข้อง | `DENSE_RANK() OVER (PARTITION BY)` · `SUM(CASE WHEN rating = n)` · `EXISTS` · **SELF JOIN** `order_items` · subquery | 17, 19, 25, 26, 28 |
| เข้าสู่ระบบ / สมัครสมาชิก | `WHERE email = ?` · `INSERT ... ON CONFLICT(email) DO UPDATE` | 2, 27 |
| ตะกร้า | `WHERE product_id IN (?, ?, ...)` ตรวจสต็อกก่อนใส่ | 3 |
| **ชำระเงิน** (ส่วนลดตามระดับสมาชิก) | `CASE member_tier WHEN ...` · **Transaction**: `BEGIN → INSERT orders → UPDATE stock (WHERE stock >= ?) → INSERT order_items → COMMIT` — สต็อกไม่พอหรือติ๊ก "จำลองความล้มเหลว" จะ `ROLLBACK` ทั้งหมด | 7, 8, 15, 16, 22 |
| อัปเกรดระดับสมาชิกอัตโนมัติ | `WITH ... UPDATE customers SET member_tier = CASE ...` (อัปเกรดอย่างเดียว ไม่ลด) | 16, 18 |
| บัญชีของฉัน: อันดับยอดซื้อ, วันตั้งแต่ซื้อล่าสุด, ประวัติออเดอร์ | CTE + `RANK() OVER ()` · `COUNT(DISTINCT)` กัน fan-out · `julianday()` · VIEW `v_order_totals` | 15, 18, 19, 24, 36 |
| ชำระออเดอร์ค้าง / ยกเลิกออเดอร์ (คืนสต็อก) | `UPDATE ... WHERE payment_method IS NULL` · Transaction + correlated subquery ใน `UPDATE` | 6, 8, 17, 22 |
| เขียนรีวิว | `INSERT` + `CHECK(rating 1-5)` · `NULLIF(TRIM(?), '')` · `UPDATE products SET rating = (SELECT AVG ...)` | 7, 8, 15, 23 |

### แดชบอร์ดผู้ดูแล (`#/admin`)

| ส่วน | SQL ที่ใช้ | บทเรียน |
|---|---|---|
| KPI + สถานะออเดอร์ | Scalar subqueries · `SUM(CASE WHEN status = ...)` Pivot | 10, 17, 28 |
| รายได้รายเดือนแยกหมวด (stacked bar) | **Recursive CTE** สร้างปฏิทินเดือน → `LEFT JOIN` ยอดขาย (เดือนที่ 0 ไม่หาย) · Pivot หมวด | 28, 29, 41 |
| ยอดสะสม + MoM % + เดือนทอง | `SUM() OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING)` · `LAG()` · `RANK()` | 20, 43, 46, 47 |
| Top-10 สินค้า / สัดส่วนหมวด | JOIN 4 ตาราง + `GROUP BY` + `LIMIT` · `SUM() OVER ()` คิด % | 40, 45 |
| Heatmap ระดับสมาชิก × หมวด | **CROSS JOIN** สร้างทุกช่อง + `LEFT JOIN` | 13, 26 |
| ช่องทางชำระเงิน | `COALESCE(payment_method, 'ยังไม่ชำระ')` | 6 |
| RFM Segmentation | CTE + `NTILE(3)` ×3 + `CASE` → Champion / Loyal / New / At Risk / Hibernating | 30, 31 |
| MVP ประจำเมือง | `ROW_NUMBER() OVER (PARTITION BY city ORDER BY total DESC)` | 48 |
| ลูกค้ากำลังหลุดมือ / ไม่เคยสั่งซื้อ | `HAVING julianday('now') - MAX(order_date) > 90` · `LEFT JOIN ... IS NULL` | 13, 49 |
| กิจกรรมล่าสุด | `UNION ALL` (orders ∪ reviews) + ต่อข้อความด้วย `\|\|` | 15, 25 |
| จัดการออเดอร์ | `UPDATE orders SET status = ? WHERE status = ?` (state machine) · ยกเลิก = Transaction คืนสต็อก | 8, 22 |
| จัดการสินค้า / หมวดหมู่ | `INSERT` / `UPDATE` / `DELETE` · **`PRAGMA foreign_keys = ON`** → ลบสินค้าที่มีออเดอร์จะติด FK · `UNIQUE` ชื่อหมวด · `RANK() OVER (PARTITION BY category)` | 7, 8, 9, 23, 30 |
| จัดการลูกค้า | `LEFT JOIN` + `COUNT(DISTINCT)` · VIP = `HAVING total > (SELECT AVG ...)` · `DISTINCT city` | 6, 13, 42, 44 |

### 🧾 SQL Inspector

ปุ่ม 🧾 ที่มุมขวาบนเปิดแผงแสดง **ทุกคำสั่งที่แอปรันจริง** เรียงล่าสุดก่อน พร้อม

- ประเภท (`SELECT` / `WRITE` / `TX` / `ROLLBACK`), จำนวนแถว, เวลาที่ใช้
- พารามิเตอร์ที่ถูก bind (ไม่มีการต่อ string เข้ากับ SQL ที่ใดเลย)
- ป้ายบทเรียนที่สอนคำสั่งนั้น
- ปุ่ม **EXPLAIN QUERY PLAN** ดูว่า query ใช้ index (`SEARCH ... USING INDEX`) หรืออ่านทั้งตาราง (`SCAN`) — บท 24

---

## โครงสร้างไฟล์

```text
shopnova/
├── index.html        # โครงหน้า (topbar, view, drawers, modal)
├── css/shop.css      # Design tokens (light/dark), components, charts, responsive
├── js/
│   ├── db.js         # sql.js bootstrap, persist, query/run/transaction helpers, SQL log
│   ├── queries.js    # SQL ทุกคำสั่งของแอป + ป้ายบทเรียน
│   ├── ui.js         # format เงิน/วันที่, รูปสินค้า, toast, modal, drawer
│   ├── charts.js     # กราฟ SVG (stacked bar, line, hbar, heatmap) + tooltip + มุมมองตาราง
│   ├── shop.js       # หน้าร้าน: catalog, product, cart, checkout, account
│   ├── admin.js      # แดชบอร์ด + จัดการออเดอร์ / สินค้า / ลูกค้า
│   └── main.js       # hash router, theme, SQL Inspector, boot
└── tests/verify.cjs  # ตรวจ SQL ทุกคำสั่งกับ seed จริง (77 เคส)
```

ร้านเพิ่มเฉพาะ **VIEW** (`v_order_totals`, `v_product_stats`) และ **INDEX** บนคอลัมน์ FK — ตาราง 6 ตารางหลักเหมือนบทเรียนทุกประการ

> **หมายเหตุ sql.js:** `db.export()` (ที่ใช้บันทึกลง localStorage) จะปิดแล้วเปิด connection ใหม่ ทำให้ `PRAGMA foreign_keys` ถูกรีเซ็ต — `db.js` จึงเปิด PRAGMA ซ้ำหลัง export ทุกครั้ง

## ทดสอบ

```bash
node shopnova/tests/verify.cjs
```

ตรวจ schema ส่วนขยาย, query อ่านทุกตัว (คอลัมน์ครบ), ความถูกต้องของ analytics (ปฏิทินเดือนต่อเนื่อง, สัดส่วนรวม 100%, รายได้ตรงนิยามบทเรียน) และ flow เขียนจริง: UPSERT → checkout ใน transaction → ROLLBACK เมื่อสต็อกไม่พอ → อัปเกรด tier → ยกเลิก+คืนสต็อก → รีวิว + CHECK → FK/UNIQUE ป้องกันข้อมูลเสีย
