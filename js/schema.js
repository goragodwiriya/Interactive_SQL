/**
 * SQL Journey — Database Schema and Seed Data
 * จำลองฐานข้อมูลร้านค้า E-Commerce (ShopNova Thailand)
 *
 * โครงสร้างข้อมูล:
 *  - ข้อมูลต้นฉบับ (customers 1-7, products 1-10, orders 101-108,
 *    order_items 1-13, reviews 1-6) ถูกอ้างอิงโดยบทเรียน — ห้ามแก้
 *  - ข้อมูลส่วนขยาย generate แบบ deterministic (PRNG แบบ mulberry32)
 *    เพื่อให้ทุกเครื่องได้ผลลัพธ์เหมือนกัน 100%
 *  - ID สงวน: category_id 5 (บทที่ 7, 27), product_id 11 (บทที่ 27),
 *    review_id 7 (บทที่ 26) — ห้ามมีใน seed
 *  - ลูกค้า 42/45/47/48 ไม่มีออเดอร์ (สำหรับโจทย์ LEFT JOIN / NOT EXISTS)
 *  - สินค้า 36-40 เป็นสินค้าใหม่ rating = NULL และยังไม่เคยขาย
 */

// ==========================================
// 1. Deterministic PRNG (mulberry32) — ใช้แค่ integer math จึงได้ค่าเดิมทุกเครื่อง
// ==========================================
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedRandom = mulberry32(20260915);
const randInt = (min, max) => min + Math.floor(seedRandom() * (max - min + 1));
const pick = (arr) => arr[Math.floor(seedRandom() * arr.length)];
const pad2 = (n) => String(n).padStart(2, "0");
const sqlStr = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replaceAll("'", "''")}'`);
const sqlNum = (v) => (v === null || v === undefined ? "NULL" : v);

// ==========================================
// 2. Schema (DDL) — เหมือนเดิมทุกประการ
// ==========================================
const initialDDL = `
  -- ล้างตารางเดิม (ถ้ามี)
  DROP TABLE IF EXISTS reviews;
  DROP TABLE IF EXISTS order_items;
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS categories;
  DROP TABLE IF EXISTS customers;

  -- 1. ตารางหมวดหมู่สินค้า (Categories)
  CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );

  -- 2. ตารางลูกค้า (Customers)
  CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    member_tier TEXT DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
    registered_date TEXT DEFAULT '2025-01-01'
  );

  -- 3. ตารางสินค้า (Products)
  CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
  );

  -- 4. ตารางคำสั่งซื้อ (Orders)
  CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, shipped, completed, cancelled
    payment_method TEXT, -- Credit Card, PromptPay, TrueMoney, Cash on Delivery (NULL = ยังไม่ได้ชำระ)
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  );

  -- 5. ตารางรายการสินค้าในคำสั่งซื้อ (Order Items)
  CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  );

  -- 6. ตารางรีวิวสินค้า (Reviews)
  CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TEXT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  );
`;

// ==========================================
// 3. Seed ต้นฉบับ — ห้ามแก้ (บทเรียนหลายบทอ้างอิงค่าเหล่านี้)
// ==========================================
const originalSeed = `
  -- ----------------------------------------------------
  -- INSERT SEED DATA (ต้นฉบับ)
  -- ----------------------------------------------------

  -- เพิ่มหมวดหมู่
  INSERT INTO categories (category_id, name, description) VALUES
    (1, 'IT & Computer', 'อุปกรณ์คอมพิวเตอร์และโน้ตบุ๊ก'),
    (2, 'Accessories', 'อุปกรณ์เสริมและแกดเจ็ตพกพา'),
    (3, 'Office & Work', 'โต๊ะ เก้าอี้ และอุปกรณ์ทำงาน Ergonomic'),
    (4, 'Audio & Sound', 'หูฟัง ลำโพง และไมโครโฟนบันทึกเสียง');

  -- เพิ่มลูกค้า
  INSERT INTO customers (customer_id, name, email, city, member_tier, registered_date) VALUES
    (1, 'สมชาย ใจดี', 'somchai@example.com', 'กรุงเทพฯ', 'Gold', '2025-01-10'),
    (2, 'สุดา รุ่งเรือง', 'suda@example.com', 'เชียงใหม่', 'Platinum', '2025-02-15'),
    (3, 'อนันต์ มีสุข', 'anan@example.com', 'ขอนแก่น', 'Silver', '2025-03-01'),
    (4, 'มาลี แสนดี', 'malee@example.com', 'กรุงเทพฯ', 'Bronze', '2025-03-20'),
    (5, 'กิตติศักดิ์ พัฒนา', 'kittisak@example.com', 'ภูเก็ต', 'Silver', '2025-04-05'),
    (6, 'วราภรณ์ วงศ์ไทย', 'waraporn@example.com', 'ชลบุรี', 'Gold', '2025-05-12'),
    (7, 'ธนากร มั่งมี', 'thanakorn@example.com', 'กรุงเทพฯ', 'Bronze', '2025-06-01');

  -- เพิ่มสินค้า
  INSERT INTO products (product_id, name, category_id, price, stock, rating) VALUES
    (1, 'Mechanical Keyboard RGB', 2, 2490.00, 18, 4.8),
    (2, 'Wireless Ergonomic Mouse', 2, 890.00, 42, 4.5),
    (3, '27-inch 4K IPS Monitor', 1, 7990.00, 8, 4.9),
    (4, 'USB-C 7-in-1 Multi Hub', 2, 1290.00, 25, 4.3),
    (5, 'Ergonomic Desk Stand', 3, 1590.00, 12, 4.7),
    (6, 'Noise Cancelling Headphones', 4, 4590.00, 15, 4.8),
    (7, 'Studio USB Condenser Mic', 4, 2190.00, 20, 4.6),
    (8, 'Ultra-wide Gaming Desk', 3, 5490.00, 5, 4.4),
    (9, 'Webcam 1080p 60fps', 1, 1890.00, 30, 4.2),
    (10, 'Bluetooth Portable Speaker', 4, 1490.00, 0, 4.1);

  -- เพิ่มคำสั่งซื้อ
  INSERT INTO orders (order_id, customer_id, order_date, status, payment_method) VALUES
    (101, 1, '2026-01-15', 'completed', 'Credit Card'),
    (102, 2, '2026-01-18', 'completed', 'PromptPay'),
    (103, 1, '2026-02-02', 'shipped', 'PromptPay'),
    (104, 3, '2026-02-10', 'completed', 'TrueMoney'),
    (105, 5, '2026-02-22', 'completed', 'Credit Card'),
    (106, 6, '2026-03-01', 'pending', 'Credit Card'),
    (107, 2, '2026-03-05', 'completed', 'PromptPay'),
    (108, 4, '2026-03-12', 'cancelled', 'Cash on Delivery');

  -- เพิ่มรายการสินค้าในคำสั่งซื้อ
  INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
    (1, 101, 1, 1, 2490.00),
    (2, 101, 2, 1, 890.00),
    (3, 102, 3, 1, 7990.00),
    (4, 102, 6, 1, 4590.00),
    (5, 103, 4, 2, 1290.00),
    (6, 104, 5, 1, 1590.00),
    (7, 104, 2, 2, 890.00),
    (8, 105, 7, 1, 2190.00),
    (9, 105, 9, 1, 1890.00),
    (10, 106, 8, 1, 5490.00),
    (11, 107, 1, 2, 2490.00),
    (12, 107, 4, 1, 1290.00),
    (13, 108, 2, 1, 890.00);

  -- เพิ่มรีวิวสินค้า
  INSERT INTO reviews (review_id, product_id, customer_id, rating, comment, review_date) VALUES
    (1, 1, 1, 5, 'คีย์บอร์ดสัมผัสดีมาก เสียงกดเพราะ ไฟ RGB สวยงาม คุ้มราคา', '2026-01-20'),
    (2, 2, 1, 4, 'เมาส์จับถนัดมือ ไม่เมื่อยข้อมือ แบตเตอรี่อึด', '2026-01-22'),
    (3, 3, 2, 5, 'จอคมชัดมาก สีตรง เหมาะกับงานแต่งภาพและเขียนโค้ด', '2026-01-25'),
    (4, 6, 2, 5, 'ตัดเสียงรบกวนได้เงียบสนิท ใส่นานๆ ไม่เจ็บหู', '2026-01-26'),
    (5, 5, 3, 4, 'ขาตั้งแข็งแรงมาก ปรับระดับได้ตามต้องการ', '2026-02-15'),
    (6, 7, 5, 5, 'ไมค์เสียงใส ชัดเจน ไม่มีเสียงซ่ารบกวน เหมาะกับการประชุม', '2026-02-28');
`;

// ==========================================
// 4. ลูกค้าเพิ่มเติม id 8-48 (42/45/47/48 ไม่มีออเดอร์)
//    [ชื่อ, email local, จังหวัด, tier, วันสมัคร]
// ==========================================
const extraCustomers = [
  ["ปิยะพงษ์ ศรีสุข", "piyapong", "นครราชสีมา", "Silver", "2025-04-12"],
  ["จันทร์เพ็ญ แก้วมณี", "chanphen", "กรุงเทพฯ", "Gold", "2025-04-18"],
  ["ธีรวัฒน์ พูลทรัพย์", "theerawat", "ชลบุรี", "Bronze", "2025-05-02"],
  ["ศิริพร ทองใส", "siriporn", "ขอนแก่น", "Silver", "2025-05-09"],
  ["ณัฐพล วิศวชาติ", "nattapol", "กรุงเทพฯ", "Bronze", "2025-05-15"],
  ["พรทิพย์ สายทอง", "pornthip", "เชียงใหม่", "Gold", "2025-05-27"],
  ["อธิป รัตนโชติ", "athip", "อุดรธานี", "Bronze", "2025-06-03"],
  ["มะลิ วรรณพงษ์", "maliw", "สงขลา", "Bronze", "2025-06-11"],
  ["กฤษณะ โชติกุล", "kritsana", "กรุงเทพฯ", "Silver", "2025-06-19"],
  ["วันเพ็ญ ทับทิมทอง", "wanphen", "พิษณุโลก", "Silver", "2025-06-25"],
  ["สุรเชษฐ์ พันธุ์ดี", "surachet", "ชลบุรี", "Gold", "2025-07-01"],
  ["อรทัย ใบโพธิ์", "ornthai", "นครราชสีมา", "Bronze", "2025-07-08"],
  ["พีรพงศ์ เกียรติศักดิ์", "peerapol", "กรุงเทพฯ", "Platinum", "2025-07-15"],
  ["ญาณิศา ขจรไพบูลย์", "yanisa", "ขอนแก่น", "Silver", "2025-07-22"],
  ["ธนกฤต อินทร์แปลง", "thanakrit", "ภูเก็ต", "Bronze", "2025-08-05"],
  ["ศกุนต์ ภู่เจริญ", "sakont", "กรุงเทพฯ", "Silver", "2025-08-14"],
  ["รัตนา ศรีทอง", "ratana", "สุราษฎร์ธานี", "Bronze", "2025-08-20"],
  ["ชัยวัฒน์ บุญมาก", "chaiwat", "เชียงใหม่", "Gold", "2025-08-27"],
  ["ปวีณา จันทร์เจ้าของ", "paveena", "กรุงเทพฯ", "Silver", "2025-09-03"],
  ["สมศักดิ์ มั่นคง", "somsak", "อุดรธานี", "Bronze", "2025-09-10"],
  ["ลลิตา สุขเกษม", "lalita", "กรุงเทพฯ", "Gold", "2025-09-18"],
  ["วิโรจน์ เรืองศรี", "wiroj", "ชลบุรี", "Bronze", "2025-09-25"],
  ["กัญญารัตน์ ปิ่นทอง", "kanyarat", "เชียงใหม่", "Silver", "2025-10-02"],
  ["ธีรภูมิ สว่างวงศ์", "theerapoom", "นครราชสีมา", "Bronze", "2025-10-09"],
  ["ศันสนีย์ นพคุณ", "sansanee", "กรุงเทพฯ", "Platinum", "2025-10-15"],
  ["ประเสริฐ กิจรุ่งเรือง", "prasert", "สงขลา", "Silver", "2025-10-22"],
  ["จิราพร มณีรัตน์", "jiraporn", "ขอนแก่น", "Bronze", "2025-10-30"],
  ["อนุชา วงศ์วิโรจน์", "anucha", "พิษณุโลก", "Bronze", "2025-11-05"],
  ["พิมพ์ลภัส ศรีสวัสดิ์", "pimlapat", "กรุงเทพฯ", "Gold", "2025-11-12"],
  ["ชาลิสา เผ่าไทย", "chalisa", "ภูเก็ต", "Silver", "2025-11-19"],
  ["สถาพร นิลไพร", "sthaporn", "ชลบุรี", "Bronze", "2025-11-26"],
  ["อัจฉราพร แสงอาทิตย์", "atcharaporn", "กรุงเทพฯ", "Silver", "2025-12-03"],
  ["วิชัย พัฒนกิจ", "wichai", "เชียงใหม่", "Bronze", "2025-12-10"],
  ["ปานเทพ ชูเกียรติ", "panthep", "นครราชสีมา", "Gold", "2025-12-18"],
  ["นภา ตันติวงศ์", "napa", "กรุงเทพฯ", "Bronze", "2026-01-05"],
  ["กมลชนก บุญนำ", "kamonchanok", "สุราษฎร์ธานี", "Silver", "2026-01-12"],
  ["ธัญญา ประเสริฐกุล", "thanya", "ขอนแก่น", "Bronze", "2026-01-20"],
  ["ศรายุทธ พูลสุข", "sarayut", "ภูเก็ต", "Bronze", "2026-01-27"],
  ["พัชรา ไกรศรี", "pachara", "กรุงเทพฯ", "Silver", "2026-02-02"],
  ["อิสระ ชาติเจริญ", "isara", "อุดรธานี", "Bronze", "2026-02-14"],
  ["ขวัญจิตร หอมกลิ่น", "kwanchit", "เชียงใหม่", "Bronze", "2026-02-21"]
];

// ==========================================
// 5. สินค้าเพิ่มเติม id 12-40 (id 11 สงวน / 36-40 สินค้าใหม่ rating NULL)
//    [ชื่อ, category_id, ราคา, สต็อก, rating(null=ยังไม่มีคะแนน)]
// ==========================================
const extraProducts = [
  ["USB-C Fast Charging Cable 100W", 2, 390, 60, 4.4],
  ["Wireless Charging Pad 15W", 2, 690, 35, 4.2],
  ["Laptop Stand Aluminum", 3, 890, 28, 4.6],
  ["Mechanical Keyboard TKL", 2, 3290, 22, 4.7],
  ["Gaming Mouse 16000 DPI", 2, 1890, 40, 4.5],
  ["24-inch IPS Monitor 75Hz", 1, 4290, 14, 4.4],
  ["External SSD 1TB", 1, 3890, 20, 4.8],
  ["Wi-Fi 6 Router AX3000", 1, 2590, 16, 4.3],
  ["1080p Projector Mini", 1, 6790, 6, 4.1],
  ["Standing Desk Electric", 3, 8990, 7, 4.6],
  ["Ergonomic Chair Pro", 3, 6990, 9, 4.5],
  ["Desk Organizer Set", 3, 590, 45, 4.0],
  ["TWS Earbuds ANC", 4, 2990, 30, 4.6],
  ["Bluetooth Speaker Mini", 4, 990, 38, 4.2],
  ["Soundbar 2.1Ch", 4, 5490, 12, 4.4],
  ["Studio Monitor Pair", 4, 9990, 4, 4.8],
  ["Wireless Lavalier Mic", 4, 1690, 18, 4.3],
  ["USB Microphone Compact", 4, 1290, 26, 4.1],
  ["Gaming Headset 7.1", 4, 2190, 24, 4.5],
  ["Laptop Sleeve 14 inch", 2, 490, 50, 4.0],
  ["Screen Protector Pack", 2, 290, 80, 3.9],
  ["Power Bank 20000mAh", 2, 1190, 32, 4.4],
  ["USB-C Docking Station 12-in-1", 1, 4890, 11, 4.5],
  ["Graphics Tablet Small", 1, 2290, 15, 4.3],
  ["Smart Desk Lamp (New Arrival)", 3, 1590, 20, null],
  ["Portable Monitor 15.6 inch (New Arrival)", 1, 5290, 10, null],
  ["Neckband Earphones (New Arrival)", 4, 790, 25, null],
  ["Vertical Mouse Wireless (New Arrival)", 2, 1090, 15, null],
  ["Gaming Chair Mat XL (New Arrival)", 3, 890, 18, null]
];

// ==========================================
// 6. Generate ออเดอร์ / รายการสินค้า / รีวิวเพิ่ม
// ==========================================
const paymentMethods = ["Credit Card", "PromptPay", "TrueMoney", "Cash on Delivery"];

// ลูกค้าที่ "มีออเดอร์" — ตัด 42/45/47/48 (ลูกค้าเงียบๆ ไว้ทำโจทย์ anti-join)
const noOrderCustomerIds = [42, 45, 47, 48];
const orderableCustomerIds = [];
for (let id = 1; id <= 48; id++) {
  if (!noOrderCustomerIds.includes(id)) orderableCustomerIds.push(id);
}

// ราคาสินค้า id -> price (รวมต้นฉบับ + ใหม่)
const productPrices = new Map([
  [1, 2490], [2, 890], [3, 7990], [4, 1290], [5, 1590],
  [6, 4590], [7, 2190], [8, 5490], [9, 1890], [10, 1490],
  ...extraProducts.map((p, i) => [i + 12, p[2]])
]);

// สินค้าที่ถูกซื้อขาย: ตัดสินค้าขายไม่ได้/สงวน (10 = ตัวเดิมที่ไม่เคยขาย, 36-40 สินค้าใหม่, 11 สงวน)
const unsoldProductIds = [10, 36, 37, 38, 39, 40];
const purchasableProductIds = [...productPrices.keys()].filter(
  (id) => !unsoldProductIds.includes(id)
);

// รอบแรก: ยืนยันว่าลูกค้าทุกคนใน pool มีออเดอร์อย่างน้อย 1 ชิ้น (สลับลำดับแบบ deterministic)
const firstPassCustomers = [...orderableCustomerIds];
for (let i = firstPassCustomers.length - 1; i > 0; i--) {
  const j = Math.floor(seedRandom() * (i + 1));
  [firstPassCustomers[i], firstPassCustomers[j]] = [firstPassCustomers[j], firstPassCustomers[i]];
}

const EXTRA_ORDER_COUNT = 140;
const orderRows = [];
const itemRows = [];
let nextOrderItemId = 14; // ต่อจากต้นฉบับ (1-13)

for (let n = 0; n < EXTRA_ORDER_COUNT; n++) {
  const orderId = 201 + n;
  const customerId = n < firstPassCustomers.length
    ? firstPassCustomers[n]
    : pick(orderableCustomerIds);

  // วันที่กระจาย 2025-10 ถึง 2026-09 (เอียงมาทางปีล่าสุดเล็กน้อย)
  const monthIndex = Math.floor(11 * Math.pow(seedRandom(), 0.8));
  const year = monthIndex <= 2 ? 2025 : 2026;
  const month = monthIndex <= 2 ? 10 + monthIndex : monthIndex - 2;
  const orderDate = `${year}-${pad2(month)}-${pad2(randInt(1, 28))}`;

  // pending = ยังไม่ได้เลือกวิธีชำระ → payment_method เป็น NULL (ใช้สอน IS NULL)
  const sr = seedRandom();
  let status, payment;
  if (sr < 0.62) { status = "completed"; payment = pick(paymentMethods); }
  else if (sr < 0.74) { status = "shipped"; payment = pick(paymentMethods); }
  else if (sr < 0.87) { status = "pending"; payment = null; }
  else { status = "cancelled"; payment = seedRandom() < 0.5 ? null : pick(paymentMethods); }

  orderRows.push([orderId, customerId, orderDate, status, payment]);

  // รายการสินค้า 1-3 ชิ้น ไม่ซ้ำสินค้าในออเดอร์เดียว
  const itemCount = randInt(1, 3);
  const chosenProducts = new Set();
  while (chosenProducts.size < itemCount) {
    chosenProducts.add(pick(purchasableProductIds));
  }
  for (const productId of chosenProducts) {
    itemRows.push([nextOrderItemId++, orderId, productId, randInt(1, 3), productPrices.get(productId)]);
  }
}

// รีวิวเพิ่ม id 8-67 (review_id 7 สงวนให้บทที่ 26)
const reviewComments = [
  "คุ้มค่ามาก แนะนำเลยค่ะ",
  "สินค้าดี จัดส่งเร็วมาก",
  "ใช้งานสะดวก ดีไซน์สวย",
  "คุณภาพดีกว่าราคาที่จ่าย",
  "เสียงดีมาก ชอบมากครับ",
  "แบตอึด ใช้ทั้งวันได้สบาย",
  "วัสดุแข็งแรง ประกอบง่าย",
  "ปกติดี แต่แพ็กเกจน่าจะดีกว่านี้",
  "ยังใช้ไม่ค่อยเท่าไหร่ แต่โอเคครับ",
  "ทำงานลื่นๆ ไม่มีสะดุด",
  "ซื้อซ้ำแล้ว ประทับใจ",
  "หน้าจอชัด สีสวยสมจริง"
];
const ratingPool = [5, 5, 5, 4, 4, 4, 4, 3, 3, 2];

const reviewRows = [];
for (let reviewId = 8; reviewId <= 67; reviewId++) {
  const productId = pick(purchasableProductIds);
  const customerId = pick(orderableCustomerIds);
  const rating = pick(ratingPool);
  const comment = seedRandom() < 0.3 ? null : pick(reviewComments); // บางรีวิวให้แค่คะแนน ไม่เขียนคอมเมนต์
  const reviewDate = `2026-${pad2(randInt(1, 9))}-${pad2(randInt(1, 28))}`;
  reviewRows.push([reviewId, productId, customerId, rating, comment, reviewDate]);
}

// ==========================================
// 7. ประกอบ SQL ทั้งหมด
// ==========================================
const toValuesSql = (rows) =>
  rows.map((r) => `    (${r.join(", ")})`).join(",\n");

const extraCustomersSql = toValuesSql(
  extraCustomers.map((c, i) => [i + 8, sqlStr(c[0]), sqlStr(`${c[1]}@example.com`), sqlStr(c[2]), sqlStr(c[3]), sqlStr(c[4])])
);
const extraProductsSql = toValuesSql(
  extraProducts.map((p, i) => [i + 12, sqlStr(p[0]), p[1], sqlNum(p[2]), sqlNum(p[3]), sqlNum(p[4])])
);
const extraOrdersSql = toValuesSql(
  orderRows.map((o) => [o[0], o[1], sqlStr(o[2]), sqlStr(o[3]), sqlStr(o[4])])
);
const extraItemsSql = toValuesSql(itemRows);
const extraReviewsSql = toValuesSql(
  reviewRows.map((r) => [r[0], r[1], r[2], r[3], sqlStr(r[4]), sqlStr(r[5])])
);

const generatedSeed = `
  -- ----------------------------------------------------
  -- GENERATED SEED (deterministic — แก้ไขผ่าน generator ด้านบนเท่านั้น)
  --  - ลูกค้า 8-48 (42/45/47/48 ไม่มีออเดอร์)
  --  - สินค้า 12-40 (36-40 ยังไม่เคยขาย + rating NULL)
  --  - ออเดอร์ 201-${200 + EXTRA_ORDER_COUNT}, รีวิว 8-67 (7 สงวน)
  --  - payment_method เป็น NULL สำหรับออเดอร์ที่ยังไม่ได้ชำระ
  -- ----------------------------------------------------

  INSERT INTO customers (customer_id, name, email, city, member_tier, registered_date) VALUES
${extraCustomersSql};

  INSERT INTO products (product_id, name, category_id, price, stock, rating) VALUES
${extraProductsSql};

  INSERT INTO orders (order_id, customer_id, order_date, status, payment_method) VALUES
${extraOrdersSql};

  INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
${extraItemsSql};

  INSERT INTO reviews (review_id, product_id, customer_id, rating, comment, review_date) VALUES
${extraReviewsSql};
`;

const initialSQL = initialDDL + originalSeed + generatedSeed;

// Schema Metadata for Schema Explorer UI
const databaseTables = [
  {
    name: "categories",
    description: "หมวดหมู่สินค้าทั้งหมด",
    columns: [
      { name: "category_id", type: "INTEGER (PK)", desc: "รหัสหมวดหมู่" },
      { name: "name", type: "TEXT (UNIQUE)", desc: "ชื่อหมวดหมู่" },
      { name: "description", type: "TEXT", desc: "รายละเอียดหมวดหมู่" }
    ]
  },
  {
    name: "products",
    description: "ข้อมูลสินค้า สต็อก ราคา และคะแนนรีวิว",
    columns: [
      { name: "product_id", type: "INTEGER (PK)", desc: "รหัสสินค้า" },
      { name: "name", type: "TEXT", desc: "ชื่อสินค้า" },
      { name: "category_id", type: "INTEGER (FK)", desc: "รหัสหมวดหมู่" },
      { name: "price", type: "REAL", desc: "ราคาต่อหน่วย (บาท)" },
      { name: "stock", type: "INTEGER", desc: "จำนวนคงเหลือในคลัง" },
      { name: "rating", type: "REAL", desc: "คะแนนเฉลี่ย (NULL = สินค้าใหม่ยังไม่มีรีวิว)" }
    ]
  },
  {
    name: "customers",
    description: "ข้อมูลสมาชิกและลูกค้าของร้านค้า",
    columns: [
      { name: "customer_id", type: "INTEGER (PK)", desc: "รหัสลูกค้า" },
      { name: "name", type: "TEXT", desc: "ชื่อ-นามสกุล" },
      { name: "email", type: "TEXT (UNIQUE)", desc: "อีเมลติดต่อ" },
      { name: "city", type: "TEXT", desc: "จังหวัดที่อยู่" },
      { name: "member_tier", type: "TEXT", desc: "ระดับสมาชิก (Bronze, Silver, Gold, Platinum)" },
      { name: "registered_date", type: "TEXT", desc: "วันที่สมัครสมาชิก" }
    ]
  },
  {
    name: "orders",
    description: "ประวัติการสั่งซื้อสินค้าและสถานะคำสั่งซื้อ",
    columns: [
      { name: "order_id", type: "INTEGER (PK)", desc: "รหัสคำสั่งซื้อ" },
      { name: "customer_id", type: "INTEGER (FK)", desc: "รหัสลูกค้าผู้สั่งซื้อ" },
      { name: "order_date", type: "TEXT", desc: "วันที่สั่งซื้อ (YYYY-MM-DD)" },
      { name: "status", type: "TEXT", desc: "สถานะ (pending, shipped, completed, cancelled)" },
      { name: "payment_method", type: "TEXT", desc: "ช่องทางชำระเงิน (NULL = ยังไม่ได้ชำระ)" }
    ]
  },
  {
    name: "order_items",
    description: "รายการสินค้าย่อยในแต่ละคำสั่งซื้อ",
    columns: [
      { name: "order_item_id", type: "INTEGER (PK)", desc: "รหัสรายการ" },
      { name: "order_id", type: "INTEGER (FK)", desc: "รหัสคำสั่งซื้อ" },
      { name: "product_id", type: "INTEGER (FK)", desc: "รหัสสินค้า" },
      { name: "quantity", type: "INTEGER", desc: "จำนวนชิ้น" },
      { name: "unit_price", type: "REAL", desc: "ราคาต่อหน่วย ณ เวลาที่ซื้อ" }
    ]
  },
  {
    name: "reviews",
    description: "รีวิวและความคิดเห็นจากลูกค้า",
    columns: [
      { name: "review_id", type: "INTEGER (PK)", desc: "รหัสรีวิว" },
      { name: "product_id", type: "INTEGER (FK)", desc: "รหัสสินค้า" },
      { name: "customer_id", type: "INTEGER (FK)", desc: "รหัสลูกค้า" },
      { name: "rating", type: "INTEGER", desc: "คะแนนดาว (1-5)" },
      { name: "comment", type: "TEXT", desc: "ข้อความรีวิว (NULL = ให้แค่คะแนน)" },
      { name: "review_date", type: "TEXT", desc: "วันที่รีวิว" }
    ]
  }
];
