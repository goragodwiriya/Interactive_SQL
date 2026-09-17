/**
 * SQL Journey — Comprehensive Interactive Lessons Curriculum
 * 31 บทเรียนครอบคลุมตั้งแต่ระดับเริ่มต้นจนถึงระดับวิเคราะห์ขั้นสูง + ความปลอดภัยและ Performance
 */

const categoriesList = [
  {id: "all", label: "ทั้งหมด"},
  {id: "basic", label: "1. พื้นฐานสืบค้น"},
  {id: "dml", label: "2. จัดการข้อมูล"},
  {id: "aggregation", label: "3. คำนวณและสรุปผล"},
  {id: "joins", label: "4. เชื่อมโยงตาราง"},
  {id: "functions", label: "5. ฟังก์ชัน & Logic"},
  {id: "advanced", label: "6. ขั้นสูง & Analytics"},
  {id: "security", label: "7. ความปลอดภัย & Performance"},
  {id: "debug", label: "8. Debug the SQL 🐛"},
  {id: "problems", label: "9. Problem Solving 🧩"},
  {id: "design", label: "10. Database Design 🏗️"}
];

const lessons = [
  // ==========================================
  // หมวดที่ 1: พื้นฐานการสืบค้น (Basic Queries)
  // ==========================================
  {
    id: 1,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 1 · เริ่มต้น",
    title: "SELECT & AS — เลือกคอลัมน์และตั้งชื่อใหม่",
    description: `
      <p>คำสั่ง <strong>SELECT</strong> เป็นหัวใจสำคัญของ SQL ใช้สำหรับอ่านข้อมูลจากตาราง</p>
      <p>เครื่องหมาย <code>*</code> หมายถึงเลือกทุกคอลัมน์ แต่การระบุชื่อคอลัมน์ที่ต้องการโดยตรง เช่น <code>SELECT name, email FROM customers;</code> จะมีประสิทธิภาพสูงกว่าและลดภาระเครือข่าย</p>
      <p>เราสามารถใช้คำสั่ง <strong>AS</strong> เพื่อตั้งชื่อคอลัมน์ใหม่ (Alias) ในตารางผลลัพธ์ให้อ่านเข้าใจง่ายขึ้น</p>
    `,
    tip: "การตั้งชื่อ Alias ด้วย <code>AS</code> จะเปลี่ยนเฉพาะชื่อหัวตารางผลลัพธ์ที่แสดงผล โดยไม่มีผลกระทบต่อชื่อคอลัมน์จริงในฐานข้อมูล",
    sql: `SELECT 
  name AS customer_name, 
  city AS location, 
  member_tier AS tier 
FROM customers;`,
    challenge: {
      question: "เขียนคำสั่ง SELECT เพื่อเลือกเฉพาะชื่อสินค้า (<code>name</code>) และราคา (<code>price</code>) จากตาราง <code>products</code>",
      hint: "ใช้ <code>SELECT name, price FROM products;</code>",
      solution: "SELECT name, price FROM products;",
      unordered: true
    }
  },
  {
    id: 2,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 2 · พื้นฐาน",
    title: "WHERE & Comparison — กรองข้อมูลตามเงื่อนไข",
    description: `
      <p>ประโยค <strong>WHERE</strong> ใช้สำหรับกรองแถวข้อมูลที่ตรงตามเงื่อนไขที่กำหนดเท่านั้น</p>
      <p>ตัวดำเนินการเปรียบเทียบมาตรฐานใน SQL ได้แก่:</p>
      <ul>
        <li><code>=</code> เท่ากับ, <code>!=</code> หรือ <code><></code> ไม่เท่ากับ</li>
        <li><code>></code> มากกว่า, <code><</code> น้อยกว่า</li>
        <li><code>>=</code> มากกว่าหรือเท่ากับ, <code><=</code> น้อยกว่าหรือเท่ากับ</li>
      </ul>
    `,
    tip: "สำหรับข้อความ (Text/String) ใน SQL ต้องครอบด้วยเครื่องหมาย Single Quote <code>'...'</code> เช่น <code>city = 'กรุงเทพฯ'</code>",
    sql: `SELECT name, price, stock, rating 
FROM products 
WHERE price >= 2000;`,
    challenge: {
      question: "ค้นหาลูกค้าทั้งหมดที่อาศัยอยู่ใน <code>'กรุงเทพฯ'</code> จากตาราง <code>customers</code>",
      hint: "ใช้ <code>WHERE city = 'กรุงเทพฯ'</code>",
      solution: "SELECT * FROM customers WHERE city = 'กรุงเทพฯ';",
      unordered: true
    }
  },
  {
    id: 3,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 3 · พื้นฐาน",
    title: "Logical Operators — AND, OR, NOT & IN",
    description: `
      <p>เราสามารถผสมผสานหลายเงื่อนไขเข้าด้วยกันได้ด้วยตัวดำเนินการทางตรรกะ:</p>
      <ul>
        <li><strong>AND</strong>: ทุกเงื่อนไขต้องเป็นจริงพร้อมกัน</li>
        <li><strong>OR</strong>: เงื่อนไขใดเงื่อนไขหนึ่งเป็นจริง</li>
        <li><strong>IN (...)</strong>: ตรวจสอบว่าค่าอยู่ในกลุ่มที่กำหนดหรือไม่ (เทียบเท่า OR หลายๆ ตัว)</li>
        <li><strong>BETWEEN a AND b</strong>: ตรวจสอบค่าที่อยู่ในช่วงตั้งแต่ a ถึง b (รวมจุดสิ้นสุด)</li>
      </ul>
    `,
    tip: "หากมีทั้ง AND และ OR ในประโยคเดียวกัน ควรใส่วงเล็บ <code>(...)</code> เพื่อจัดลำดับความสำคัญให้ชัดเจน",
    sql: `SELECT name, city, member_tier 
FROM customers 
WHERE member_tier IN ('Gold', 'Platinum')
  AND city != 'กรุงเทพฯ';`,
    challenge: {
      question: "ค้นหาสินค้าที่มีราคาอยู่ระหว่าง 1,000 ถึง 3,000 บาท โดยใช้คำสั่ง <code>BETWEEN</code>",
      hint: "ใช้ <code>WHERE price BETWEEN 1000 AND 3000</code>",
      solution: "SELECT * FROM products WHERE price BETWEEN 1000 AND 3000;",
      unordered: true
    }
  },
  {
    id: 4,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 4 · พื้นฐาน",
    title: "LIKE & Wildcards — ค้นหาข้อความด้วย Pattern",
    description: `
      <p><strong>LIKE</strong> ใช้สำหรับค้นหาข้อความที่มีรูปแบบตรงตาม Pattern ร่วมกับสัญลักษณ์ Wildcard:</p>
      <ul>
        <li><code>%</code> แทนตัวอักษรใดๆ จำนวนกี่ตัวก็ได้ (0 ตัวขึ้นไป)</li>
        <li><code>_</code> แทนตัวอักษรใดๆ เพียง 1 ตัวพอดี</li>
      </ul>
      <p>ตัวอย่าง: <code>'%Keyboard%'</code> หมายถึงข้อความใดๆ ที่มีคำว่า Keyboard อยู่ที่ใดก็ได้</p>
    `,
    tip: "การค้นหาด้วย <code>LIKE '%abc'</code> อาจทำให้ฐานข้อมูลไม่สามารถใช้ Index ได้อย่างเต็มประสิทธิภาพในระบบขนาดใหญ่",
    sql: `SELECT product_id, name, price 
FROM products 
WHERE name LIKE '%Wireless%' 
   OR name LIKE '%USB%';`,
    challenge: {
      question: "ค้นหาลูกค้าที่มีอีเมลลงท้ายด้วย <code>'@example.com'</code> ทั้งหมด",
      hint: "ใช้ <code>WHERE email LIKE '%@example.com'</code>",
      solution: "SELECT * FROM customers WHERE email LIKE '%@example.com';",
      unordered: true
    }
  },
  {
    id: 5,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 5 · พื้นฐาน",
    title: "ORDER BY & LIMIT — เรียงลำดับและแบ่งหน้า",
    description: `
      <p><strong>ORDER BY</strong> ใช้เรียงลำดับผลลัพธ์:</p>
      <ul>
        <li><code>ASC</code>: เรียงจากน้อยไปมาก / ก-ฮ / A-Z (ค่าเริ่มต้น)</li>
        <li><code>DESC</code>: เรียงจากมากไปน้อย / ฮ-ก / Z-A</li>
      </ul>
      <p><strong>LIMIT</strong> กำหนดจำนวนแถวสูงสุดที่ต้องการดึง และ <strong>OFFSET</strong> ใช้ข้ามแถวแรกๆ (มักใช้ทำระบบแบ่งหน้า Pagination)</p>
    `,
    tip: "สามารถเรียงลำดับหลายคอลัมน์พร้อมกันได้ เช่น <code>ORDER BY rating DESC, price ASC</code>",
    sql: `SELECT name, price, rating, stock 
FROM products 
ORDER BY price DESC 
LIMIT 5;`,
    challenge: {
      question: "ดึงสินค้าที่มีคะแนนรีวิว (<code>rating</code>) สูงสุด 3 อันดับแรก",
      hint: "ใช้ <code>ORDER BY rating DESC LIMIT 3</code>",
      solution: "SELECT * FROM products ORDER BY rating DESC LIMIT 3;"
    }
  },
  {
    id: 6,
    category: "basic",
    categoryLabel: "พื้นฐานสืบค้น",
    level: "บทที่ 6 · พื้นฐาน",
    title: "DISTINCT & NULL Handling — ค่าไม่ซ้ำและการจัดการ NULL",
    description: `
      <p><strong>DISTINCT</strong> ใช้กำจัดแถวที่ซ้ำซ้อนในผลลัพธ์ ให้เหลือเฉพาะค่าที่ไม่ซ้ำกัน</p>
      <p>สำหรับค่าว่าง <strong>NULL</strong> ในฐานข้อมูลของเรามีอยู่จริง เช่น ออเดอร์สถานะ <code>pending</code> ที่ยังไม่ได้เลือกวิธีชำระเงินจะเก็บ <code>payment_method</code> เป็น NULL — ข้อสำคัญคือ NULL <strong>ไม่ใช่ ''</strong> (ค่าว่างเปล่า) และ<strong>ไม่สามารถใช้ = NULL ได้</strong> เพราะ NULL แปลว่า "ไม่รู้ค่า" การเปรียบเทียบใดๆ กับ NULL จะได้ผลเป็น NULL ไม่ใช่ TRUE:</p>
      <ul>
        <li><code>IS NULL</code> เพื่อตรวจหาค่าว่าง</li>
        <li><code>IS NOT NULL</code> เพื่อตรวจหาค่าที่มีข้อมูล</li>
        <li><code>COALESCE(col, 'default')</code> ส่งคืนค่าแรกที่ไม่ใช่ NULL นิยมใช้แปลง NULL เป็นค่าที่ต้องการก่อนแสดงผล</li>
      </ul>
      <p>ลองรัน <code>SELECT NULL = NULL;</code> ใน Editor ดู — คำตอบคือ NULL ไม่ใช่ 1 นั่นคือเหตุผลที่ต้องใช้ <code>IS NULL</code> เท่านั้น</p>
    `,
    tip: "ในตาราง <code>reviews</code> บางรีวิวให้แค่คะแนนโดยไม่เขียนคอมเมนต์ (<code>comment</code> เป็น NULL) และสินค้ามาใหม่บางตัวยังไม่มีคะแนน (<code>rating</code> เป็น NULL) — ลองไล่ดูได้",
    sql: `-- ออเดอร์ที่ยังไม่ได้ระบุวิธีชำระเงิน (payment_method = NULL)
SELECT order_id, status, COALESCE(payment_method, 'ยังไม่ได้ระบุ') AS payment_display
FROM orders
WHERE payment_method IS NULL;

-- DISTINCT + NULL: ค่า NULL จะถูกนับเป็น "ค่าเดียว" ในผลลัพธ์ DISTINCT
SELECT DISTINCT payment_method FROM orders ORDER BY payment_method;`,
    challenge: {
      question: "ดึงคำสั่งซื้อที่<strong>ยังไม่ได้ระบุวิธีชำระเงิน</strong> (payment_method เป็น NULL) แสดงคอลัมน์ <code>order_id</code>, <code>status</code> และ <code>payment_method</code>",
      hint: "ใช้ <code>WHERE payment_method IS NULL</code> (ใช้ <code>= NULL</code> ไม่ได้!)",
      solution: "SELECT order_id, status, payment_method FROM orders WHERE payment_method IS NULL;",
      unordered: true
    }
  },

  // ==========================================
  // หมวดที่ 2: จัดการข้อมูล (DML - Data Manipulation)
  // ==========================================
  {
    id: 7,
    category: "dml",
    categoryLabel: "จัดการข้อมูล",
    level: "บทที่ 7 · DML",
    title: "INSERT INTO — การเพิ่มแถวข้อมูลใหม่",
    description: `
      <p>คำสั่ง <strong>INSERT INTO</strong> ใช้สำหรับเพิ่มระเบียนข้อมูลใหม่ลงในตาราง</p>
      <p>ไวยากรณ์ที่ดีควรกำหนดชื่อคอลัมน์เสมอ เพื่อป้องกันความผิดพลาดหากโครงสร้างตารางเปลี่ยนแปลงในอนาคต:</p>
      <pre>INSERT INTO table_name (col1, col2) VALUES (val1, val2);</pre>
    `,
    tip: "สามารถเพิ่มหลายแถวพร้อมกันได้ในคำสั่งเดียวโดยคั่นชุดวงเล็บด้วยเครื่องหมายจุลภาค <code>VALUES (...), (...)</code>",
    sql: `INSERT INTO customers (name, email, city, member_tier, registered_date)
VALUES 
  ('กัญญา วงศ์สุวรรณ', 'kanya@example.com', 'ภูเก็ต', 'Silver', '2026-03-01'),
  ('ธีรภัทร เอกชัย', 'theerapat@example.com', 'เชียงใหม่', 'Bronze', '2026-03-02');

SELECT * FROM customers ORDER BY customer_id DESC LIMIT 3;`,
    challenge: {
      question: "เพิ่มหมวดหมู่สินค้าใหม่ชื่อ <code>'Gaming Gear'</code> และรายละเอียด <code>'อุปกรณ์สำหรับเล่นเกมมืออาชีพ'</code> ลงในตาราง <code>categories</code>",
      hint: "ใช้ <code>INSERT INTO categories (category_id, name, description) VALUES (5, 'Gaming Gear', 'อุปกรณ์สำหรับเล่นเกมมืออาชีพ');</code>",
      solution: "INSERT INTO categories (category_id, name, description) VALUES (5, 'Gaming Gear', 'อุปกรณ์สำหรับเล่นเกมมืออาชีพ');"
    }
  },
  {
    id: 8,
    category: "dml",
    categoryLabel: "จัดการข้อมูล",
    level: "บทที่ 8 · DML",
    title: "UPDATE — แก้ไขข้อมูลเดิมอย่างปลอดภัย",
    description: `
      <p><strong>UPDATE</strong> ใช้สำหรับปรับปรุงหรือแก้ไขข้อมูลที่มีอยู่แล้วในตาราง</p>
      <p><strong>ข้อควรระวังอย่างยิ่ง:</strong> ต้องระบุเงื่อนไข <code>WHERE</code> เสมอ มิฉะนั้นข้อมูลทุกแถวในตารางจะถูกแก้ไขทั้งหมด!</p>
    `,
    tip: "แนวปฏิบัติที่ดีคือให้เขียน <code>SELECT ... WHERE ...</code> ดูก่อนว่าเงื่อนไขตรงกับแถวที่ต้องการแก้ไขจริงหรือไม่ ก่อนจะเปลี่ยนเป็นคำสั่ง UPDATE",
    sql: `UPDATE products 
SET price = price * 0.9, stock = stock + 10 
WHERE product_id = 1;

SELECT product_id, name, price, stock 
FROM products 
WHERE product_id = 1;`,
    challenge: {
      question: "อัปเดตสถานะของลูกค้า <code>customer_id = 4</code> ให้มี <code>member_tier = 'Silver'</code>",
      hint: "ใช้ <code>UPDATE customers SET member_tier = 'Silver' WHERE customer_id = 4;</code>",
      solution: "UPDATE customers SET member_tier = 'Silver' WHERE customer_id = 4;"
    }
  },
  {
    id: 9,
    category: "dml",
    categoryLabel: "จัดการข้อมูล",
    level: "บทที่ 9 · DML",
    title: "DELETE — ลบข้อมูลตามเงื่อนไข",
    description: `
      <p>คำสั่ง <strong>DELETE FROM</strong> ใช้สำหรับลบแถวข้อมูลที่ไม่ต้องการออกจากตาราง</p>
      <p>เช่นเดียวกับ UPDATE หากไม่มี <code>WHERE</code> ข้อมูลทั้งหมดในตารางจะถูกลบเกลี้ยง</p>
      <p>หากมี Foreign Key เชื่อมโยงอยู่กับตารางอื่น ฐานข้อมูลอาจปฏิเสธการลบเพื่อรักษาความถูกต้องของข้อมูล (Referential Integrity)</p>
    `,
    tip: "หากต้องการทดลองลบแล้วเริ่มใหม่ สามารถกดปุ่ม 'รีเซ็ตฐานข้อมูล' ได้ตลอดเวลา",
    sql: `DELETE FROM reviews 
WHERE review_id = 1;

SELECT * FROM reviews;`,
    challenge: {
      question: "ลบคำสั่งซื้อที่มีสถานะ <code>'cancelled'</code> ออกจากตาราง <code>orders</code>",
      hint: "ใช้ <code>DELETE FROM orders WHERE status = 'cancelled';</code>",
      solution: "DELETE FROM orders WHERE status = 'cancelled';"
    }
  },

  // ==========================================
  // หมวดที่ 3: คำนวณและสรุปผล (Aggregation & Grouping)
  // ==========================================
  {
    id: 10,
    category: "aggregation",
    categoryLabel: "คำนวณและสรุปผล",
    level: "บทที่ 10 · Aggregate",
    title: "Aggregate Functions — COUNT, SUM, AVG, MIN, MAX",
    description: `
      <p>ฟังก์ชันสรุปผลรวม (Aggregate Functions) ใช้คำนวณข้อมูลหลายแถวให้เหลือค่าสรุป 1 ค่า:</p>
      <ul>
        <li><code>COUNT(*)</code> หรือ <code>COUNT(column)</code>: นับจำนวนแถว</li>
        <li><code>SUM(column)</code>: หาผลรวมตัวเลข</li>
        <li><code>AVG(column)</code>: หาค่าเฉลี่ย</li>
        <li><code>MIN(column)</code> / <code>MAX(column)</code>: หาค่าน้อยสุดและมากสุด</li>
        <li><code>ROUND(value, decimals)</code>: ปัดเศษทศนิยม</li>
      </ul>
    `,
    tip: "<code>COUNT(*)</code> จะนับทุกแถวรวมทั้งแถวที่มีค่า NULL ส่วน <code>COUNT(column)</code> จะนับเฉพาะแถวที่คอลัมน์นั้นไม่ใช่ NULL",
    sql: `SELECT 
  COUNT(*) AS total_products,
  ROUND(AVG(price), 2) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  SUM(stock) AS total_inventory
FROM products;`,
    challenge: {
      question: "หาจำนวนลูกค้าทั้งหมดในระบบ และจำนวนลูกค้าที่มีระดับเป็น <code>'Gold'</code>",
      hint: "ใช้ <code>COUNT(*)</code> และ <code>COUNT(CASE WHEN member_tier = 'Gold' THEN 1 END)</code>",
      solution: "SELECT COUNT(*) AS total_customers, COUNT(CASE WHEN member_tier = 'Gold' THEN 1 END) AS gold_customers FROM customers;"
    }
  },
  {
    id: 11,
    category: "aggregation",
    categoryLabel: "คำนวณและสรุปผล",
    level: "บทที่ 11 · Grouping",
    title: "GROUP BY & HAVING — จัดกลุ่มและกรองผลสรุป",
    description: `
      <p><strong>GROUP BY</strong> ใช้จัดกลุ่มแถวที่มีค่าเหมือนกัน เพื่อคำนวณผลสรุปแยกตามแต่ละกลุ่ม</p>
      <p><strong>ความแตกต่างสำคัญระหว่าง WHERE กับ HAVING:</strong></p>
      <ul>
        <li><code>WHERE</code>: กรองแถวข้อมูล<em>ก่อน</em>การจัดกลุ่ม</li>
        <li><code>HAVING</code>: กรองกลุ่มข้อมูล<em>หลัง</em>จากการคำนวณ Aggregate แล้ว</li>
      </ul>
    `,
    tip: "ทุกคอลัมน์ที่อยู่ใน SELECT แต่ไม่ได้ถูกครอบด้วย Aggregate Function จะต้องปรากฏอยู่ในประโยค GROUP BY เสมอ",
    sql: `SELECT 
  city, 
  COUNT(*) AS customer_count,
  GROUP_CONCAT(name, ', ') AS customer_names
FROM customers 
GROUP BY city 
HAVING COUNT(*) >= 2
ORDER BY customer_count DESC;`,
    challenge: {
      question: "จัดกลุ่มสินค้าตาม <code>category_id</code> หาจำนวนสินค้าและราคาเฉลี่ยต่อหมวดหมู่",
      hint: "ใช้ <code>GROUP BY category_id</code> ร่วมกับ <code>COUNT(*)</code> และ <code>ROUND(AVG(price), 2)</code>",
      solution: "SELECT category_id, COUNT(*) AS total_items, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category_id;",
      unordered: true
    }
  },

  // ==========================================
  // หมวดที่ 4: เชื่อมโยงหลายตาราง (Relational Joins)
  // ==========================================
  {
    id: 12,
    category: "joins",
    categoryLabel: "เชื่อมโยงตาราง",
    level: "บทที่ 12 · Joins",
    title: "INNER JOIN — รวมข้อมูลที่สัมพันธ์กันตรงกัน",
    description: `
      <p><strong>INNER JOIN</strong> คือการเชื่อมตาราง 2 ตารางเข้าด้วยกัน โดยจะดึงเฉพาะแถวที่มีคีย์เชื่อมโยง (Key) ตรงกันทั้งสองฝั่ง</p>
      <p>ไวยากรณ์:</p>
      <pre>SELECT ... FROM TableA A INNER JOIN TableB B ON A.id = B.a_id;</pre>
    `,
    tip: "การใช้ Table Alias สั้นๆ เช่น <code>p</code> สำหรับ products และ <code>c</code> สำหรับ categories ช่วยให้อ่านและเขียนคำสั่งได้กระชับขึ้นมาก",
    sql: `SELECT 
  p.product_id,
  p.name AS product_name,
  c.name AS category_name,
  p.price,
  p.stock
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
ORDER BY c.name, p.price DESC;`,
    challenge: {
      question: "เชื่อมตาราง <code>orders</code> กับตาราง <code>customers</code> เพื่อแสดง <code>order_id</code>, <code>name</code> ของลูกค้า, <code>city</code>, และ <code>status</code>",
      hint: "ใช้ <code>FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id</code>",
      solution: "SELECT o.order_id, c.name, c.city, o.status FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id;",
      unordered: true
    }
  },
  {
    id: 13,
    category: "joins",
    categoryLabel: "เชื่อมโยงตาราง",
    level: "บทที่ 13 · Joins",
    title: "LEFT JOIN — รักษาข้อมูลฝั่งซ้ายทั้งหมด",
    description: `
      <p><strong>LEFT JOIN</strong> (หรือ LEFT OUTER JOIN) จะดึงข้อมูลทุกแถวจากตารางฝั่งซ้ายเสมอ แม้ว่าจะไม่มีแถวที่ตรงกันในตารางฝั่งขวา (ฝั่งขวาจะได้ค่าเป็น <code>NULL</code>)</p>
      <p>มีประโยชน์มากในการค้นหา "รายการที่ไม่มีการกระทำ" เช่น ลูกค้าที่ยังไม่เคยสั่งซื้อสินค้าเลย หรือสินค้าที่ยังไม่เคยมีรีวิว</p>
    `,
    tip: "การหาแถวที่ไม่มีคู่ ให้ใช้ <code>LEFT JOIN ... WHERE right_table.id IS NULL</code>",
    sql: `SELECT 
  c.customer_id,
  c.name,
  c.city,
  COUNT(o.order_id) AS total_orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name, c.city
ORDER BY total_orders ASC;`,
    challenge: {
      question: "แสดงสินค้าทุกชิ้นและ ID ของสินค้าในตาราง <code>products</code> พร้อมคะแนนรีวิวและหมายเหตุจากตาราง <code>reviews</code> โดยใช้ LEFT JOIN",
      hint: "ใช้ <code>FROM products p LEFT JOIN reviews r ON p.product_id = r.product_id</code>",
      solution: "SELECT p.product_id, p.name, r.rating, r.comment FROM products p LEFT JOIN reviews r ON p.product_id = r.product_id;",
      unordered: true
    }
  },
  {
    id: 14,
    category: "joins",
    categoryLabel: "เชื่อมโยงตาราง",
    level: "บทที่ 14 · Joins",
    title: "Multi-Table JOIN — เชื่อมโยง 3 ตารางขึ้นไป",
    description: `
      <p>ในระบบจริง ข้อมูลมักกระจายอยู่ในหลายตารางที่เชื่อมต่อกันเป็นทอดๆ เช่น:</p>
      <p><strong>Customers</strong> ➔ <strong>Orders</strong> ➔ <strong>Order_Items</strong> ➔ <strong>Products</strong></p>
      <p>เราสามารถเรียงคำสั่ง JOIN ต่อกันหลายชั้นเพื่อดึงข้อมูลใบเสร็จรับเงินหรือสรุปยอดสั่งซื้อที่สมบูรณ์ได้</p>
    `,
    tip: "ตรวจสอบให้แน่ใจว่าเงื่อนไข <code>ON</code> ของแต่ละ JOIN ระบุคอลัมน์ Primary Key และ Foreign Key ที่ถูกต้องตามคู่ของตาราง",
    sql: `SELECT 
  o.order_id,
  c.name AS customer_name,
  p.name AS product_name,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) AS line_total,
  o.order_date
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
ORDER BY o.order_id, oi.order_item_id;`,
    challenge: {
      question: "คำนวณยอดขายรวมของลูกค้าแต่ละคน โดยเชื่อมโยง 3 ตาราง (customers, orders, order_items)",
      hint: "ใช้ <code>SUM(oi.quantity * oi.unit_price)</code> และ <code>GROUP BY c.customer_id, c.name</code>",
      solution: "SELECT c.name, SUM(oi.quantity * oi.unit_price) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.customer_id, c.name;",
      unordered: true
    }
  },

  // ==========================================
  // หมวดที่ 5: ฟังก์ชันและการแปลงข้อมูล (Functions & Expressions)
  // ==========================================
  {
    id: 15,
    category: "functions",
    categoryLabel: "ฟังก์ชัน & Logic",
    level: "บทที่ 15 · Functions",
    title: "String & Date Functions — จัดการข้อความและวันที่",
    description: `
      <p>SQLite และฐานข้อมูล SQL ทั่วไปมีฟังก์ชันจัดการข้อความและวันที่มากมาย:</p>
      <ul>
        <li><code>UPPER(str)</code>, <code>LOWER(str)</code>: แปลงตัวพิมพ์ใหญ่/เล็ก</li>
        <li><code>LENGTH(str)</code>: นับความยาวตัวอักษร</li>
        <li><code>SUBSTR(str, start, length)</code>: ตัดข้อความบางส่วน</li>
        <li><code>strftime('%Y-%m', date)</code>: จัดรูปแบบวันที่ เช่น แยกปีและเดือน</li>
        <li><code>DATE('now')</code>: วันที่ปัจจุบัน</li>
      </ul>
    `,
    tip: "ใน SQLite ฟังก์ชัน <code>strftime('%Y', order_date)</code> ใช้ดึงเฉพาะปี ค.ศ. ออกมาจัดกลุ่มได้สะดวกมาก",
    sql: `SELECT 
  order_id,
  order_date,
  strftime('%Y', order_date) AS order_year,
  strftime('%m', order_date) AS order_month,
  strftime('%d', order_date) AS order_day,
  UPPER(status) AS status_caps
FROM orders;`,
    challenge: {
      question: "ดึงชื่อลูกค้าพร้อมความยาวของชื่อ โดยตั้งชื่อคอลัมน์ว่า <code>name_length</code> เรียงจากยาวไปสั้น",
      hint: "ใช้ <code>SELECT name, LENGTH(name) AS name_length FROM customers ORDER BY name_length DESC;</code>",
      solution: "SELECT name, LENGTH(name) AS name_length FROM customers ORDER BY name_length DESC;",
      requiredColumns: ["name_length"]
    }
  },
  {
    id: 16,
    category: "functions",
    categoryLabel: "ฟังก์ชัน & Logic",
    level: "บทที่ 16 · Functions",
    title: "CASE WHEN — การเขียนเงื่อนไข Conditional Logic",
    description: `
      <p>ประโยค <strong>CASE WHEN</strong> ทำหน้าที่เหมือน <code>if-else</code> ในการเขียนโปรแกรม ช่วยให้เราจัดหมวดหมู่หรือแปลงค่าข้อมูลใน Query ได้แบบไดนามิก</p>
      <pre>CASE 
  WHEN condition1 THEN result1
  WHEN condition2 THEN result2
  ELSE default_result
END</pre>
    `,
    tip: "อย่าลืมปิดท้ายด้วยคำว่า <code>END</code> เสมอ และสามารถตั้ง Alias ด้วย <code>AS new_column_name</code>",
    sql: `SELECT 
  name, 
  price, 
  stock,
  CASE 
    WHEN stock = 0 THEN '❌ สินค้าหมด'
    WHEN stock <= 10 THEN '⚠️ ใกล้หมด (สั่งเพิ่มด่วน)'
    ELSE '✅ สต็อกเพียงพอ'
  END AS inventory_status,
  CASE 
    WHEN price >= 5000 THEN 'Premium Tier'
    WHEN price >= 2000 THEN 'Mid Tier'
    ELSE 'Budget Tier'
  END AS price_tier
FROM products;`,
    challenge: {
      question: "ใช้ CASE WHEN เพื่อแปลงสถานะออเดอร์ (<code>status</code>) เป็นภาษาไทย เช่น 'completed' ➔ 'สำเร็จ', 'shipped' ➔ 'จัดส่งแล้ว', อื่นๆ ➔ 'รอดำเนินการ' อย่าลืมคืนค่า id และสถานะก่อนแปลงมาด้วย",
      hint: "ใช้ <code>CASE WHEN status = 'completed' THEN 'สำเร็จ' WHEN status = 'shipped' THEN 'จัดส่งแล้ว' ELSE 'รอดำเนินการ' END AS status_th</code>",
      solution: "SELECT order_id, status, CASE WHEN status = 'completed' THEN 'สำเร็จ' WHEN status = 'shipped' THEN 'จัดส่งแล้ว' ELSE 'รอดำเนินการ' END AS status_th FROM orders;",
      unordered: true
    }
  },

  // ==========================================
  // หมวดที่ 6: คำสั่งขั้นสูงและการวิเคราะห์ (Advanced Analytics)
  // ==========================================
  {
    id: 17,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 17 · Advanced",
    title: "Subqueries — การเขียน Query ย่อยซ้อนในคำสั่ง",
    description: `
      <p><strong>Subquery</strong> (หรือ Nested Query) คือคำสั่ง SELECT ที่ซ้อนอยู่ภายในคำสั่ง SQL อื่น มักใช้หาค่าอ้างอิงเพื่อนำมาเปรียบเทียบใน <code>WHERE</code> หรือใช้เป็นตารางเสมือนใน <code>FROM</code></p>
      <p>ตัวอย่าง: หาสินค้าที่มีราคาสูงกว่า <em>ราคาเฉลี่ยของสินค้าทั้งหมด</em></p>
    `,
    tip: "Subquery ใน WHERE มักจะต้องคืนค่าเพียงคอลัมน์เดียว หากคืนค่าหลายแถวให้ใช้ร่วมกับตัวดำเนินการ <code>IN</code> หรือ <code>EXISTS</code>",
    sql: `SELECT 
  product_id, 
  name, 
  price,
  (SELECT ROUND(AVG(price), 2) FROM products) AS overall_avg_price
FROM products 
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;`,
    challenge: {
      question: "ค้นหาลูกค้าที่มีการสั่งซื้ออย่างน้อย 1 รายการโดยใช้ Subquery กับ <code>IN (SELECT customer_id FROM orders)</code>",
      hint: "ใช้ <code>WHERE customer_id IN (SELECT customer_id FROM orders)</code>",
      solution: "SELECT * FROM customers WHERE customer_id IN (SELECT customer_id FROM orders);",
      unordered: true
    }
  },
  {
    id: 18,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 18 · Advanced",
    title: "CTE (WITH Clause) — แบ่ง Query ซับซ้อนให้เข้าใจง่าย",
    description: `
      <p><strong>CTE</strong> (Common Table Expression) ช่วยให้เราสร้างผลลัพธ์ชั่วคราวด้วยคำสั่ง <code>WITH table_name AS (...)</code></p>
      <p>CTE ช่วยเพิ่มความสามารถในการอ่านโค้ด (Readability) ได้ดีกว่า Subquery ซ้อนกันหลายชั้นอย่างมาก และยังสามารถนำ CTE ตัวเดิมมาอ้างอิงซ้ำใน Query ได้</p>
    `,
    tip: "สามารถสร้างหลาย CTE ต่อกันได้โดยคั่นด้วยเครื่องหมายจุลภาค <code>WITH cte1 AS (...), cte2 AS (...) SELECT ...</code>",
    sql: `WITH order_summary AS (
  SELECT 
    order_id,
    SUM(quantity * unit_price) AS total_amount,
    COUNT(product_id) AS items_count
  FROM order_items
  GROUP BY order_id
)
SELECT 
  o.order_id,
  c.name AS customer_name,
  o.order_date,
  os.items_count,
  ROUND(os.total_amount, 2) AS total_paid
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_summary os ON o.order_id = os.order_id
ORDER BY total_paid DESC;`,
    challenge: {
      question: "สร้าง CTE ชื่อ <code>high_price_products</code> เพื่อเลือกสินค้าที่ราคาเกิน 2000 บาท แล้วดึงชื่อและหมวดหมู่ของสินค้าเหล่านั้น",
      hint: "ใช้ <code>WITH high_price_products AS (SELECT * FROM products WHERE price > 2000) SELECT name, price FROM high_price_products;</code>",
      solution: "WITH high_price_products AS (SELECT * FROM products WHERE price > 2000) SELECT name, price FROM high_price_products;",
      unordered: true
    }
  },
  {
    id: 19,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 19 · Window Fn",
    title: "Window Functions — ROW_NUMBER, RANK & DENSE_RANK",
    description: `
      <p><strong>Window Function</strong> ช่วยคำนวณข้อมูลข้ามหลายแถวโดย<strong>ไม่ยุบแถว</strong>เหมือน GROUP BY</p>
      <ul>
        <li><code>ROW_NUMBER() OVER (...)</code>: กำหนดลำดับแถวเรียงตัวเลข 1, 2, 3... เสมอ</li>
        <li><code>RANK() OVER (...)</code>: จัดอันดับ หากยอดเท่ากันจะได้อันดับเดียวกัน และข้ามลำดับถัดไป (1, 2, 2, 4)</li>
        <li><code>DENSE_RANK() OVER (...)</code>: จัดอันดับ ยอดเท่ากันได้อันดับเดียวกันแต่ไม่ข้ามลำดับ (1, 2, 2, 3)</li>
        <li><code>PARTITION BY column</code>: แบ่งกลุ่มการจัดอันดับแยกตามแต่ละหมวดหมู่</li>
      </ul>
    `,
    tip: "<code>PARTITION BY</code> ทำหน้าที่เหมือนการ GROUP BY ในระดับของ Window Function แต่ละกลุ่มจะเริ่มนับลำดับใหม่จาก 1",
    sql: `SELECT 
  c.name AS category_name,
  p.name AS product_name,
  p.price,
  RANK() OVER (ORDER BY p.price DESC) AS overall_rank,
  DENSE_RANK() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS rank_in_category
FROM products p
JOIN categories c ON p.category_id = c.category_id
ORDER BY p.category_id, rank_in_category;`,
    challenge: {
      question: "จัดอันดับลูกค้าตามยอดการใช้จ่ายรวม โดยใช้ฟังก์ชัน <code>RANK() OVER (ORDER BY total_spent DESC)</code>",
      hint: "ใช้ CTE คำนวณ total_spent ก่อน แล้วใช้ RANK() OVER (ORDER BY total_spent DESC)",
      solution: "WITH customer_spending AS (SELECT c.customer_id, c.name, SUM(oi.quantity * oi.unit_price) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.customer_id, c.name) SELECT name, total_spent, RANK() OVER (ORDER BY total_spent DESC) AS spending_rank FROM customer_spending;",
      requiredColumns: ["spending_rank"]
    }
  },
  {
    id: 20,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 20 · Window Fn",
    title: "Window Functions — Running Total & LAG / LEAD",
    description: `
      <p>การวิเคราะห์แนวโน้มยอดขายและข้อมูลอนุกรมเวลา (Time Series Analytics):</p>
      <ul>
        <li><strong>Running Total</strong>: <code>SUM(revenue) OVER (ORDER BY order_date)</code> คำนวณยอดสะสมทบต้นไปเรื่อยๆ</li>
        <li><strong>LAG(col, 1)</strong>: ดึงค่าของแถวก่อนหน้า 1 แถว (ใช้หาอัตราเติบโตเทียบงวดก่อน)</li>
        <li><strong>LEAD(col, 1)</strong>: ดึงค่าของแถวถัดไป 1 แถว</li>
      </ul>
    `,
    tip: "ฟังก์ชันเหล่านี้มีประโยชน์อย่างมากในงาน Data Analyst, Data Engineer และการจัดทำ Business Intelligence Dashboard",
    sql: `WITH daily_sales AS (
  SELECT 
    o.order_date,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS daily_revenue
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY o.order_date
)
SELECT 
  order_date,
  daily_revenue,
  LAG(daily_revenue, 1) OVER (ORDER BY order_date) AS prev_day_revenue,
  SUM(daily_revenue) OVER (ORDER BY order_date) AS running_total_revenue
FROM daily_sales
ORDER BY order_date;`,
    challenge: {
      question: "คำนวณยอดขายสะสม (Running Total) ของรายการสินค้าในตาราง order_items เรียงตาม order_item_id",
      hint: "ใช้ <code>SUM(quantity * unit_price) OVER (ORDER BY order_item_id) AS cumulative_sales</code>",
      solution: "SELECT order_item_id, order_id, (quantity * unit_price) AS item_total, SUM(quantity * unit_price) OVER (ORDER BY order_item_id) AS cumulative_sales FROM order_items;"
    }
  },

  // ==========================================
  // หมวดที่ 7: ความปลอดภัยและ Performance (Security & Tuning)
  // ==========================================
  {
    id: 21,
    category: "security",
    categoryLabel: "ความปลอดภัย & Performance",
    level: "บทที่ 21 · Security",
    title: "SQL Injection & Parameters — ช่องโหว่อันตรายอันดับต้นของโลก",
    description: `
      <p><strong>SQL Injection</strong> คือการโจมตีที่ผู้ไม่หวังดี "ฝัง" คำสั่ง SQL ลงในช่องกรอกข้อมูล โดยอาศัยความผิดพลาดของโปรแกรมเมอร์ที่นำ input ของผู้ใช้ไปต่อ string ตรงๆ เช่น <code>"SELECT * FROM customers WHERE email = '" + input + "'"</code></p>
      <p>ทางแก้ที่ได้ผลจริงคือ <strong>Parameterized Query (Prepared Statement)</strong> — ส่งค่าเข้าไป "bind" แยกจากตัวคำสั่ง ทำให้ input ถูกตีความเป็น "ข้อมูล" เสมอ ไม่มีทางกลายเป็น SQL ได้:</p>
      <pre>const stmt = db.prepare("SELECT * FROM customers WHERE email = ?");
stmt.getAsObject([userInput]); // ปลอดภัย — input ไม่ถูกตีความเป็น SQL</pre>
      <p>แอปนี้รันอยู่ใน sandbox ของเบราว์เซอร์ จึงลองจำลองการโจมตีได้อย่างปลอดภัยเพื่อความเข้าใจ</p>
      <p>👉 ภาคปฏิบัติ: เปิด <strong>🔐 Injection Lab</strong> ที่แถบด้านซ้าย เพื่อยิง payload ใส่ระบบ Login จำลองด้วยตัวเอง แล้วสลับไปดูว่า prepared statement ป้องกันได้อย่างไร</p>
    `,
    tip: "กฎทอง: ถ้าค่าจากผู้ใช้ปะปนอยู่ใน string ของคำสั่ง SQL แม้แต่จุดเดียว ถือว่ามีช่องโหว่ — ใช้ <code>? parameter</code> เสมอ และกรณีใช้ <code>LIKE</code> ต้องระวัง wildcard (<code>% _</code>) ที่ผู้ใช้ส่งมาด้วย",
    sql: `-- ปกติ: แอปค้นหาลูกค้าจากอีเมลที่รับมาจากฟอร์ม
SELECT customer_id, name, email FROM customers WHERE email = 'somchai@example.com';

-- แต่ถ้าต่อ string ตรงๆ และผู้โจมตีพิมพ์ในช่องฟอร์มว่า:  ' OR '1'='1
-- คำสั่งที่ถูกประกอบขึ้นมาจะกลายเป็น:
SELECT customer_id, name, email FROM customers WHERE email = '' OR '1'='1';
-- ผลลัพธ์: ข้อมูลลูกค้า "ทุกคน" รั่วไหลออกมาทั้งหมด!`,
    challenge: {
      question: "จำลองการโจมตีเพื่อทำความเข้าใจ (ใน sandbox ของตัวเอง): เขียนคำสั่ง SELECT แสดง <code>customer_id, name, email</code> ของลูกค้า <strong>ทั้งหมด</strong> โดยใช้ช่องโหว่ always-true condition ผ่านคอลัมน์ <code>email</code> (เหมือนผู้โจมตีพิมพ์ <code>' OR '1'='1</code> ในฟอร์ม)",
      hint: "ใช้ <code>WHERE email = '' OR '1'='1'</code>",
      solution: "SELECT customer_id, name, email FROM customers WHERE email = '' OR '1'='1';",
      unordered: true
    }
  },
  {
    id: 22,
    category: "security",
    categoryLabel: "ความปลอดภัย & Performance",
    level: "บทที่ 22 · Security",
    title: "Transactions — BEGIN, COMMIT & ROLLBACK กู้ข้อมูลคืนได้",
    description: `
      <p><strong>Transaction</strong> คือการห่อหุ้มหลายคำสั่งให้เป็น "หน่วยเดียว" — จะสำเร็จทั้งชุด หรือยกเลิกทั้งชุด</p>
      <ul>
        <li><code>BEGIN;</code> — เริ่ม transaction</li>
        <li><code>COMMIT;</code> — ยืนยันการเปลี่ยนแปลงทั้งหมดถาวร</li>
        <li><code>ROLLBACK;</code> — ย้อนกลับทุกการเปลี่ยนแปลง เหมือนไม่เคยเกิดอะไรขึ้น</li>
      </ul>
      <p>เหมาะอย่างยิ่งกับงานที่ต้องแก้หลายตารางพร้อมกัน เช่น การโอนเงิน: หักบัญชี A และเพิ่มบัญชี B ต้องเกิดพร้อมกัน ถ้าอันใดอันหนึ่งพัง ต้องย้อนทั้งคู่ (Atomicity)</p>
    `,
    tip: "แนวปฏิบัติ: เขียน <code>BEGIN;</code> ... ตรวจสอบผลด้วย SELECT ... ถ้าตรงเป้าจึง <code>COMMIT;</code> ไม่งั้นก็ <code>ROLLBACK;</code> — ปลอดภัยกว่ารัน DML เปล่าๆ",
    sql: `BEGIN TRANSACTION;

UPDATE products SET stock = stock - 5 WHERE product_id = 1;
DELETE FROM order_items WHERE order_id = 108;

-- ตรวจสอบก่อนว่าการเปลี่ยนแปลงเป็นไปตามต้องการหรือไม่
SELECT product_id, name, stock FROM products WHERE product_id = 1;

ROLLBACK; -- ยกเลิกทุกอย่างข้างบน

-- ตรวจอีกครั้ง: ข้อมูลกลับมาเหมือนเดิม 100%
SELECT product_id, name, stock FROM products WHERE product_id = 1;`,
    challenge: {
      question: "ทำการเปลี่ยนแปลงใน transaction เดียว: ปรับ <code>stock</code> ของสินค้า <code>product_id = 10</code> ให้เป็น <code>50</code> แล้วยืนยันด้วย <code>COMMIT</code>",
      hint: "ครอบคำสั่งด้วย <code>BEGIN;</code> ... <code>COMMIT;</code> (หรือ <code>BEGIN TRANSACTION;</code> ก็ได้)",
      solution: "BEGIN; UPDATE products SET stock = 50 WHERE product_id = 10; COMMIT;"
    }
  },
  {
    id: 23,
    category: "security",
    categoryLabel: "ความปลอดภัย & Performance",
    level: "บทที่ 23 · DDL",
    title: "DDL & Constraints — CREATE, ALTER, PK, FK, UNIQUE, CHECK",
    description: `
      <p><strong>DDL (Data Definition Language)</strong> คือกลุ่มคำสั่งสำหรับสร้างและแก้ไข "โครงสร้าง" ฐานข้อมูล:</p>
      <ul>
        <li><code>CREATE TABLE ...</code> — สร้างตารางใหม่ พร้อมกำหนดข้อจำกัด (Constraints)</li>
        <li><code>ALTER TABLE ... ADD COLUMN</code> — เพิ่มคอลัมน์ให้ตารางที่มีอยู่</li>
        <li><code>DROP TABLE ...</code> — ลบตารางทิ้ง (ระวังมาก!)</li>
      </ul>
      <p>Constraints คือ "ด่านตรวจ" ที่ฐานข้อมูลบังคับใช้เองเพื่อความถูกต้องของข้อมูล (Data Integrity):</p>
      <ul>
        <li><code>PRIMARY KEY</code> — รหัสเฉพาะ ไม่ซ้ำ และไม่เป็น NULL</li>
        <li><code>FOREIGN KEY ... REFERENCES</code> — บังคับความสัมพันธ์ระหว่างตาราง</li>
        <li><code>UNIQUE</code> / <code>NOT NULL</code> / <code>DEFAULT</code> / <code>CHECK (เงื่อนไข)</code></li>
      </ul>
    `,
    tip: "ลองแก้คอมเมนต์ด้านล่างเพื่อทดสอบ constraint: INSERT รหัสซ้ำจะโดน <code>UNIQUE</code> ขัดขวาง, ใส่ส่วนลด 150 จะโดน <code>CHECK</code> ปฏิเสธ — ข้อมูลที่ผิดหลักเกณฑ์เข้าสู่ระบบไม่ได้เลย",
    sql: `CREATE TABLE coupons (
  coupon_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent REAL CHECK (discount_percent BETWEEN 0 AND 100),
  expires_date TEXT DEFAULT '2026-12-31'
);

INSERT INTO coupons (coupon_id, code, discount_percent) VALUES
  (1, 'SALE2026', 15.5),
  (2, 'NEWYEAR', 30);

SELECT * FROM coupons;

ALTER TABLE coupons ADD COLUMN is_active INTEGER DEFAULT 1;

INSERT INTO coupons (coupon_id, code) VALUES (3, 'FREESHIP');
SELECT * FROM coupons;

-- ทดลองปลดคอมเมนต์บรรทัดล่างเพื่อดู constraint ทำงาน:
-- INSERT INTO coupons VALUES (4, 'SALE2026', 20);  -- ผิด UNIQUE (code ซ้ำ)
-- INSERT INTO coupons VALUES (5, 'BAD', 150);       -- ผิด CHECK (เกิน 100)`,
    challenge: {
      question: "สร้างตารางใหม่ชื่อ <code>suppliers</code> ที่มีคอลัมน์: <code>supplier_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>phone TEXT</code> แล้วแทรก 1 แถว: <code>supplier_id = 1</code>, ชื่อ <code>'Thai Tech Supply'</code>, โทร <code>'02-123-4567'</code>",
      hint: "ใช้ <code>CREATE TABLE suppliers (...);</code> ตามด้วย <code>INSERT INTO suppliers (supplier_id, name, phone) VALUES (1, 'Thai Tech Supply', '02-123-4567');</code>",
      solution: "CREATE TABLE suppliers (supplier_id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT); INSERT INTO suppliers (supplier_id, name, phone) VALUES (1, 'Thai Tech Supply', '02-123-4567');"
    }
  },
  {
    id: 24,
    category: "security",
    categoryLabel: "ความปลอดภัย & Performance",
    level: "บทที่ 24 · Performance",
    title: "Views, Indexes & EXPLAIN — เร่งความเร็วและใช้ Query ซ้ำ",
    description: `
      <p><strong>VIEW</strong> คือ "query ที่ถูกตั้งชื่อและบันทึกไว้" ทำตัวเหมือนตารางเสมือน — เหมาะกับ query ที่ต้องใช้ซ้ำบ่อยๆ ทำให้ไม่ต้องเขียน JOIN ยาวๆ ทุกครั้ง และช่วยซ่อนความซับซ้อนจากผู้ใช้</p>
      <p><strong>INDEX</strong> เปรียบเหมือนสารบัญของหนังสือ ช่วยให้ฐานข้อมูล "ค้นเจอ" แถวที่ต้องการโดยไม่ต้องสแกนทั้งตาราง (Full Table Scan) — โดยเฉพาะคอลัมน์ที่ถูกค้นหาบ่อย เช่น email หรือ FK</p>
      <p>ตรวจสอบได้จริงด้วย <code>EXPLAIN QUERY PLAN</code> ว่า query ของเราใช้ index หรือกำลังสแกนทั้งตารางอยู่</p>
      <p>👉 ภาคปฏิบัติ: เปิด <strong>⚡ Performance Lab</strong> ที่แถบด้านซ้าย เพื่อลอง SCAN vs INDEX กับข้อมูล 100,000 แถวจริง ๆ พร้อมเห็น Query Plan เปลี่ยนต่อหน้า</p>
    `,
    tip: "Index ไม่ฟรี: ทุก INSERT/UPDATE/DELETE ต้องอัปเดต index ด้วย — สร้างเฉพาะคอลัมน์ที่ถูกค้นหาจริง และหลีกเลี่ยง index ซ้ำซ้อน",
    sql: `-- 1) VIEW: รายงานยอดขายรายสินค้า พร้อมใช้ซ้ำเหมือนตารางปกติ
CREATE VIEW IF NOT EXISTS v_product_sales AS
SELECT 
  p.product_id,
  p.name,
  COUNT(oi.order_item_id) AS times_sold,
  COALESCE(SUM(oi.quantity), 0) AS total_qty
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name;

SELECT * FROM v_product_sales ORDER BY total_qty DESC;

-- 2) INDEX: สร้างสารบัญให้คอลัมน์ email
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 3) EXPLAIN QUERY PLAN: ดูว่า engine ใช้ index (SEARCH) หรือสแกนทั้งตาราง (SCAN)
EXPLAIN QUERY PLAN SELECT * FROM customers WHERE email = 'somchai@example.com';`,
    challenge: {
      question: "สร้าง VIEW ชื่อ <code>v_gold_customers</code> ที่เลือกลูกค้าทุกคนที่ <code>member_tier = 'Gold'</code> จากตาราง <code>customers</code>",
      hint: "ใช้ <code>CREATE VIEW v_gold_customers AS SELECT * FROM customers WHERE member_tier = 'Gold';</code>",
      solution: "CREATE VIEW v_gold_customers AS SELECT * FROM customers WHERE member_tier = 'Gold';"
    }
  },

  // ==========================================
  // บทเรียนเสริมหมวดต่างๆ (Set Operations, Joins ขั้นเต็ม, UPSERT)
  // ==========================================
  {
    id: 25,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 25 · Set Ops",
    title: "UNION & EXISTS — รวมชุดผลลัพธ์และตรวจการมีอยู่",
    description: `
      <p><strong>UNION</strong> ใช้ "วางซ้อน" ผลลัพธ์ของ 2 query ให้เป็นชุดเดียว โดยทั้งสองฝั่งต้องมีจำนวนคอลัมน์เท่ากันและชนิดข้อมูลเข้ากันได้:</p>
      <ul>
        <li><code>UNION</code> — ตัดแถวที่ซ้ำกันทิ้งอัตโนมัติ</li>
        <li><code>UNION ALL</code> — คงแถวซ้ำไว้ (เร็วกว่า เพราะไม่ต้องตรวจซ้ำ)</li>
      </ul>
      <p><strong>EXISTS / NOT EXISTS</strong> ใช้ตรวจว่า "มีอย่างน้อย 1 แถว" ที่ตรงเงื่อนไขหรือไม่ — เป็น Correlated Subquery ที่อ่านง่าย และมักมีประสิทธิภาพดีกว่า <code>IN</code> ในตารางขนาดใหญ่ เพราะหยุดทันทีที่เจอแถวแรก</p>
    `,
    tip: "เคล็ดลับจำแนก: ใช้ <code>UNION</code> เมื่อต้องการ “แถวจากหลายแหล่ง” แต่คอลัมน์เหมือนกัน / ใช้ <code>JOIN</code> เมื่อต้องการ “ข้อมูลของสองตารางมาต่อกันในแถวเดียว”",
    sql: `-- UNION: ลูกค้ากรุงเทพฯ รวมกับลูกค้า Gold (แถวซ้ำถูกตัดอัตโนมัติ)
SELECT name, city FROM customers WHERE city = 'กรุงเทพฯ'
UNION
SELECT name, city FROM customers WHERE member_tier = 'Gold';

-- UNION ALL: เหมือนกันแต่คงแถวซ้ำ (สังเกตจำนวนแถวมากกว่า)
SELECT name, city FROM customers WHERE city = 'กรุงเทพฯ'
UNION ALL
SELECT name, city FROM customers WHERE member_tier = 'Gold';

-- EXISTS: ลูกค้าที่เคยมีออเดอร์สำเร็จ (completed) อย่างน้อย 1 รายการ
SELECT c.customer_id, c.name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.customer_id AND o.status = 'completed'
);`,
    challenge: {
      question: "ใช้ <code>NOT EXISTS</code> ค้นหาลูกค้าที่ <strong>ไม่เคยเขียนรีวิว</strong> เลยแม้แต่ครั้งเดียว แสดง <code>customer_id</code> และ <code>name</code>",
      hint: "ใช้ <code>WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.customer_id)</code>",
      solution: "SELECT c.customer_id, c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.customer_id = c.customer_id);",
      unordered: true
    }
  },
  {
    id: 26,
    category: "joins",
    categoryLabel: "เชื่อมโยงตาราง",
    level: "บทที่ 26 · Joins",
    title: "SELF, RIGHT, FULL & CROSS JOIN — ครบเครื่องเรื่องการเชื่อมตาราง",
    description: `
      <p><strong>SELF JOIN</strong> — เชื่อมตาราง "กับตัวเอง" โดยสมมติให้เป็น 2 สำเนา (ใช้ alias ต่างกัน) เหมาะกับข้อมูลที่มีความสัมพันธ์ในตารางเดียวกัน เช่น หาคู่สินค้าที่อยู่หมวดเดียวกัน</p>
      <p><strong>RIGHT JOIN</strong> — มิเรอร์ของ LEFT JOIN (ดึงทุกแถวฝั่งขวา) ส่วน <strong>FULL OUTER JOIN</strong> — ดึงทุกแถวจากทั้งสองฝั่ง ไม่ว่าจะมีคู่หรือไม่ ใช้ตรวจหา "ข้อมูลกำพร้า" ได้ยอดเยี่ยม</p>
      <p><strong>CROSS JOIN</strong> — คู่ทุกแถวกับทุกแถว (Cartesian Product) จำนวนแถว = แถวA × แถวB ต้องระวังขนาดผลลัพธ์ระเบิด!</p>
    `,
    tip: "รันตัวอย่างนี้ซ้ำรอบที่สองอาจเจอ UNIQUE constraint (review_id ซ้ำ) — กดปุ่ม 'รีเซ็ต DB' เพื่อคืนค่าเดิมได้เสมอ",
    sql: `-- SELF JOIN: จับคู่สินค้าที่อยู่หมวดเดียวกัน (เงื่อนไข a < b ป้องกันจับคู่ตัวเอง/ซ้ำกลับด้าน)
SELECT a.category_id, a.name AS product_a, b.name AS product_b
FROM products a
JOIN products b ON a.category_id = b.category_id AND a.product_id < b.product_id
ORDER BY a.category_id, product_a;

-- จำลอง "รีวิวกำพร้า" = รีวิวที่อ้างถึงสินค้าที่ถูกลบไปแล้ว
INSERT INTO reviews (review_id, product_id, customer_id, rating, comment, review_date)
VALUES (7, 999, 1, 3, 'สินค้าหายไปจากคลัง?', '2026-03-01');

-- FULL OUTER JOIN: เห็นทั้งสินค้าที่ไม่มีรีวิว (ฝั่งขวา NULL) และรีวิวกำพร้า (ฝั่งซ้าย NULL)
SELECT p.name AS product_name, r.rating, r.comment
FROM products p
FULL OUTER JOIN reviews r ON p.product_id = r.product_id
ORDER BY p.product_id;

-- CROSS JOIN: จำนวนคู่ที่เป็นไปได้ทั้งหมด (จำนวนสินค้า × จำนวนหมวดหมู่)
SELECT COUNT(*) AS all_possible_pairs FROM products CROSS JOIN categories;`,
    challenge: {
      question: "ใช้ SELF JOIN แสดงคู่สินค้าทั้งหมดที่อยู่หมวดหมู่เดียวกัน — แสดง <code>category_id</code> กับชื่อสินค้าทั้งสองฝั่ง (ตั้ง alias <code>product_a</code>, <code>product_b</code>) โดยไม่จับคู่ตัวเองและไม่ซ้ำกลับด้าน เรียงตาม <code>category_id</code> แล้ว <code>product_a</code>",
      hint: "ใช้ <code>FROM products a JOIN products b ON a.category_id = b.category_id AND a.product_id < b.product_id</code>",
      solution: "SELECT a.category_id, a.name AS product_a, b.name AS product_b FROM products a JOIN products b ON a.category_id = b.category_id AND a.product_id < b.product_id ORDER BY a.category_id, product_a;"
    }
  },
  {
    id: 27,
    category: "dml",
    categoryLabel: "จัดการข้อมูล",
    level: "บทที่ 27 · DML",
    title: "UPSERT — INSERT ... ON CONFLICT DO UPDATE",
    description: `
      <p><strong>UPSERT</strong> = INSERT + UPDATE ในคำสั่งเดียว: "ถ้ายังไม่มีแถวนี้ให้เพิ่ม แต่ถ้ามีแล้วให้แก้ไข"</p>
      <pre>INSERT INTO table (pk, col) VALUES (...)
ON CONFLICT (pk) DO UPDATE SET col = excluded.col;</pre>
      <p><code>excluded</code> คือค่าชุดใหม่ที่กำลังจะถูก insert — นำมาใช้ในส่วน UPDATE ได้</p>
      <p>ใช้มากในระบบจริง เช่น ซิงค์ข้อมูล, นับยอด view, เก็บสถานะล่าสุด โดยไม่ต้องเขียน logic ตรวจซ้ำเอง และเป็น atomic (ไม่มีช่วงจังหวะที่ข้อมูลซ้ำซ้อน)</p>
    `,
    tip: "ถ้าต้องการ “ถ้ามีแล้วให้เฉยๆ ไว้” ใช้ <code>ON CONFLICT (pk) DO NOTHING</code> — สั้นที่สุดและไม่ error",
    sql: `-- ครั้งแรก: ยังไม่มี product_id 11 → เป็นการ INSERT
INSERT INTO products (product_id, name, category_id, price, stock)
VALUES (11, 'RGB Mousepad XL', 2, 590.00, 50)
ON CONFLICT (product_id) DO UPDATE SET stock = stock + excluded.stock;

-- ครั้งที่สอง (คำสั่งเดิม): ชน PK 11 ที่มีอยู่แล้ว → กลายเป็น UPDATE เพิ่มสต็อก 50 → รวมเป็น 100
INSERT INTO products (product_id, name, category_id, price, stock)
VALUES (11, 'RGB Mousepad XL', 2, 590.00, 50)
ON CONFLICT (product_id) DO UPDATE SET stock = stock + excluded.stock;

SELECT product_id, name, stock FROM products WHERE product_id = 11;`,
    challenge: {
      question: "ใช้ UPSERT กับตาราง <code>categories</code>: ถ้า <code>category_id = 5</code> ยังไม่มีให้เพิ่มหมวด <code>'Gaming Gear'</code> (คำอธิบาย <code>'อุปกรณ์เกมมิ่งมืออาชีพ'</code>) แต่ถ้ามีอยู่แล้วให้อัปเดตชื่อและคำอธิบายเป็นค่านี้ (คำสั่งเดียวกันต้องได้ผลทั้งสองกรณี)",
      hint: "ใช้ <code>ON CONFLICT (category_id) DO UPDATE SET name = excluded.name, description = excluded.description</code>",
      solution: "INSERT INTO categories (category_id, name, description) VALUES (5, 'Gaming Gear', 'อุปกรณ์เกมมิ่งมืออาชีพ') ON CONFLICT (category_id) DO UPDATE SET name = excluded.name, description = excluded.description;"
    }
  },
  {
    id: 28,
    category: "aggregation",
    categoryLabel: "คำนวณและสรุปผล",
    level: "บทที่ 28 · Pivot",
    title: "Conditional Aggregation — SUM(CASE WHEN) ทำ Pivot Table",
    description: `
      <p><strong>Conditional Aggregation</strong> คือการผสม <code>CASE WHEN</code> เข้ากับฟังก์ชันสรุปผล เพื่อ "หมุน" ข้อมูลแนวตั้งให้เป็นคอลัมน์แนวนอน (Pivot) โดยไม่ต้องมี PIVOT operator เหมือนฐานข้อมูลอื่น</p>
      <pre>SELECT dimension,
  SUM(CASE WHEN เงื่อนไข THEN 1 ELSE 0 END) AS นับตามเงื่อนไข,
  SUM(CASE WHEN เงื่อนไข THEN amount ELSE 0 END) AS รวมยอดตามเงื่อนไข
FROM ... GROUP BY dimension;</pre>
      <p>รูปแบบนี้คือ "สูตรลับ" ที่ Data Analyst ใช้จริงทุกวัน เช่น นับออเดอร์แยกสถานะเป็นคอลัมน์ของแต่ละจังหวัดใน query เดียว</p>
    `,
    tip: "<code>100.0 * ... / COUNT(*)</code> — ใส่ <code>.0</code> เสมอเพื่อบังคับให้ SQL หารแบบทศนิยม ไม่ใช่ตัดเศษแบบจำนวนเต็ม",
    sql: `SELECT
  c.city,
  COUNT(*) AS total_orders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed,
  SUM(CASE WHEN o.status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
  SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
  ROUND(100.0 * SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 1) AS completed_pct
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.city
ORDER BY total_orders DESC;`,
    challenge: {
      question: "สร้าง Pivot: นับจำนวนสินค้าแยกตามหมวดหมู่ (แถว) แยกตามช่วงราคา (คอลัมน์) — แสดงชื่อหมวดหมู่ (<code>category</code>) คอลัมน์ <code>price_lt_2000</code> (ราคา &lt; 2000) และ <code>price_gte_2000</code> (ราคา &gt;= 2000) เรียงตามชื่อหมวด",
      hint: "ใช้ <code>SUM(CASE WHEN p.price &lt; 2000 THEN 1 ELSE 0 END) AS price_lt_2000</code> และทำคอลัมน์ gte แบบเดียวกัน แล้ว <code>GROUP BY c.name</code>",
      solution: "SELECT c.name AS category, SUM(CASE WHEN p.price < 2000 THEN 1 ELSE 0 END) AS price_lt_2000, SUM(CASE WHEN p.price >= 2000 THEN 1 ELSE 0 END) AS price_gte_2000 FROM products p JOIN categories c ON p.category_id = c.category_id GROUP BY c.name ORDER BY category;",
      requiredColumns: ["price_lt_2000", "price_gte_2000"]
    }
  },
  {
    id: 29,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 29 · Recursive",
    title: "Recursive CTE — สร้างชุดข้อมูลเองแบบวนซ้ำ",
    description: `
      <p><strong>WITH RECURSIVE</strong> ให้ CTE อ้างถึงตัวเองเพื่อ "ผลิต" แถวขึ้นมาเองทีละรอบ จนกว่าจะถึงเงื่อนไขสิ้นสุด:</p>
      <pre>WITH RECURSIVE counter(n) AS (
  SELECT 1              -- จุดเริ่ม (base case)
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 10   -- วนซ้ำ (recursive part)
)
SELECT * FROM counter;</pre>
      <p>ใช้ทำอะไรได้มากมาย: สร้างปฏิทิน/ลำดับวันที่, เลขลำดับ, ไล่ลำดับชั้นองค์กร (ต้นไม้), หรือ "ระเบิด" 1 แถวที่มี quantity = 3 ให้กลายเป็น 3 แถว</p>
    `,
    tip: "ต้องมีเงื่อนไขสิ้นสุด (base case + WHERE จำกัดรอบ) เสมอ ไม่อย่างนั้น query จะวนไม่รู้จบและแขวนเบราว์เซอร์ไปเลย",
    sql: `-- 1) สร้างลำดับวันที่ทุก 7 วัน ตลอดปี 2026 (ทำปฏิทินรายสัปดาห์)
WITH RECURSIVE week_dates(d) AS (
  SELECT DATE('2026-01-01')
  UNION ALL
  SELECT DATE(d, '+7 days') FROM week_dates WHERE d < '2026-12-01'
)
SELECT d AS week_start, strftime('%m', d) AS month FROM week_dates;

-- 2) "ระเบิด" แถว: สร้างเลข 1-10 แล้วจับคู่กับ quantity เพื่อให้แต่ละ "ชิ้น" ของสินค้ากลายเป็น 1 แถว
WITH RECURSIVE seq(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 10
)
SELECT oi.order_item_id, s.n AS unit_no, oi.product_id
FROM order_items oi
JOIN seq s ON s.n <= oi.quantity
WHERE oi.order_id = 107
ORDER BY oi.order_item_id, s.n;`,
    challenge: {
      question: "ใช้ <code>WITH RECURSIVE</code> สร้างตารางตัวเลข 1 ถึง 20 โดยมีคอลัมน์เดียวชื่อ <code>n</code>",
      hint: "โครงสร้าง: <code>WITH RECURSIVE numbers(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM numbers WHERE n &lt; 20) SELECT n FROM numbers;</code>",
      solution: "WITH RECURSIVE numbers(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM numbers WHERE n < 20) SELECT n FROM numbers;"
    }
  },
  {
    id: 30,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 30 · Window Fn",
    title: "Window Functions ขั้นสูง — NTILE, FIRST_VALUE & Window Frames",
    description: `
      <p>เกินกว่า RANK และ Running Total — Window Functions ยังมีความสามารถที่ใช้บ่อยในงาน Analytics:</p>
      <ul>
        <li><code>NTILE(n)</code> — แบ่งแถวเป็น n กลุ่มที่เท่าๆ กัน (เช่น แบ่งลูกค้าเป็น 3 กลุ่ม สูง/กลาง/ต่ำ)</li>
        <li><code>FIRST_VALUE(col) / LAST_VALUE(col)</code> — ดึงค่าแรก/ค่าสุดท้ายใน window นั้นๆ</li>
        <li><code>ROWS BETWEEN ... AND ...</code> — กำหนดกรอบ (Frame) ของการคำนวณ เช่น Moving Average 3 แถว</li>
      </ul>
      <p>ข้อควรรู้: <code>LAST_VALUE</code> ต้องระบุ <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> ไม่งั้น frame เริ่มต้นจะหยุดที่ "แถวปัจจุบัน" ทำให้ได้ค่าตัวเองแทนค่าสุดท้ายจริง</p>
    `,
    tip: "Moving Average เป็นเครื่องมือพื้นฐานของการวิเคราะห์แนวโน้ม — ปรับช่วง <code>BETWEEN 2 PRECEDING AND 2 FOLLOWING</code> คือ MA 5 แถวได้ทันที",
    sql: `SELECT
  name,
  price,
  NTILE(2) OVER (ORDER BY price DESC) AS price_half,
  FIRST_VALUE(name) OVER (ORDER BY price DESC) AS most_expensive,
  LAST_VALUE(name) OVER (ORDER BY price DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS cheapest,
  ROUND(AVG(price) OVER (ORDER BY price DESC ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2) AS moving_avg_3
FROM products
ORDER BY price DESC;`,
    challenge: {
      question: "แสดงทุกสินค้า (ชื่อ, ชื่อหมวดหมู่, ราคา) พร้อมคอลัมน์ <code>top_product</code> ที่แสดงชื่อสินค้า “ราคาสูงสุดในหมวดเดียวกัน” โดยใช้ <code>FIRST_VALUE</code> + <code>PARTITION BY</code> — เรียงผลลัพธ์ตาม <code>category_id</code> และราคาจากสูงไปต่ำ",
      hint: "ใช้ <code>FIRST_VALUE(p.name) OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS top_product</code> และปิดท้ายด้วย <code>ORDER BY p.category_id, p.price DESC</code>",
      solution: "SELECT p.name, c.name AS category_name, p.price, FIRST_VALUE(p.name) OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS top_product FROM products p JOIN categories c ON p.category_id = c.category_id ORDER BY p.category_id, p.price DESC;",
      requiredColumns: ["top_product"]
    }
  },
  {
    id: 31,
    category: "advanced",
    categoryLabel: "ขั้นสูง & Analytics",
    level: "บทที่ 31 · Capstone",
    title: "Capstone — วิเคราะห์ลูกค้าด้วย RFM Segmentation",
    description: `
      <p><strong>RFM</strong> คือเทคนิค segment ลูกค้าคลาสสิกที่ใช้กันทั่วโลกในงาน CRM/Marketing:</p>
      <ul>
        <li><strong>R</strong>ecency — เพิ่งซื้อล่าสุดเมื่อไหร่ (ยิ่งเร็วยิ่งดี)</li>
        <li><strong>F</strong>requency — ซื้อบ่อยแค่ไหน</li>
        <li><strong>M</strong>onetary — ใช้จ่ายรวมเท่าไหร่</li>
      </ul>
      <p>บทนี้รวมทุกอย่างที่เรียนมา: <strong>JOIN 3 ตาราง + GROUP BY + CTE + Window Function (NTILE)</strong> ใน query เดียว — ลองอ่านทีละส่วนแล้วดูว่าแต่ละบล็อกคือบทเรียนไหน</p>
    `,
    tip: "NTILE(3) จะแบ่งลูกค้าเป็น 3 กลุ่มเท่าๆ กัน (score 1 = กลุ่มดีที่สุด) — ในระบบจริงมักตีความว่า 111 = Champion, 311 = ลูกค้าใหม่, 133 = กำลังหลุดมือ (ต้องดึงกลับ)",
    sql: `WITH customer_stats AS (
  SELECT
    c.customer_id,
    c.name,
    CAST(julianday('now') - julianday(MAX(o.order_date)) AS INTEGER) AS recency_days,
    COUNT(DISTINCT o.order_id) AS frequency,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS monetary
  FROM customers c
  JOIN orders o ON c.customer_id = o.customer_id
  JOIN order_items oi ON o.order_id = oi.order_id
  GROUP BY c.customer_id, c.name
)
SELECT
  name,
  recency_days,
  frequency,
  monetary,
  NTILE(3) OVER (ORDER BY recency_days ASC)  AS r_score,
  NTILE(3) OVER (ORDER BY frequency DESC)    AS f_score,
  NTILE(3) OVER (ORDER BY monetary DESC)     AS m_score
FROM customer_stats
ORDER BY monetary DESC;`,
    challenge: {
      question: "Final Boss 👑: หาลูกค้า <strong>VIP</strong> — ลูกค้าที่ยอดใช้จ่ายรวม (จาก orders + order_items) <strong>มากกว่าค่าเฉลี่ยของลูกค้าทุกคน</strong> แสดงเฉพาะ <code>name</code> และ <code>total_spent</code> (ปัดทศนิยม 2 ตำแหน่ง) เรียงจากยอดมากไปน้อย (ใช้ CTE + subquery)",
      hint: "สร้าง CTE <code>spending</code> คำนวณ <code>ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_spent</code> ต่อลูกค้า แล้วกรองด้วย <code>WHERE total_spent &gt; (SELECT AVG(total_spent) FROM spending)</code>",
      solution: "WITH spending AS (SELECT c.customer_id, c.name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.customer_id, c.name) SELECT name, total_spent FROM spending WHERE total_spent > (SELECT AVG(total_spent) FROM spending) ORDER BY total_spent DESC;",
      requiredColumns: ["total_spent"]
    }
  },

  // ==========================================
  // หมวดที่ 8: Debug the SQL — แก้ Query ที่พัง
  // (type: "debug" → Editor จะโหลดโค้ดที่พังไว้ล่วงหน้า ผู้เรียนต้องแก้ให้ผลลัพธ์ถูกต้อง)
  // ==========================================
  {
    id: 32,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #1 · Syntax",
    title: "🐛 Syntax Error — อ่าน Error Message ให้เป็น",
    description: `
      <p>Debugger มืออาชีพเริ่มจาก<strong>อ่านข้อความ error ให้ถึงขั้น</strong> — SQLite จะบอก keyword ที่ตัวมันงง ณ จุดนั้น ซึ่งมักอยู่<strong>ใกล้ ๆ จุดที่พิมพ์ผิดจริง</strong></p>
      <p>Query ใน Editor มีจุดผิด 2 จุด: จุดหนึ่งทำให้เกิด error ทันที อีกจุดเป็น "ความเข้าใจผิดเชิง logic" ที่รันผ่านแต่ผลลัพธ์ผิดเพี้ยน</p>
      <p>กด <strong>▶ รัน SQL</strong> เพื่อดูอาการ แล้วไล่แก้ทีละจุด</p>
    `,
    tip: "วิธีไล่ syntax error: ดู keyword ใน error message → เปิดตาดูบรรทัดนั้น ๆ → ตรวจ spelling, comma และวงเล็บรอบข้างเสมอ",
    sql: `-- ❌ Query พัง: ตั้งใจแสดงชื่อและราคาสินค้าที่มีสต็อก
SELECT name price
FORM products
WHERE stock > 0;`,
    challenge: {
      question: "แก้ Query ให้แสดง <code>name</code> และ <code>price</code> ของสินค้าที่มีสต็อกมากกว่า 0",
      hint: "มี 2 จุด: (1) ลืม comma ระหว่างคอลัมน์ ทำให้ <code>price</code> กลายเป็น alias ของ name (2) พิมพ์ <code>FORM</code> แทน <code>FROM</code>",
      solution: "SELECT name, price FROM products WHERE stock > 0;",
      unordered: true
    }
  },
  {
    id: 33,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #2 · Aggregate",
    title: "🐛 WHERE vs HAVING — ใส่ SUM() ใน WHERE ไม่ได้",
    description: `
      <p>อาการ: กดรันแล้วเจอ error <code>misuse of aggregate function SUM()</code></p>
      <p>สาเหตุ: <code>WHERE</code> ทำงาน<em>ก่อน</em>การจัดกลุ่ม มันจึงเห็นทีละแถวเท่านั้น ไม่มีทางรู้ว่า SUM ของกลุ่มเป็นเท่าไหร่ — การกรองด้วยผลลัพธ์ของ aggregate ต้องใช้ <code>HAVING</code> ซึ่งทำงาน<em>หลัง</em> GROUP BY</p>
      <p>นี่คือ error คลาสสิกที่เจอบ่อยที่สุดตอนเขียน query สรุปยอด</p>
    `,
    tip: "จำลำดับการทำงาน: FROM → WHERE (ทีละแถว) → GROUP BY → HAVING (ทีละกลุ่ม) → SELECT → ORDER BY",
    sql: `-- ❌ ตั้งใจหา: ออเดอร์ที่มียอดรวมเกิน 3,000 บาท
SELECT order_id, ROUND(SUM(quantity * unit_price), 2) AS order_total
FROM order_items
WHERE SUM(quantity * unit_price) > 3000
GROUP BY order_id;`,
    challenge: {
      question: "แก้ Query ให้แสดง <code>order_id</code> พร้อมยอดรวม (<code>order_total</code> ปัดทศนิยม 2 ตำแหน่ง) ของออเดอร์ที่ยอดรวมเกิน 3,000 บาท",
      hint: "ย้ายเงื่อนไข aggregate จาก WHERE ไปไว้ที่ HAVING หลัง GROUP BY",
      solution: "SELECT order_id, ROUND(SUM(quantity * unit_price), 2) AS order_total FROM order_items GROUP BY order_id HAVING SUM(quantity * unit_price) > 3000;",
      unordered: true
    }
  },
  {
    id: 34,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #3 · NULL Trap",
    title: "🐛 หายไปตอน != — NULL กับการเปรียบเทียบ",
    description: `
      <p>อาการ: Query <strong>รันผ่าน ไม่มี error</strong> แต่แถว "หายไปเงียบ ๆ" — นี่คือบั๊กที่อันตรายกว่า syntax error เสียอีก เพราะไม่มีอะไรบอกเลยว่ามีปัญหา</p>
      <p>สาเหตุ: <code>payment_method != 'Cash on Delivery'</code> จะให้ผลเป็น NULL (ไม่ใช่ TRUE) กับแถวที่ payment_method เป็น NULL แถวเหล่านั้นจึงถูกกรองทิ้ง ทั้งที่ "ไม่ได้จ่ายด้วย COD" เป็นจริงสำหรับพวกมัน</p>
      <p>กฎ: การเปรียบเทียบใด ๆ กับ NULL (=, !=, <, >) ให้ผลเป็น NULL เสมอ — ต้องจัดการ NULL ด้วย IS NULL / COALESCE เท่านั้น</p>
    `,
    tip: "เมื่อไรก็ตามที่ใช้ != (หรือ <>) กับคอลัมน์ที่ nullable ให้ถามตัวเองทันที: 'แถว NULL ควรอยู่ในผลลัพธ์ไหม?' — ถ้าคำตอบคือควร ต้องเติม OR col IS NULL",
    sql: `-- ❌ ตั้งใจหา: ออเดอร์ที่ไม่ได้ชำระด้วย Cash on Delivery ทั้งหมด
-- แต่ออเดอร์ที่ยังไม่ได้ระบุวิธีชำระ (NULL) หายไป!
SELECT order_id, status, payment_method
FROM orders
WHERE payment_method != 'Cash on Delivery';`,
    challenge: {
      question: "แก้ Query ให้ได้ออเดอร์ที่ไม่ได้ชำระด้วย <code>Cash on Delivery</code> <strong>ทั้งหมด</strong> — รวมออเดอร์ที่ยังไม่ได้ระบุวิธีชำระเงิน (NULL) ด้วย แสดง <code>order_id</code>, <code>status</code>, <code>payment_method</code>",
      hint: "เติมเงื่อนไข <code>OR payment_method IS NULL</code> หรือใช้ <code>COALESCE(payment_method, '') != 'Cash on Delivery'</code>",
      solution: "SELECT order_id, status, payment_method FROM orders WHERE payment_method != 'Cash on Delivery' OR payment_method IS NULL;",
      unordered: true
    }
  },
  {
    id: 35,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #4 · JOIN",
    title: "🐛 INNER JOIN หาของที่ไม่มี — ผลลัพธ์ 0 แถว",
    description: `
      <p>อาการ: ต้องการหา "ลูกค้าที่ไม่เคยสั่งซื้อ" แต่ได้ 0 แถว ทั้งที่ข้อมูลจริงมีลูกค้าแบบนั้น</p>
      <p>สาเหตุ: <code>INNER JOIN</code> เก็บเฉพาะแถวที่มีคู่ตรงกันทั้งสองฝั่ง — ลูกค้าที่ไม่มีออเดอร์ถูกตัดทิ้งตั้งแต่ขั้น JOIN แล้ว การมาเช็ค <code>o.order_id IS NULL</code> ทีหลังจึงไม่มีทางเจอ</p>
      <p>แพทเทิร์น "หาสิ่งที่ไม่มี" (anti-join) ต้องใช้ <code>LEFT JOIN</code> เพื่อรักษาแถวฝั่งซ้ายไว้ แล้วค่อยกรองฝั่งขวาที่เป็น NULL</p>
    `,
    tip: "เจอผลลัพธ์ 0 แถวโดยไม่คาดคิด? ลองเอา WHERE ออกก่อน แล้วดูว่า JOIN อย่างเดียวเหลือกี่แถว — จะรู้ทันทีว่าการกรองตายตอนไหน",
    sql: `-- ❌ ตั้งใจหา: ลูกค้าที่ไม่เคยมีออเดอร์สักชิ้น — แต่ได้ 0 แถวเสมอ!
SELECT c.customer_id, c.name
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;`,
    challenge: {
      question: "แก้ Query ให้แสดง <code>customer_id</code> และ <code>name</code> ของลูกค้าที่<strong>ไม่เคยมีคำสั่งซื้อ</strong>เลย",
      hint: "เปลี่ยน INNER JOIN เป็น LEFT JOIN — ฝั่งขวาของแถวที่ไม่มีคู่จะเป็น NULL แล้ว WHERE o.order_id IS NULL ถึงจะทำงาน",
      solution: "SELECT c.customer_id, c.name FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;",
      unordered: true
    }
  },
  {
    id: 36,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #5 · Fan-out",
    title: "🐛 JOIN แล้วตัวเลขบวม — Duplicate Rows จาก 1:N",
    description: `
      <p>อาการ: นับจำนวนออเดอร์ต่อลูกค้า แต่ตัวเลขดู "บวม" ผิดปกติ เพราะออเดอร์หนึ่งมีหลายรายการสินค้า (ความสัมพันธ์ 1:N)</p>
      <p>เมื่อ JOIN ตาราง orders เข้ากับ order_items แถวของออเดอร์หนึ่งจะถูก "ขยาย" เป็นหลายแถวตามจำนวนรายการสินค้า (fan-out) — <code>COUNT(*)</code> จึงนับ "รายการสินค้า" ไม่ใช่ "ออเดอร์"</p>
      <p>บั๊กแบบนี้เจอในรายงานจริงบ่อยมาก: ยอดขายรวมผิดหลัง JOIN, จำนวนผู้ใช้เพิ่มขึ้นเอง ๆ หลังรวมตาราง event — ต้องระวังเสมอ</p>
    `,
    tip: "ก่อน aggregate บนผลลัพธ์ของ JOIN ให้ถามว่า: 1 แถวของสิ่งที่จะนับ ถูกขยายเป็นกี่แถวหลัง JOIN? ถ้ามากกว่า 1 ให้ใช้ COUNT(DISTINCT ...) หรือ aggregate ใน subquery ก่อน JOIN",
    sql: `-- ❌ ตั้งใจนับ: จำนวน "ออเดอร์" ของแต่ละลูกค้า
-- แต่ตัวเลขที่ได้คือจำนวน "รายการสินค้า" (บวมจาก fan-out ของ order_items)
SELECT c.name, COUNT(*) AS order_count
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.name;`,
    challenge: {
      question: "แก้ Query ให้นับจำนวน <strong>ออเดอร์</strong> (ไม่ใช่จำนวนรายการสินค้า) ของลูกค้าแต่ละคน แสดง <code>name</code> และ <code>order_count</code>",
      hint: "ใช้ <code>COUNT(DISTINCT o.order_id)</code> — นับออเดอร์ที่ไม่ซ้ำ ไม่ว่าแถวจะถูกขยายกี่ชุด",
      solution: "SELECT c.name, COUNT(DISTINCT o.order_id) AS order_count FROM customers c JOIN orders o ON o.customer_id = c.customer_id JOIN order_items oi ON oi.order_id = o.order_id GROUP BY c.name;",
      unordered: true
    }
  },
  {
    id: 37,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #6 · GROUP BY",
    title: "🐛 GROUP BY ผิดคอลัมน์ — รันผ่านแต่ผลเพี้ยน",
    description: `
      <p>อาการ: Query รันผ่าน (SQLite ใจดีไม่ error) แต่ตัวเลขที่ได้ไม่ตรงกับความหมายที่ต้องการเลย</p>
      <p>สาเหตุ: ใน SELECT มีทั้ง <code>city</code> และ <code>COUNT(*)</code> แต่ GROUP BY ไปจัดกลุ่มตาม <code>member_tier</code> — ค่า <code>city</code> ที่แสดงจึงเป็นค่า "ที่ SQLite หยิบมาให้" จากแต่ละกลุ่ม ไม่มีความหมายจริง (หลาย DB เข้มงวดกว่าจะ error ทันที)</p>
      <p>กฎ: ทุกคอลัมน์ใน SELECT ที่ไม่ได้อยู่ใน aggregate ต้องปรากฏใน GROUP BY ให้ครบ</p>
    `,
    tip: "อ่าน query แล้วชี้ทีละคอลัมน์ใน SELECT: 'คอลัมน์นี้เป็นตัวจัดกลุ่มหรือถูก aggregate?' — ถ้าตอบไม่ได้แปลว่าเขียนพลาดแล้ว",
    sql: `-- ❌ ตั้งใจหา: จำนวนลูกค้าต่อจังหวัด แต่ GROUP BY ผิดคอลัมน์
-- SQLite รันผ่าน! แต่ city ที่ได้เป็นค่าที่ "หยิบมาโชคดี" ไม่ใช่การจัดกลุ่มจริง
SELECT city, COUNT(*) AS customer_count
FROM customers
GROUP BY member_tier;`,
    challenge: {
      question: "แก้ Query ให้แสดงจำนวนลูกค้า (<code>customer_count</code>) แยกตามจังหวัด (<code>city</code>) อย่างถูกต้อง",
      hint: "เปลี่ยน GROUP BY ให้จัดกลุ่มตามคอลัมน์เดียวกับที่แสดงผล คือ <code>GROUP BY city</code>",
      solution: "SELECT city, COUNT(*) AS customer_count FROM customers GROUP BY city;",
      unordered: true
    }
  },
  {
    id: 38,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #7 · Top-N",
    title: "🐛 LIMIT โดยไม่มี ORDER BY — Top 5 ที่ไม่ใช่ Top 5",
    description: `
      <p>อาการ: อยากได้ "สินค้าราคาสูงสุด 5 อันดับ" แต่ผลลัพธ์ที่ได้ไม่เกี่ยวกับราคาสูงสุดเลย</p>
      <p>สาเหตุ: <code>LIMIT</code> แค่ "ตัดเอา 5 แถวแรกของอะไรบางอย่าง" — ถ้าไม่มี ORDER BY ฐานข้อมูล<em>ไม่รับประกันลำดับ</em> (โดยปกติคือลำดับตาม physical/rowid) ผลลัพธ์จึงเป็น "5 แถวแรก" ไม่ใช่ "Top 5"</p>
      <p>กฎเหล็กของ Top-N: <strong>ORDER BY ก่อน LIMIT เสมอ</strong></p>
    `,
    tip: "ทุกครั้งที่เห็น LIMIT ใน query ของใครก็ตาม ให้เลื่อนขึ้นดูว่ามี ORDER BY กำกับอยู่ไหม — ถ้าไม่มี แปลว่าผลลัพธ์ไม่มีความหมายด้านการจัดอันดับ",
    sql: `-- ❌ ตั้งใจหา: สินค้า 5 อันดับที่แพงที่สุด — แต่ได้แค่ "5 แถวแรก" ของตาราง
SELECT name, price
FROM products
LIMIT 5;`,
    challenge: {
      question: "แก้ Query ให้แสดงสินค้า <strong>5 อันดับที่ราคาสูงที่สุด</strong> พร้อม <code>name</code> และ <code>price</code> เรียงราคาจากสูงไปต่ำ",
      hint: "เพิ่ม <code>ORDER BY price DESC</code> ก่อน LIMIT",
      solution: "SELECT name, price FROM products ORDER BY price DESC LIMIT 5;"
    }
  },
  {
    id: 39,
    type: "debug",
    category: "debug",
    categoryLabel: "Debug the SQL",
    level: "Debug #8 · Logic",
    title: "🐛 AND กับ OR — วงเล็บสำคัญกว่าที่คิด",
    description: `
      <p>อาการ: กรองลูกค้ากรุงเทพฯ <strong>หรือ</strong> เชียงใหม่ ที่เป็นสมาชิก Gold — แต่ผลลัพธ์มีลูกค้าเชียงใหม่ที่ไม่ใช่ Gold ปนอยู่</p>
      <p>สาเหตุ: ใน SQL (เหมือนคณิตศาสตร์) <code>AND</code> มีความสำคัญสูงกว่า <code>OR</code> — query จึงถูกตีความเป็น "กรุงเทพฯ" OR ("เชียงใหม่ AND Gold") ไม่ใช่ ("กรุงเทพฯ OR เชียงใหม่") AND Gold อย่างที่ตั้งใจ</p>
      <p>แนวปฏิบัติ: ทุกครั้งที่ผสม AND กับ OR ในเงื่อนไขเดียว ให้ใส่วงเล็บกำกับความหมายเสมอ แม้จะไม่จำเป็นก็ตาม เพราะคนอ่าน (รวมถึงตัวคุณเองในอีก 3 เดือน) จะขอบคุณ</p>
    `,
    tip: "อ่านเงื่อนไขออกเสียงเป็นภาษาคน: 'A หรือ B และ C' ฟังกำกวม — ถ้าต้องคิดก่อนตอบ แปลว่าควรใส่วงเล็บแล้ว",
    sql: `-- ❌ ตั้งใจหา: ลูกค้ากรุงเทพฯ หรือเชียงใหม่ "ที่เป็น Gold เท่านั้น"
-- แต่ AND ถูกประมวลผลก่อน OR ทำให้ลูกค้ากรุงเทพฯทุก tier หลุดเข้ามา
SELECT name, city, member_tier
FROM customers
WHERE city = 'กรุงเทพฯ' OR city = 'เชียงใหม่' AND member_tier = 'Gold';`,
    challenge: {
      question: "แก้ Query ให้ได้ลูกค้าที่อยู่<strong>กรุงเทพฯ หรือ เชียงใหม่</strong> และเป็นสมาชิกระดับ <code>Gold</code> เท่านั้น แสดง <code>name</code>, <code>city</code>, <code>member_tier</code>",
      hint: "ครอบกลุ่มเมืองด้วยวงเล็บ: <code>(city = 'กรุงเทพฯ' OR city = 'เชียงใหม่') AND member_tier = 'Gold'</code>",
      solution: "SELECT name, city, member_tier FROM customers WHERE (city = 'กรุงเทพฯ' OR city = 'เชียงใหม่') AND member_tier = 'Gold';",
      unordered: true
    }
  },

  // ==========================================
  // หมวดที่ 9: Problem Solving — โจทย์สถานการณ์จริงจากธุรกิจ
  // (ไม่สอน syntax ตรง ๆ — ผู้เรียนต้องคิด query เองจากโจทย์ธุรกิจ)
  // ข้อตกลงตัวเลขทุกข้อ: "ยอดขาย" = ผลรวม quantity × unit_price ของออเดอร์สถานะ completed เท่านั้น
  // ==========================================
  {
    id: 40,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #1 · Easy",
    title: "🛒 สินค้าขายดี 10 อันดับ — รายงานประจำเดือนของฝ่ายขาย",
    description: `
      <p>ฝ่ายขายต้องส่งรายงาน "Top 10 สินค้าดาวเด่น" ขึ้นผู้จัดการภายในสิบนาที — คุณมีข้อมูลอยู่ในมือแล้ว เขียน query เองเลย</p>
      <p><strong>ข้อกำหนดของตัวเลข:</strong> ยอดขาย = <code>quantity × unit_price</code> รวมกันทุกรายการ นับเฉพาะออเดอร์สถานะ <code>completed</code> เท่านั้น (ยกเว้น cancelled/pending ที่ยังไม่นับเป็นรายได้)</p>
      <p>แนวทางคิด: ยอดขายเก็บอยู่ใน <code>order_items</code> แต่สถานะอยู่อีกตาราง — ต้องเชื่อมแล้วค่อยรวม</p>
    `,
    tip: "ก่อนเขียน query ให้ตอบให้ได้ก่อนว่า: ตารางไหนเก็บ 'ตัวเลขที่ต้องรวม' และตารางไหนเก็บ 'เงื่อนไขกรอง' — แล้วเส้นทาง JOIN จะโผล่มาเอง",
    sql: `-- 🛒 โจทย์: Top 10 สินค้าจากยอดขาย (completed)
-- ตารางที่เกี่ยวข้อง: order_items, orders (status), products (name)
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>product_name</code> และ <code>total_revenue</code> ของสินค้า 10 อันดับที่ยอดขายสูงสุด (นับเฉพาะออเดอร์ completed) เรียงยอดจากมากไปน้อย",
      hint: "JOIN สามตาราง (order_items → orders เพื่อเช็ค status → products เพื่อเอาชื่อ) แล้ว <code>SUM(quantity * unit_price)</code> ต่อสินค้า ปิดท้ายด้วย <code>ORDER BY ... DESC LIMIT 10</code>",
      solution: "SELECT p.name AS product_name, SUM(oi.quantity * oi.unit_price) AS total_revenue FROM order_items oi JOIN orders o ON o.order_id = oi.order_id AND o.status = 'completed' JOIN products p ON p.product_id = oi.product_id GROUP BY p.product_id, p.name ORDER BY total_revenue DESC LIMIT 10;",
      requiredColumns: ["total_revenue"]
    }
  },
  {
    id: 41,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #2 · Easy",
    title: "📅 ยอดขายรายเดือน — กราฟหน้า Dashboard ของ CEO",
    description: `
      <p>CEO ขอดูแนวโน้มยอดขายรายเดือนบน Dashboard — คุณต้องเตรียมข้อมูลสรุปเป็นรายเดือนส่งให้ทีม Front-end วาดกราฟ</p>
      <p><strong>ข้อกำหนด:</strong> "เดือน" ให้อยู่ในรูปแบบ <code>YYYY-MM</code> (เช่น 2026-03) และนับเฉพาะออเดอร์ <code>completed</code> เหมือนเดิม</p>
      <p>เบาะแส: SQLite มีฟังก์ชันแตกวันที่เป็นเดือนได้เลย — ลองนึกถึงบท String &amp; Date Functions</p>
    `,
    tip: "ข้อมูลวันที่เก็บเป็น TEXT รูปแบบ YYYY-MM-DD — ไม่ต้องแปลง type อะไรทั้งสิ้น แค่หาทาง 'ตัด' เอาส่วนปี-เดือนมา GROUP BY",
    sql: `-- 📅 โจทย์: ยอดขายสรุปรายเดือน (completed)
-- ต้องการผลลัพธ์: month (YYYY-MM) + monthly_revenue
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "สรุปยอดขายรายเดือน (เฉพาะออเดอร์ completed) แสดง <code>month</code> ในรูปแบบ <code>YYYY-MM</code> และ <code>monthly_revenue</code> (ปัดทศนิยม 2 ตำแหน่ง) เรียงจากเดือนเก่าสุดไปใหม่สุด — ทุกเดือนที่มีข้อมูล",
      hint: "ใช้ <code>strftime('%Y-%m', order_date)</code> เป็น grouping key แล้ว <code>SUM(quantity * unit_price)</code>",
      solution: "SELECT strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS monthly_revenue FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed' GROUP BY month ORDER BY month;",
      requiredColumns: ["month", "monthly_revenue"]
    }
  },
  {
    id: 42,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #3 · Easy",
    title: "👑 คัดลูกค้า VIP — ส่งคูปองราคาพิเศษ",
    description: `
      <p>ฝ่าย Marketing จะจัดแคมเปญ "VIP Night" ส่งคูปองส่วนลดให้ลูกค้าที่ใช้จ่ายระดับตัวท็อป — คัดเป็นลิสต์ชื่อส่งทีม CRM ได้เลย</p>
      <p><strong>เกณฑ์:</strong> ลูกค้าที่มียอดซื้อสะสม <strong>ตั้งแต่ 50,000 บาทขึ้นไป</strong> (เฉพาะออเดอร์ completed)</p>
    `,
    tip: "คำว่า 'ต่อลูกค้า' = GROUP BY ที่ระดับลูกค้า และเกณฑ์ 'ยอดถึงเท่าไหร่' คือการกรองหลังคำนวณ — นึกถึงความต่างระหว่าง WHERE กับ HAVING",
    sql: `-- 👑 โจทย์: ลูกค้าที่ยอดซื้อสะสม (completed) >= 50,000 บาท
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>name</code> และ <code>total_spent</code> (ปัดทศนิยม 2 ตำแหน่ง) ของลูกค้าที่มียอดซื้อสะสมตั้งแต่ 50,000 บาทขึ้นไป (เฉพาะออเดอร์ completed)",
      hint: "JOIN customers → orders (เช็ค status) → order_items แล้ว <code>GROUP BY</code> ต่อลูกค้า และใช้ <code>HAVING SUM(...) >= 50000</code>",
      solution: "SELECT c.name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id GROUP BY c.customer_id, c.name HAVING SUM(oi.quantity * oi.unit_price) >= 50000;",
      unordered: true,
      requiredColumns: ["total_spent"]
    }
  },
  {
    id: 43,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #4 · Medium",
    title: "🏆 เดือนทอง — เดือนไหนทีมขายทำยอดได้ดีที่สุด",
    description: `
      <p>ประชุมสรุปปี ผู้จัดการถามว่า "เดือนไหนคือเดือนทองของเรา?" — ตอบให้ได้ใน query เดียว โดยไม่ต้องมานั่งเทียบตารางทีละเดือน</p>
      <p><strong>ข้อกำหนด:</strong> ยอดขายนับเฉพาะออเดอร์ completed เหมือนมาตรฐานเดิม และต้องการผลลัพธ์<strong>แถวเดียว</strong>พร้อมทั้งยอดของเดือนนั้น</p>
    `,
    tip: "ถ้าเคยทำโจทย์รายเดือนแล้ว อย่าเริ่มใหม่จากศูนย์ — นำ query เดิมมาเติมอีก 1-2 บรรทัดให้มันคืน 'แถวที่ดีที่สุด' แถวเดียว",
    sql: `-- 🏆 โจทย์: เดือน (YYYY-MM) ที่มียอดขาย (completed) สูงสุด 1 เดือน
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "หาเดือน (<code>month</code> รูปแบบ YYYY-MM) ที่มียอดขายสูงสุด (เฉพาะ completed) แสดงพร้อม <code>monthly_revenue</code> (ปัดทศนิยม 2 ตำแหน่ง) — ผลลัพธ์ 1 แถวเดียว",
      hint: "สรุปรายเดือนด้วย GROUP BY แล้วเรียงด้วย <code>ORDER BY ยอด DESC</code> และตัดเอาอันดับ 1 ด้วย <code>LIMIT 1</code>",
      solution: "SELECT strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS monthly_revenue FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed' GROUP BY month ORDER BY monthly_revenue DESC LIMIT 1;",
      requiredColumns: ["month", "monthly_revenue"]
    }
  },
  {
    id: 44,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #5 · Medium",
    title: "🔁 ลูกค้าประจำ — ใครกลับมาซื้อซ้ำบ่อยที่สุด",
    description: `
      <p>ธุรกิจออนไลน์วัดความสำเร็จด้วย Repeat Purchase — ทีมRetention ต้องการลิสต์ลูกค้าที่ "กลับมาซื้ออีก" ไม่ใช่ซื้อครั้งเดียวแล้วหายไปเลย</p>
      <p><strong>เกณฑ์:</strong> ลูกค้าที่มีออเดอร์ completed <strong>ตั้งแต่ 2 รายการขึ้นไป</strong> (ออเดอร์ที่ถูกยกเลิกหรือยังค้างจ่ายไม่นับ)</p>
      <p>ระวังจุดตาย: ถ้านับผิดวิธี จำนวน "ออเดอร์" จะกลายเป็นจำนวน "รายการสินค้า" โดยไม่รู้ตัว (ลองนึกภาพบั๊ก fan-out ในหมวด Debug)</p>
    `,
    tip: "ออเดอร์ 1 ใบอาจมีหลายรายการสินค้า — การจะนับ 'จำนวนออเดอร์' ต้องระวังความสัมพันธ์ 1:N เหมือนโจทย์ Debug #5 เป๊ะ ๆ",
    sql: `-- 🔁 โจทย์: ลูกค้าที่มีออเดอร์ completed >= 2 รายการ
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>name</code> และ <code>order_count</code> ของลูกค้าที่มีออเดอร์สถานะ completed ตั้งแต่ 2 รายการขึ้นไป (นับจำนวนออเดอร์ ไม่ใช่จำนวนรายการสินค้า)",
      hint: "ไม่จำเป็นต้อง JOIN order_items เลย — ข้อมูลที่ต้องการอยู่แค่ customers + orders และใช้ <code>COUNT(DISTINCT o.order_id)</code>",
      solution: "SELECT c.name, COUNT(DISTINCT o.order_id) AS order_count FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' GROUP BY c.customer_id, c.name HAVING COUNT(DISTINCT o.order_id) >= 2;",
      unordered: true,
      requiredColumns: ["order_count"]
    }
  },
  {
    id: 45,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #6 · Medium",
    title: "📊 สัดส่วนยอดขายต่อหมวดหมู่ — จัดงบโฆษณาปีหน้า",
    description: `
      <p>ทีมต้องจัดสรรงบโฆษณาปีหน้าตามสัดส่วนยอดขายของแต่ละหมวดหมู่สินค้า — ต้องรู้ว่าแต่ละหมวดคิดเป็นกี่เปอร์เซ็นต์ของยอดรวมทั้งหมด</p>
      <p><strong>ข้อกำหนด:</strong> หมวดหมู่อยู่อีกตาราง ต้องเชื่อมผ่านสินค้า และใช้ยอดขายมาตรฐาน (completed) — สัดส่วนปัดทศนิยม <strong>1 ตำแหน่ง</strong></p>
    `,
    tip: "เปอร์เซ็นต์ = ส่วน ÷ ทั้งหมด — 'ทั้งหมด' หาได้จาก subquery แยก และอย่าลืมบังคับทศนิยมด้วย 100.0 ไม่งั้น SQL หารตัดเศษให้เป็นจำนวนเต็มเฉย ๆ",
    sql: `-- 📊 โจทย์: สัดส่วน % ยอดขาย (completed) แยกตามหมวดหมู่
-- ตาราง: categories ← products ← order_items ← orders
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดงชื่อหมวดหมู่ (<code>category</code>) และ <code>revenue_pct</code> — สัดส่วนยอดขายของหมวดนั้นต่อยอดขายรวมทั้งหมด (เฉพาะ completed) ปัดทศนิยม 1 ตำแหน่ง",
      hint: "ตัวส่วนคือ <code>SUM(...)</code> ต่อหมวด ตัวตั้งคือ subquery หาผลรวมทุกหมวด แล้วหารคูณ <code>100.0</code> ปิดด้วย <code>ROUND(..., 1)</code>",
      solution: "SELECT cat.name AS category, ROUND(100.0 * SUM(oi.quantity * oi.unit_price) / (SELECT SUM(oi2.quantity * oi2.unit_price) FROM order_items oi2 JOIN orders o2 ON o2.order_id = oi2.order_id WHERE o2.status = 'completed'), 1) AS revenue_pct FROM categories cat JOIN products p ON p.category_id = cat.category_id JOIN order_items oi ON oi.product_id = p.product_id JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'completed' GROUP BY cat.category_id, cat.name;",
      unordered: true,
      requiredColumns: ["revenue_pct"]
    }
  },
  {
    id: 46,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #7 · Medium",
    title: "📈 เติบโตเทียบเดือนก่อน (MoM %) — รายงานนักวิเคราะห์",
    description: `
      <p>รายงานธุรกิจที่ดีไม่ได้บอกแค่ "เดือนนี้ยอดเท่าไหร่" แต่ต้องบอกว่า <strong>"เติบโต/ลดลงกี่เปอร์เซ็นต์จากเดือนก่อน"</strong> — นี่คือ query ที่ Data Analyst ใช้จริงทุกเดือน</p>
      <p><strong>ข้อกำหนด:</strong> เฉพาะเดือนในปี 2026, ยอดขายมาตรฐาน (completed), growth ปัดทศนิยม 1 ตำแหน่ง และเดือนแรกของปีไม่มีเดือนก่อนให้เทียบ → แสดง NULL ได้เลย</p>
    `,
    tip: "สูตร growth: (เดือนนี้ − เดือนก่อน) ÷ เดือนก่อน × 100 — ส่วน 'ดึงค่าเดือนก่อนมาไว้แถวเดียวกัน' คือถิ่นของ Window Function ตัวหนึ่งที่เคยเรียนไปแล้ว",
    sql: `-- 📈 โจทย์: ยอดขายรายเดือนปี 2026 (completed) + growth % เทียบเดือนก่อน
-- เดือนแรก (2026-01) growth = NULL
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>month</code> (YYYY-MM), <code>monthly_revenue</code> และ <code>growth_pct</code> — เปอร์เซ็นต์เปลี่ยนแปลงจากเดือนก่อนหน้า (ปัด 1 ตำแหน่ง, เดือนแรกเป็น NULL) เฉพาะปี 2026 เรียงตามเดือน",
      hint: "สร้าง CTE สรุปยอดรายเดือนก่อน แล้วใช้ <code>LAG(monthly_revenue) OVER (ORDER BY month)</code> ดึงยอดเดือนก่อนมาคำนวณ",
      solution: "WITH monthly AS (SELECT strftime('%Y-%m', o.order_date) AS month, SUM(oi.quantity * oi.unit_price) AS monthly_revenue FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed' AND strftime('%Y', o.order_date) = '2026' GROUP BY month) SELECT month, ROUND(monthly_revenue, 2) AS monthly_revenue, ROUND(100.0 * (monthly_revenue - LAG(monthly_revenue) OVER (ORDER BY month)) / LAG(monthly_revenue) OVER (ORDER BY month), 1) AS growth_pct FROM monthly ORDER BY month;",
      requiredColumns: ["growth_pct"]
    }
  },
  {
    id: 47,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #8 · Medium",
    title: "💰 ยอดสะสมรายเดือน — เส้น Cumulative บนกราฟ",
    description: `
      <p>กราฟยอดขายแบบ "สะสมตั้งแต่ต้นปี" (Cumulative) ช่วยให้เห็นภาพรวมว่าทั้งปีกำลังไปถึงเป้าหมายหรือยัง — ทีม BI ต้องการข้อมูลชุดนี้เพิ่มบน Dashboard</p>
      <p><strong>ข้อกำหนด:</strong> เฉพาะปี 2026, ยอดขายมาตรฐาน (completed) — แต่ละเดือนต้องบวกต่อจากเดือนก่อนหน้าเรื่อย ๆ</p>
    `,
    tip: "GROUP BY แบบธรรมดาจะได้แค่ยอด 'แยกเดือน' — ยอด 'สะสม' ต้องเป็น Window Function ที่คำนวณข้ามแถวโดยไม่ยุบแถว",
    sql: `-- 💰 โจทย์: ยอดขายสะสมตั้งแต่ต้นปี 2026 (completed) รายเดือน
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>month</code> (YYYY-MM), <code>monthly_revenue</code> และ <code>cumulative_revenue</code> (ยอดสะสมตั้งแต่ต้นปี, ปัดทศนิยม 2 ตำแหน่ง) เฉพาะปี 2026 (completed) เรียงตามเดือน",
      hint: "CTE สรุปรายเดือนเหมือนเดิม แล้วใช้ <code>SUM(monthly_revenue) OVER (ORDER BY month)</code> — running total แบบเดียวกับบท Window Functions",
      solution: "WITH monthly AS (SELECT strftime('%Y-%m', o.order_date) AS month, SUM(oi.quantity * oi.unit_price) AS monthly_revenue FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed' AND strftime('%Y', o.order_date) = '2026' GROUP BY month) SELECT month, ROUND(monthly_revenue, 2) AS monthly_revenue, ROUND(SUM(monthly_revenue) OVER (ORDER BY month), 2) AS cumulative_revenue FROM monthly ORDER BY month;",
      requiredColumns: ["cumulative_revenue"]
    }
  },
  {
    id: 48,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #9 · Hard",
    title: "🏙️ MVP ประจำเมือง — แคมเปญท้องถิ่น",
    description: `
      <p>ทีม Marketing จะทำแคมเปญ "ลูกค้าคนโปรดประจำเมือง" — แต่ละจังหวัดต้องหา "ลูกค้ายอดสูงสุดของเมืองนั้น" ออกมาให้ครบทุกเมืองใน query เดียว</p>
      <p><strong>ข้อกำหนด:</strong> ยอดสะสมมาตรฐาน (completed) และเอาเฉพาะลูกค้าที่เคยมีออเดอร์ completed จริงเท่านั้น (เมืองที่ลูกค้ายังไม่เคยซื้อเลยไม่ต้องสน)</p>
      <p>นี่คือแพทเทิร์น <strong>Top-N per Group</strong> — หนึ่งในโจทย์คลาสสิกที่เจอในสัมภาษณ์งาน Data บ่อยที่สุด</p>
    `,
    tip: "GROUP BY ธรรมดาให้ 'ทุกคนต่อเมือง' แต่เราต้องการ 'แชมป์คนเดียวต่อเมือง' — จัดอันดับภายในกลุ่มแล้วเลือกอันดับ 1 นี่แหละคือ PARTITION BY ที่เคยเรียน",
    sql: `-- 🏙️ โจทย์: ลูกค้ายอดสูงสุด "ของแต่ละเมือง" (completed)
-- แพทเทิร์น: Top-N per Group
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>city</code>, <code>name</code> และ <code>total_spent</code> (ปัดทศนิยม 2 ตำแหน่ง) ของลูกค้าที่มียอดซื้อสูงสุดของแต่ละจังหวัด (เฉพาะยอดจากออเดอร์ completed, 1 แถวต่อเมือง)",
      hint: "2 ชั้น: CTE แรกคำนวณยอดต่อลูกค้า → ครอบด้วย <code>ROW_NUMBER() OVER (PARTITION BY city ORDER BY ยอด DESC)</code> แล้วเลือก <code>rn = 1</code>",
      solution: "WITH spend AS (SELECT c.city, c.name, SUM(oi.quantity * oi.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id GROUP BY c.customer_id, c.name), ranked AS (SELECT city, name, total_spent, ROW_NUMBER() OVER (PARTITION BY city ORDER BY total_spent DESC) AS rn FROM spend) SELECT city, name, ROUND(total_spent, 2) AS total_spent FROM ranked WHERE rn = 1;",
      unordered: true,
      requiredColumns: ["total_spent"]
    }
  },
  {
    id: 49,
    category: "problems",
    categoryLabel: "Problem Solving",
    level: "Problem #10 · Boss",
    title: "🚨 ลูกค้ากำลังหลุดมือ — รายชื่อส่งทีม Retention",
    description: `
      <p>สถานการณ์จริงท้ายคอร์ส: ทีม Retention รายงานว่าช่วงหลังมีลูกค้าเก่าหายไปเยอะ — ต้องการ <strong>รายชื่อลูกค้าที่กำลังจะหลุดมือ</strong> เพื่อส่งอีเมลดึงกลับก่อนจะสายเกินไป</p>
      <p><strong>นิยาม "กำลังหลุดมือ":</strong> เคยซื้อสำเร็จ (มีออเดอร์ completed อย่างน้อย 1 ครั้ง) <strong>แต่</strong> การซื้อล่าสุดครั้งสุดท้ายเกิดก่อนวันที่ <code>2026-05-01</code></p>
      <p>โจทย์นี้รวมทุกอย่าง: JOIN หลายตาราง + aggregate + เงื่อนไขกับ "ค่าสรุป" (วันที่ล่าสุด) — ลองแตกโจทย์เป็นขั้น ๆ ก่อนลงมือ</p>
    `,
    tip: "สังเกตว่าเงื่อนไข 'วันซื้อล่าสุด < 2026-05-01' กรองหลังการคำนวณ (MAX ต่อลูกค้า) — ส่วนไหนของ query ควรรับหน้าที่นี้?",
    sql: `-- 🚨 โจทย์: ลูกค้า At Risk — เคยซื้อ (completed) แต่ล่าสุดก่อน 2026-05-01
-- ต้องการ: name + last_order_date + total_spent
-- เขียน query ของคุณที่นี่`,
    challenge: {
      question: "แสดง <code>name</code>, <code>last_order_date</code> (วันที่ซื้อ completed ล่าสุด) และ <code>total_spent</code> (ยอดสะสม completed ปัดทศนิยม 2 ตำแหน่ง) ของลูกค้าที่เคยซื้อสำเร็จแต่ไม่ได้ซื้อเลยตั้งแต่ก่อน 2026-05-01",
      hint: "GROUP BY ต่อลูกค้า แล้วใช้ <code>HAVING MAX(o.order_date) < '2026-05-01'</code> — วันที่ล่าสุดกับยอดรวมหาได้ใน query เดียวกัน",
      solution: "SELECT c.name, MAX(o.order_date) AS last_order_date, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' JOIN order_items oi ON oi.order_id = o.order_id GROUP BY c.customer_id, c.name HAVING MAX(o.order_date) < '2026-05-01';",
      unordered: true,
      requiredColumns: ["last_order_date", "total_spent"]
    }
  },

  // ==========================================
  // หมวดที่ 10: Database Design — ออกแบบตารางเอง (ตรวจโครงสร้าง DDL จริง)
  // challenge.checkSchema = true → ตรวจทั้ง DDL (PK/NOT NULL/CHECK/FK) และข้อมูล
  // ==========================================
  {
    id: 50,
    category: "design",
    categoryLabel: "Database Design",
    level: "Design #1 · เบื้องต้น",
    title: "🧱 ตารางแรกของคุณ — Constraints คือด่านตรวจคุณภาพข้อมูล",
    description: `
      <p>สวมบทบาทคนออกแบบฐานข้อมูลของระบบคลังสินค้า — งานนี้ไม่ใช่ SELECT แล้ว แต่คือการ<strong>สร้างโครงสร้าง</strong>ที่ทีมทั้งทีมจะใช้ต่อ</p>
      <p>Constraints ไม่ใช่การจำกัดเพื่อกีดกัน แต่คือ "ด่านตรวจ" ที่ฐานข้อมูลบังคับใช้เองตลอดอายุระบบ: ค่า capacity ติดลบ หรือคลังที่ไม่มีชื่อ จะเข้าสู่ระบบไม่ได้ตั้งแต่ระดับคำสั่ง INSERT เลย</p>
      <p><strong>Blueprint ตาราง <code>warehouses</code></strong> (คอลัมน์ตามลำดับนี้):</p>
      <ul>
        <li><code>warehouse_id INTEGER PRIMARY KEY</code></li>
        <li><code>name TEXT NOT NULL</code></li>
        <li><code>city TEXT NOT NULL</code></li>
        <li><code>capacity INTEGER NOT NULL CHECK (capacity &gt; 0)</code></li>
      </ul>
    `,
    tip: "ระบบตรวจจะเทียบโครงสร้างจริงของคุณกับ blueprint ทั้งชื่อคอลัมน์ ชนิดข้อมูล ลำดับ และ constraints — เว้นวรรคหรือขึ้นบรรทัดใหม่ต่างจากตัวอย่างไม่มีปัญหา แต่ขอให้ครบทุกตัว",
    sql: `-- 🧱 Blueprint: ตาราง warehouses (ระบบคลังสินค้า)
-- เริ่มจากลบตารางเดิม (ถ้ามี) เพื่อให้ทดลองซ้ำได้:
DROP TABLE IF EXISTS warehouses;

-- เขียน CREATE TABLE ตาม blueprint แล้ว INSERT ข้อมูล 2 แถวตามโจทย์
-- เขียนต่อที่นี่`,
    challenge: {
      question: "สร้างตาราง <code>warehouses</code> ตาม blueprint ในบทเรียน<strong>ครบทุก constraints</strong> แล้วแทรกข้อมูล 2 แถว: <code>(1, 'คลังกลาง', 'กรุงเทพฯ', 5000)</code> และ <code>(2, 'คลังภาคเหนือ', 'เชียงใหม่', 3000)</code>",
      hint: "โครงสร้าง: <code>DROP TABLE IF EXISTS warehouses;</code> แล้ว <code>CREATE TABLE warehouses (warehouse_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, capacity INTEGER NOT NULL CHECK (capacity &gt; 0));</code> ตามด้วย INSERT 2 แถว",
      solution: "DROP TABLE IF EXISTS warehouses; CREATE TABLE warehouses (warehouse_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, capacity INTEGER NOT NULL CHECK (capacity > 0)); INSERT INTO warehouses (warehouse_id, name, city, capacity) VALUES (1, 'คลังกลาง', 'กรุงเทพฯ', 5000), (2, 'คลังภาคเหนือ', 'เชียงใหม่', 3000);",
      checkSchema: true
    }
  },
  {
    id: 51,
    category: "design",
    categoryLabel: "Database Design",
    level: "Design #2 · ความสัมพันธ์",
    title: "🔗 1:N — ผู้ขายหนึ่งราย ใบสั่งซื้อได้หลายใบ",
    description: `
      <p>ระบบจัดซื้อต้องเก็บผู้ขาย (vendor) และใบสั่งซื้อ (PO) — ความสัมพันธ์แบบ <strong>หนึ่งต่อกลาง</strong>: vendor หนึ่งรายมีได้หลาย PO แต่ PO หนึ่งใบเป็นของ vendor รายเดียวเท่านั้น</p>
      <p>ทางที่ผิด: เก็บชื่อ+เบอร์โทร vendor ซ้ำ ๆ ในทุกแถวของ PO — เมื่อเบอร์โทรเปลี่ยนต้องแก้ 50 แถว (Update Anomaly) และพิมพ์ชื่อผิดที่ใบเดียวข้อมูลก็เน่าทันที</p>
      <p>ทางที่ถูก: แยกเป็น 2 ตาราง แล้วเชื่อมด้วย <strong>Foreign Key</strong> — <code>vendor_pos.vendor_id</code> ชี้กลับไปที่ <code>vendors.vendor_id</code></p>
      <p><strong>Blueprint:</strong></p>
      <ul>
        <li><code>vendors</code>: <code>vendor_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>phone TEXT</code></li>
        <li><code>vendor_pos</code>: <code>po_id INTEGER PRIMARY KEY</code>, <code>vendor_id INTEGER NOT NULL</code>, <code>order_date TEXT NOT NULL</code>, <code>total REAL NOT NULL</code>, <code>FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)</code></li>
      </ul>
    `,
    tip: "หลักคิดของ FK: ฝั่ง 'กลาง' (N) เก็บ key ของฝั่ง 'หนึ่ง' (1) — ในที่นี้ PO เป็นฝั่ง N จึงมีคอลัมน์ vendor_id ส่วน vendors ไม่ต้องมีอะไรชี้กลับเลย",
    sql: `-- 🔗 Blueprint: vendors (1) ←→ vendor_pos (N)
DROP TABLE IF EXISTS vendor_pos;
DROP TABLE IF EXISTS vendors;

-- สร้าง 2 ตารางตาม blueprint (ตารางฝั่ง 1 ต้องเกิดก่อนจะถูกอ้างอิง)
-- แล้วแทรกข้อมูลตามโจทย์
-- เขียนต่อที่นี่`,
    challenge: {
      question: "สร้างตาราง <code>vendors</code> และ <code>vendor_pos</code> ตาม blueprint (รวม FK) แล้วแทรก: vendors 2 แถว — <code>(1, 'Thai Tech Supply', '02-111-2222')</code>, <code>(2, 'North Parts Co.', '053-333-4444')</code> และ PO 3 แถว — <code>(9001, 1, '2026-05-10', 15000)</code>, <code>(9002, 1, '2026-06-02', 8200.5)</code>, <code>(9003, 2, '2026-06-15', 4300)</code>",
      hint: "สร้าง vendors ก่อน แล้ว vendor_pos พร้อมท้ายตาราง: <code>FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)</code> แล้ว INSERT ตามลำดับโจทย์",
      solution: "DROP TABLE IF EXISTS vendor_pos; DROP TABLE IF EXISTS vendors; CREATE TABLE vendors (vendor_id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT); CREATE TABLE vendor_pos (po_id INTEGER PRIMARY KEY, vendor_id INTEGER NOT NULL, order_date TEXT NOT NULL, total REAL NOT NULL, FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)); INSERT INTO vendors (vendor_id, name, phone) VALUES (1, 'Thai Tech Supply', '02-111-2222'), (2, 'North Parts Co.', '053-333-4444'); INSERT INTO vendor_pos (po_id, vendor_id, order_date, total) VALUES (9001, 1, '2026-05-10', 15000), (9002, 1, '2026-06-02', 8200.5), (9003, 2, '2026-06-15', 4300);",
      checkSchema: true
    }
  },
  {
    id: 52,
    category: "design",
    categoryLabel: "Database Design",
    level: "Design #3 · ความสัมพันธ์",
    title: "🔀 M:N — นักเรียนกับคอร์สเรียนต้องมีตารางกลาง",
    description: `
      <p>ระบบลงทะเบียนเรียน: นักเรียนหนึ่งคนลงได้หลายคอร์ส และคอร์สหนึ่งมีได้หลายคน — ความสัมพันธ์แบบ <strong>หลายต่อหลาย</strong> (M:N)</p>
      <p>ปัญหา: ตารางธรรมดาเก็บไม่ได้ — จะใส่ course_id เป็น list ในแถวของนักเรียนก็ query ยาก และเก็บซ้ำเต็มไปหมด</p>
      <p>ทางแก้มาตรฐาน: สร้าง <strong>Junction Table</strong> (ตารางกลาง) ที่แต่ละแถว = ความสัมพันธ์หนึ่งคู่ — และใช้ <strong>Primary Key ร่วม (composite PK)</strong> บน (student_id, course_id) เพื่อกันการลงคอร์สเดิมซ้ำสองครั้งโดยโครงสร้าง ไม่ต้องไว้ใจวินัยใคร</p>
      <p><strong>Blueprint:</strong></p>
      <ul>
        <li><code>students</code>: <code>student_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code></li>
        <li><code>courses</code>: <code>course_id INTEGER PRIMARY KEY</code>, <code>title TEXT NOT NULL</code></li>
        <li><code>enrollments</code>: <code>student_id INTEGER NOT NULL</code>, <code>course_id INTEGER NOT NULL</code>, <code>enrolled_date TEXT</code>, <code>PRIMARY KEY (student_id, course_id)</code>, และ FK ไปทั้งสองตาราง</li>
      </ul>
    `,
    tip: "Composite PK ใน enrollments ทำหน้าที่สองอย่างพร้อมกัน: เป็นตัวตนของแถว (แต่ละคู่นักเรียน-คอร์สมีได้แถวเดียว) และสร้าง index ค้นหาให้ตัวเองโดยไม่ต้องสร้างเพิ่ม",
    sql: `-- 🔀 Blueprint: students + courses + enrollments (junction)
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;

-- สร้าง 3 ตารางตาม blueprint แล้วแทรกข้อมูลตามโจทย์
-- เขียนต่อที่นี่`,
    challenge: {
      question: "สร้าง 3 ตารางตาม blueprint (enrollments ต้องมี composite PK และ FK ครบทั้งคู่) แล้วแทรก: students — <code>(1, 'นภา') </code>, <code>(2, 'ธนา') </code>, <code>(3, 'ใหม่') </code> · courses — <code>(101, 'SQL Basics') </code>, <code>(102, 'Data Analytics') </code> · enrollments — <code>(1, 101, '2026-07-01') </code>, <code>(1, 102, '2026-07-02') </code>, <code>(2, 101, '2026-07-03') </code>, <code>(3, 102, '2026-07-05') </code>",
      hint: "ใน CREATE TABLE enrollments ปิดท้ายด้วย <code>PRIMARY KEY (student_id, course_id), FOREIGN KEY (student_id) REFERENCES students (student_id), FOREIGN KEY (course_id) REFERENCES courses (course_id)</code>",
      solution: "DROP TABLE IF EXISTS enrollments; DROP TABLE IF EXISTS students; DROP TABLE IF EXISTS courses; CREATE TABLE students (student_id INTEGER PRIMARY KEY, name TEXT NOT NULL); CREATE TABLE courses (course_id INTEGER PRIMARY KEY, title TEXT NOT NULL); CREATE TABLE enrollments (student_id INTEGER NOT NULL, course_id INTEGER NOT NULL, enrolled_date TEXT, PRIMARY KEY (student_id, course_id), FOREIGN KEY (student_id) REFERENCES students (student_id), FOREIGN KEY (course_id) REFERENCES courses (course_id)); INSERT INTO students (student_id, name) VALUES (1, 'นภา'), (2, 'ธนา'), (3, 'ใหม่'); INSERT INTO courses (course_id, title) VALUES (101, 'SQL Basics'), (102, 'Data Analytics'); INSERT INTO enrollments (student_id, course_id, enrolled_date) VALUES (1, 101, '2026-07-01'), (1, 102, '2026-07-02'), (2, 101, '2026-07-03'), (3, 102, '2026-07-05');",
      checkSchema: true
    }
  },
  {
    id: 53,
    category: "design",
    categoryLabel: "Database Design",
    level: "Design #4 · Normalization",
    title: "🧹 แยกตารางเละ — Normalization ด้วยมือของคุณเอง",
    description: `
      <p>ตาราง <code>messy_orders</code> คือสิ่งที่เจอบ่อยในระบบจริง: ยัดทุกอย่างรวมกันไว้ในตารางเดียว — ชื่อลูกค้า เมือง และสินค้า ซ้ำซ้อนไปหมด (ลูกค้าคนเดียวปรากฏหลายแถว พิมพ์ผิดที่แถวเดียวก็จบเกม)</p>
      <p>งานของคุณ: <strong>normalize</strong> โดยแยกเป็น 2 ตารางที่สะอาด ย้ายข้อมูลเดิมไปให้ครบ แล้วลบตารางเละทิ้ง</p>
      <p><strong>Blueprint:</strong></p>
      <ul>
        <li><code>nc_customers</code>: <code>customer_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>city TEXT NOT NULL</code></li>
        <li><code>nc_orders</code>: <code>order_id INTEGER PRIMARY KEY</code>, <code>customer_id INTEGER NOT NULL</code>, <code>product_name TEXT NOT NULL</code>, <code>quantity INTEGER NOT NULL</code>, <code>FOREIGN KEY (customer_id) REFERENCES nc_customers (customer_id)</code></li>
      </ul>
      <p><strong>กติกาการ map ข้อมูล:</strong> กำหนด customer_id ตามลำดับชื่อที่ปรากฏครั้งแรกใน messy_orders — <code>'สมชาย ใจดี' → 1</code>, <code>'มาลี แสนดี' → 2</code> และเมื่อเสร็จแล้วให้ <code>DROP TABLE messy_orders;</code> ทิ้ง</p>
    `,
    tip: "อยากย้ายข้อมูลแบบมืออาชีพ ลอง <code>INSERT INTO ... SELECT ...</code> จากตารางเดิม (หรือจะ INSERT ตรง ๆ ก็ผ่านเหมือนกัน — ขอให้ข้อมูลผลลัพธ์ตรงกัน)",
    sql: `-- 🧹 ขั้นที่ 1: รันส่วนนี้เพื่อสร้าง "ตารางเละ" ปัญหาของบทนี้ก่อน
DROP TABLE IF EXISTS messy_orders;
CREATE TABLE messy_orders (
  order_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL
);
INSERT INTO messy_orders (order_id, customer_name, customer_city, product_name, quantity) VALUES
  (1, 'สมชาย ใจดี', 'กรุงเทพฯ', 'Mechanical Keyboard RGB', 1),
  (2, 'สมชาย ใจดี', 'กรุงเทพฯ', 'Webcam 1080p 60fps', 2),
  (3, 'มาลี แสนดี', 'กรุงเทพฯ', 'Mechanical Keyboard RGB', 1);

-- ขั้นที่ 2: เขียนคำตอบของคุณ (สร้าง nc_customers + nc_orders ย้ายข้อมูล แล้วลบ messy_orders)
-- เขียนต่อที่นี่`,
    challenge: {
      question: "สร้าง <code>nc_customers</code> และ <code>nc_orders</code> ตาม blueprint พร้อมข้อมูลที่ย้ายมาจาก messy_orders ครบทุกแถว (map ตามกติกาในบทเรียน) แล้ว <code>DROP TABLE messy_orders;</code>",
      hint: "nc_customers: <code>(1, 'สมชาย ใจดี', 'กรุงเทพฯ'), (2, 'มาลี แสนดี', 'กรุงเทพฯ')</code> · nc_orders: <code>(1, 1, 'Mechanical Keyboard RGB', 1), (2, 1, 'Webcam 1080p 60fps', 2), (3, 2, 'Mechanical Keyboard RGB', 1)</code> — และอย่าลืม DROP ตารางเดิม",
      solution: "DROP TABLE IF EXISTS nc_orders; DROP TABLE IF EXISTS nc_customers; CREATE TABLE nc_customers (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL); CREATE TABLE nc_orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, FOREIGN KEY (customer_id) REFERENCES nc_customers (customer_id)); INSERT INTO nc_customers (customer_id, name, city) VALUES (1, 'สมชาย ใจดี', 'กรุงเทพฯ'), (2, 'มาลี แสนดี', 'กรุงเทพฯ'); INSERT INTO nc_orders (order_id, customer_id, product_name, quantity) VALUES (1, 1, 'Mechanical Keyboard RGB', 1), (2, 1, 'Webcam 1080p 60fps', 2), (3, 2, 'Mechanical Keyboard RGB', 1); DROP TABLE IF EXISTS messy_orders;",
      checkSchema: true
    }
  },
  {
    id: 54,
    category: "design",
    categoryLabel: "Database Design",
    level: "Design #5 · Capstone",
    title: "🍽️ Boss: ออกแบบระบบสั่งอาหารออนไลน์ทั้งระบบ",
    description: `
      <p>Final Boss ของการออกแบบ: ลูกค้าต้องการระบบสั่งอาหารออนไลน์ — คุณต้องออกแบบ schema เองทั้งหมด 4 ตารางจาก requirement ภาษาคน:</p>
      <ul>
        <li>"ลูกค้าสมัครด้วยชื่อและเบอร์โทร ทั้งคู่จำเป็น"</li>
        <li>"ร้านอาหารแต่ละร้านมีชื่อและเมืองที่ตั้ง"</li>
        <li>"ออเดอร์หนึ่งใบเกิดจากลูกค้าหนึ่งคน สั่งที่ร้านหนึ่งร้าน ในวันเวลาหนึ่ง"</li>
        <li>"แต่ละออเดอร์มีได้หลายรายการอาหาร แต่ละรายการคือชื่อเมนู + จำนวนที่สั่ง"</li>
      </ul>
      <p><strong>Blueprint (ต้องตรงทุกจุด):</strong></p>
      <ul>
        <li><code>food_customers</code>: <code>customer_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>phone TEXT NOT NULL</code></li>
        <li><code>restaurants</code>: <code>restaurant_id INTEGER PRIMARY KEY</code>, <code>name TEXT NOT NULL</code>, <code>city TEXT NOT NULL</code></li>
        <li><code>food_orders</code>: <code>order_id INTEGER PRIMARY KEY</code>, <code>customer_id INTEGER NOT NULL</code>, <code>restaurant_id INTEGER NOT NULL</code>, <code>order_date TEXT NOT NULL</code>, FK ไปทั้ง food_customers และ restaurants</li>
        <li><code>food_order_lines</code>: <code>line_id INTEGER PRIMARY KEY</code>, <code>order_id INTEGER NOT NULL</code>, <code>menu_item TEXT NOT NULL</code>, <code>quantity INTEGER NOT NULL</code>, <code>FOREIGN KEY (order_id) REFERENCES food_orders (order_id)</code></li>
      </ul>
      <p>ลองคิดก่อนดู blueprint ใน hint: ถ้าออกแบบเองแล้วตรงกับ blueprint ทั้งหมด แปลว่าคุณเข้าใจ 1:N, M:N ผ่านตารางกลาง และ FK เรียบร้อยแล้ว</p>
    `,
    tip: "เคล็ดลับร่าง schema: ไฮไลต์คำนามใน requirement (ลูกค้า, ร้าน, ออเดอร์, รายการอาหาร) = ตาราง · คำกริยาเชื่อม (สั่ง, มี) = ความสัมพันธ์ · แล้วถามทีละคู่ว่าเป็น 1:N หรือ M:N",
    sql: `-- 🍽️ Final Boss: ออกแบบ 4 ตารางของระบบสั่งอาหาร
DROP TABLE IF EXISTS food_order_lines;
DROP TABLE IF EXISTS food_orders;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS food_customers;

-- เขียน CREATE TABLE ทั้ง 4 ตารางตาม blueprint แล้วแทรกข้อมูลตามโจทย์
-- เขียนต่อที่นี่`,
    challenge: {
      question: "สร้าง 4 ตารางตาม blueprint พร้อม FK ครบ 3 จุด แล้วแทรก: food_customers — <code>(1, 'ปอนด์', '081-111-2222') </code>, <code>(2, 'มิ้นท์', '089-333-4444') </code> · restaurants — <code>(1, 'ร้านข้าวมันไก่ต้นตำรับ', 'กรุงเทพฯ') </code>, <code>(2, 'สวนอาหารปลาเผา', 'เชียงใหม่') </code> · food_orders — <code>(501, 1, 1, '2026-09-10') </code>, <code>(502, 2, 2, '2026-09-11') </code> · food_order_lines — <code>(1, 501, 'ข้าวมันไก่พิเศษ', 2) </code>, <code>(2, 501, 'น้ำเปล่า', 1) </code>, <code>(3, 502, 'ปลาเผาเค็ม', 1) </code>",
      hint: "ลำดับการสร้าง: ตารางที่ถูกอ้างอิงก่อน (food_customers, restaurants) → ตารางกลาง (food_orders) → ตารางลูก (food_order_lines) — และแต่ละ FK อ้างชื่อตาราง+คอลัมน์ให้ตรง blueprint",
      solution: "DROP TABLE IF EXISTS food_order_lines; DROP TABLE IF EXISTS food_orders; DROP TABLE IF EXISTS restaurants; DROP TABLE IF EXISTS food_customers; CREATE TABLE food_customers (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL); CREATE TABLE restaurants (restaurant_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL); CREATE TABLE food_orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, restaurant_id INTEGER NOT NULL, order_date TEXT NOT NULL, FOREIGN KEY (customer_id) REFERENCES food_customers (customer_id), FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id)); CREATE TABLE food_order_lines (line_id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL, menu_item TEXT NOT NULL, quantity INTEGER NOT NULL, FOREIGN KEY (order_id) REFERENCES food_orders (order_id)); INSERT INTO food_customers (customer_id, name, phone) VALUES (1, 'ปอนด์', '081-111-2222'), (2, 'มิ้นท์', '089-333-4444'); INSERT INTO restaurants (restaurant_id, name, city) VALUES (1, 'ร้านข้าวมันไก่ต้นตำรับ', 'กรุงเทพฯ'), (2, 'สวนอาหารปลาเผา', 'เชียงใหม่'); INSERT INTO food_orders (order_id, customer_id, restaurant_id, order_date) VALUES (501, 1, 1, '2026-09-10'), (502, 2, 2, '2026-09-11'); INSERT INTO food_order_lines (line_id, order_id, menu_item, quantity) VALUES (1, 501, 'ข้าวมันไก่พิเศษ', 2), (2, 501, 'น้ำเปล่า', 1), (3, 502, 'ปลาเผาเค็ม', 1);",
      checkSchema: true
    }
  }
];
