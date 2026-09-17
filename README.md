# SQL Journey

**เรียนรู้และฝึกฝน SQL แบบ Interactive บนเบราว์เซอร์** — รัน SQLite จริงด้วย WebAssembly ไม่ต้องติดตั้งเซิร์ฟเวอร์หรือฐานข้อมูล

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://goragodwiriya.github.io/Interactive_SQL/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

---

## ภาพรวม

**SQL Journey** เป็นเว็บแอปเรียนรู้ SQL ภาษาไทย ครอบคลุม **54 บทเรียน** ตั้งแต่พื้นฐานจนถึง Analytics ขั้นสูง พร้อมแบบฝึกหัดตรวจคำตอบอัตโนมัติที่**บอกจุดที่ผิด** หมวด **Debug the SQL** ฝึกแก้ Query ที่พัง หมวด **Problem Solving** สอบถามด้วยโจทย์ธุรกิจ และหมวด **Database Design** ให้ออกแบบตารางเองพร้อมตรวจโครงสร้าง DDL จริง

ฐานข้อมูลจำลองร้านค้าออนไลน์ **ShopNova Thailand** (E-Commerce) ขนาดหลักร้อยแถว (48 ลูกค้า / 39 สินค้า / 148 ออเดอร์) พร้อมค่า NULL จริงในตำแหน่งที่สอน — ฝึกกับข้อมูลที่มีความสัมพันธ์และความสกปรกเหมือนฐานข้อมูลจริง

| | |
|---|---|
| Engine | SQLite 3 ผ่าน [sql.js](https://sql.js.org/) (WASM) |
| Runtime | เบราว์เซอร์ 100% — ไม่มี backend |
| Editor | [CodeMirror 5](https://codemirror.net/) — SQL highlight + autocomplete (`Ctrl + Space`) |
| บทเรียน | 54 บท · 10 หมวด |
| ภาษา UI | ไทย |

---

## คุณสมบัติหลัก

- **SQL Editor (CodeMirror)** — syntax highlight, เลขบรรทัด, `Ctrl + Enter` รัน, `Ctrl + Space` เติมคำสั่ง/ชื่อตาราง-คอลัมน์จาก schema จริง
- **ตรวจ Challenge อัตโนมัติ + บอกจุดที่ผิด** — เทียบผลลัพธ์กับคำตอบเฉลย แล้ววิเคราะห์ให้ว่าผิดเรื่องจำนวนแถว คอลัมน์ ค่า ลำดับ หรือชื่อคอลัมน์ที่โจทย์กำหนด (รองรับทั้ง Query, DML/DDL)
- **Debug the SQL** — 8 โจทย์แก้บั๊กจริง: syntax error, WHERE vs HAVING, NULL trap, JOIN ผิดแบบ, ตัวเลขบวมจาก fan-out, GROUP BY ผิดคอลัมน์, LIMIT ลืม ORDER BY, AND/OR precedence
- **Problem Solving** — 10 โจทย์ธุรกิจจริง (Top-N, รายเดือน, VIP, MoM Growth, Running Total, Top-N per Group, At-Risk customers) ระดับ Easy → Boss ไม่บอก syntax ตรง ๆ ต้องคิดเอง
- **Database Design** — 5 บทออกแบบตารางเอง (constraints, 1:N, M:N junction, normalization, capstone) ตรวจโครงสร้าง DDL จริงทั้ง PK / NOT NULL / CHECK / FK
- **JOIN Visualizer** — เลือกประเภท JOIN แล้วเห็นภาพว่าแถวไหนรอด แถวไหนถูกตัด พร้อมผลลัพธ์จริงจาก SQLite
- **⚡ Performance Lab** — สร้างตาราง 100,000 แถวในหน่วยความจำ ทดลอง SCAN vs INDEX พร้อมเวลาและ EXPLAIN QUERY PLAN จริง เขียน query เองแล้วเปิด/ปิด index ดูแผนเปลี่ยนได้
- **🔐 Injection Lab** — ระบบ Login จำลองให้ยิง payload (`' OR '1'='1`, `admin' --`) เพื่อเห็น SQL Injection ด้วยตาตัวเอง แล้วสลับเป็นโหมด Prepared Statement เพื่อดูวิธีป้องกัน (สอนเพื่อป้องกัน รันใน sandbox ของเบราว์เซอร์ทั้งหมด)
- **🛍️ ShopNova Thailand** — ร้านค้าออนไลน์ที่ทำงานจริงบนฐานข้อมูลเดียวกัน (`shopnova/`): แคตตาล็อก ตะกร้า ชำระเงินใน Transaction บัญชีลูกค้า รีวิว และแดชบอร์ดผู้ดูแลพร้อมกราฟ RFM / MoM / Recursive CTE — ทุกปุ่มคือ SQL จากบทเรียน เปิด **SQL Inspector** ดูคำสั่งจริงพร้อม EXPLAIN ได้ทันที
- **บันทึกความคืบหน้า** — เก็บบทที่ทำเสร็จใน `localStorage`
- **Persist ฐานข้อมูล** — สถานะ DB ถูกบันทึกอัตโนมัติ รีเซ็ตได้เมื่อต้องการ
- **Schema Explorer** — ดูโครงสร้างตารางและความสัมพันธ์
- **ค้นหา / กรองบทเรียน** — ตามหมวดและคำค้น
- **ธีมสว่าง / มืด** — สลับได้และจำค่าไว้
- **Cheat Sheet** — สรุปคำสั่ง SQL ที่ใช้บ่อย

---

## หลักสูตร (54 บท)

| หมวด | เนื้อหา |
|------|---------|
| **1. พื้นฐานสืบค้น** | `SELECT`, `WHERE`, `AND/OR/IN`, `LIKE`, `ORDER BY`, `DISTINCT` + NULL Handling |
| **2. จัดการข้อมูล** | `INSERT`, `UPDATE`, `DELETE` |
| **3. คำนวณและสรุปผล** | Aggregate, `GROUP BY`, `HAVING`, Pivot |
| **4. เชื่อมโยงตาราง** | `INNER` / `LEFT` / Multi-table JOIN, SELF / RIGHT / FULL / CROSS |
| **5. ฟังก์ชัน & Logic** | String/Date, `CASE WHEN`, Subquery |
| **6. ขั้นสูง & Analytics** | CTE, Window Functions, UNION, Recursive CTE, RFM Capstone |
| **7. ความปลอดภัย & Performance** | SQL Injection & Parameters, Transactions, Views/Indexes, UPSERT |
| **8. Debug the SQL 🐛** | แก้ Query ที่พัง 8 สถานการณ์จริง (syntax, NULL trap, fan-out, precedence ฯลฯ) |
| **9. Problem Solving 🧩** | 10 โจทย์ธุรกิจ Easy→Boss: Top-N, รายเดือน, VIP, Repeat, สัดส่วนหมวด, MoM Growth, Cumulative, MVP ต่อเมือง, At-Risk |
| **10. Database Design 🏗️** | ออกแบบตาราง 5 บท: Constraints, 1:N, M:N Junction, Normalization, Capstone ระบบสั่งอาหาร |

---

## โครงสร้างฐานข้อมูล (ShopNova)

```text
categories ──< products ──< order_items >── orders >── customers
                │                              │
                └──── reviews ─────────────────┘
```

| ตาราง | คำอธิบาย |
|-------|----------|
| `categories` | หมวดหมู่สินค้า |
| `customers` | ลูกค้า (เมือง, tier สมาชิก) — บางคนไม่เคยสั่งซื้อ |
| `products` | สินค้า (ราคา, สต็อก, rating — สินค้าใหม่ rating เป็น NULL) |
| `orders` | คำสั่งซื้อ (สถานะ, การชำระเงิน — ยังไม่ชำระ = NULL) |
| `order_items` | รายการในออเดอร์ |
| `reviews` | รีวิวสินค้า (บางรีวิวมีแค่คะแนน ไม่มีคอมเมนต์) |

ข้อมูลส่วนขยายถูก generate แบบ deterministic (seeded PRNG) ใน `js/schema.js` — ทุกเครื่องได้ข้อมูลเหมือนกัน 100% และมี ID สงวนสำหรับโจทย์ DML (`category_id 5`, `product_id 11`, `review_id 7`)

---

## โครงสร้างโปรเจกต์

```text
Interactive_SQL/
├── index.html          # หน้าหลักแอป
├── css/
│   └── style.css       # สไตล์และธีม
├── js/
│   ├── app.js          # Logic หลัก (DB, editor, progress, schema explorer)
│   ├── challenge.js    # Logic ตรวจ challenge + วิเคราะห์จุดที่ต่าง (แชร์กับ tests)
│   ├── lessons.js      # หลักสูตร 39 บท + challenge (รวมหมวด Debug the SQL)
│   └── schema.js       # Schema + seed data (ต้นฉบับ + generator แบบ deterministic)
├── vendor/
│   ├── sql-wasm.js     # sql.js (self-hosted)
│   ├── sql-wasm.wasm   # SQLite WASM binary
│   └── codemirror/     # CodeMirror 5.65.16 (self-hosted)
├── tests/
│   └── verify.cjs      # ตรวจตัวอย่าง SQL, challenge, debug lessons และ seed integrity
├── shopnova/           # 🛍️ ShopNova Thailand — ร้านค้าจริงบนฐานข้อมูลเดียวกัน (ดู shopnova/README.md)
│   ├── index.html
│   ├── css/shop.css
│   ├── js/             # db, queries, ui, charts, shop, admin, main
│   └── tests/verify.cjs
└── README.md
```

โปรเจกต์เป็น **static site** — ไม่ต้อง build, ไม่ต้องมี `package.json`

---

## วิธีใช้งาน

1. เปิดหน้าเว็บ รอสถานะ “ฐานข้อมูลพร้อม”
2. เลือกบทเรียนจากแถบด้านซ้าย (หรือค้นหา / กรองหมวด)
3. อ่านคำอธิบาย แล้วกด **▶ รัน SQL** เพื่อดูตัวอย่าง
4. ทำ **Challenge** ในกล่องแบบฝึกหัด แล้วรันอีกครั้งเพื่อตรวจคำตอบ
5. ความคืบหน้าจะถูกบันทึกอัตโนมัติเมื่อผ่าน challenge

ทางลัดที่มีประโยชน์:

| การกระทำ | วิธี |
|----------|------|
| รัน SQL | `Ctrl + Enter` หรือปุ่ม ▶ |
| โหลดตัวอย่างบทเรียน | ปุ่ม **โหลดตัวอย่าง** |
| จัดรูปแบบคีย์เวิร์ด | ปุ่ม **จัดรูปแบบ** |
| รีเซ็ตฐานข้อมูล | ปุ่ม **รีเซ็ต DB** |
| ดู Schema | ปุ่ม **โครงสร้างตาราง** |

---

## รันบนเครื่องตัวเอง

เพราะเป็นไฟล์ static เปิดด้วย HTTP server ธรรมดาได้ (อย่าเปิด `index.html` แบบ `file://` โดยตรง — WASM อาจถูกบล็อก)

```bash
# Python 3
python3 -m http.server 8080

# หรือ Node (ถ้ามี)
npx --yes serve -p 8080
```

จากนั้นเปิด [http://localhost:8080](http://localhost:8080)

---

## ทดสอบอัตโนมัติ

ตรวจว่า SQL ตัวอย่างและเฉลย challenge ของทุกบทเรียนทำงานถูกต้อง:

```bash
node tests/verify.cjs
```

สคริปต์จะตรวจว่า:

1. SQL ตัวอย่างทุกบทเรียนรันผ่านบน DB สด (ยกเว้นบท debug ที่โค้ดพังโดยตั้งใจ)
2. solution ของทุก challenge ผ่านตัวตรวจของแอป (ใช้ logic ร่วมกันจาก `js/challenge.js`)
3. คำตอบที่ไม่เกี่ยวข้องถูกปฏิเสธ
4. `formatSQL` ไม่แก้ข้อความใน string literal
5. `requiredColumns` ที่โจทย์กำหนด ต้องตรงกับผลลัพธ์ของ solution จริง
6. บท debug ทุกบท "มีบั๊กจริง" (โค้ดที่พังต้อง error หรือให้ผลต่างจากเฉลย)
7. Seed data integrity: FK ครบ, ID สงวนว่าง, มี NULL / ลูกค้าไม่เคยซื้อ / สินค้าไม่เคยขาย ตามที่โจทย์อ้างอิง

ตรวจ SQL ของร้าน ShopNova (77 เคส: query อ่านทุกตัว, analytics, และ flow เขียนจริงใน transaction):

```bash
node shopnova/tests/verify.cjs
```
8. Lab integrity: payload Injection ต้อง bypass โหมดต่อ string ได้และถูก prepared statement กันได้ / Query Plan ต้องเปลี่ยนจาก SCAN เป็น SEARCH เมื่อมี index

ต้องการ Node.js เท่านั้น (ใช้ `vendor/sql-wasm.js` ตัวเดียวกับแอป)

---

## เทคโนโลยี

- HTML / CSS / Vanilla JavaScript
- [sql.js](https://github.com/sql-js/sql.js) — SQLite compiled to WebAssembly
- `localStorage` — ความคืบหน้า ธีม และ snapshot ของฐานข้อมูล

---

## สัญญาอนุญาต

เผยแพร่ภายใต้ [MIT License](LICENSE) — ใช้งาน แก้ไข และแจกจ่ายได้อย่างอิสระ

---

## เครดิต

- SQLite engine ผ่านโครงการ [sql.js](https://sql.js.org/)
- หลักสูตรและ UI ออกแบบสำหรับผู้เรียนภาษาไทยที่ต้องการฝึก SQL แบบลงมือทำจริง
