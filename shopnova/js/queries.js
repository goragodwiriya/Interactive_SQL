/**
 * ShopNova Thailand — SQL ทั้งหมดของแอป จัดกลุ่มตามบทเรียน SQL Journey
 *
 * ทุก query ใช้ placeholder "?" และ bind ค่าผ่าน sql.js เสมอ (บท 21)
 * ป้าย `lesson` จะแสดงใน SQL Inspector เพื่อชี้ว่าฟีเจอร์นี้มาจากบทไหน
 */
const Q = {
  // ==========================================================
  // หน้าร้าน (Storefront)
  // ==========================================================
  storeStats: {
    lesson: "บท 10 · Aggregate + บท 17 · Scalar Subquery",
    sql: `SELECT (SELECT COUNT(*) FROM products)                        AS products,
                 (SELECT COUNT(*) FROM customers)                       AS customers,
                 (SELECT COUNT(*) FROM orders WHERE status = 'completed') AS completed_orders,
                 (SELECT ROUND(AVG(rating), 1) FROM reviews)             AS avg_rating,
                 (SELECT COUNT(*) FROM reviews)                         AS reviews`
  },

  categories: {
    lesson: "บท 13 · LEFT JOIN + บท 11 · GROUP BY",
    sql: `SELECT c.category_id, c.name, c.description,
                 COUNT(p.product_id) AS product_count,
                 MIN(p.price)        AS min_price
          FROM categories c
          LEFT JOIN products p ON p.category_id = c.category_id
          GROUP BY c.category_id
          ORDER BY c.category_id`
  },

  // สร้าง query แคตตาล็อกแบบไดนามิก — เงื่อนไขมาจากตัวกรอง แต่ค่าทุกตัวยังเป็น parameter
  catalog(f) {
    const where = [];
    const params = [];
    if (f.category) { where.push("p.category_id = ?"); params.push(Number(f.category)); }
    if (f.q) { where.push("p.name LIKE ?"); params.push(`%${f.q}%`); }            // บท 4 · LIKE
    if (f.inStock) where.push("p.stock > 0");                                        // บท 2 · WHERE
    if (f.minPrice != null) { where.push("p.price >= ?"); params.push(Number(f.minPrice)); }
    if (f.maxPrice != null) { where.push("p.price <= ?"); params.push(Number(f.maxPrice)); }
    if (f.minRating) { where.push("p.rating >= ?"); params.push(Number(f.minRating)); } // NULL rating จะถูกตัดออกโดยธรรมชาติ (บท 6)
    if (f.newOnly) where.push("p.rating IS NULL");                                   // บท 6 · IS NULL

    // ORDER BY ใส่ค่าเป็น parameter ไม่ได้ → ใช้ whitelist แทน (บท 21)
    const sorts = {
      popular:    "s.sold_qty DESC, p.rating DESC",
      price_asc:  "p.price ASC",
      price_desc: "p.price DESC",
      rating:     "p.rating IS NULL, p.rating DESC, s.review_count DESC",
      newest:     "p.product_id DESC",
      name:       "p.name COLLATE NOCASE ASC"
    };
    const orderBy = sorts[f.sort] || sorts.popular;
    const whereSql = where.length ? `WHERE ${where.join("\n            AND ")}` : "";

    const sql = `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id,
                 c.name AS category_name,
                 s.sold_qty, s.review_count, s.avg_review,
                 (p.price = (SELECT MIN(x.price) FROM products x WHERE x.category_id = p.category_id)) AS cheapest_in_cat
          FROM products p
          JOIN categories c        ON c.category_id = p.category_id
          LEFT JOIN v_product_stats s ON s.product_id = p.product_id
          ${whereSql}
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) AS total FROM products p ${whereSql}`;
    return {
      lesson: "บท 2-5 · WHERE / LIKE / ORDER BY / LIMIT + บท 24 · VIEW",
      sql,
      params: [...params, f.limit, f.offset],
      countSql,
      countParams: params
    };
  },

  searchSuggest: {
    lesson: "บท 4 · LIKE + บท 21 · Parameter Binding",
    sql: `SELECT p.product_id, p.name, p.price, c.name AS category_name
          FROM products p JOIN categories c ON c.category_id = p.category_id
          WHERE p.name LIKE ?
          ORDER BY p.rating IS NULL, p.rating DESC
          LIMIT 6`
  },

  bestSellers: {
    lesson: "บท 40 · Top-N สินค้าขายดี (JOIN + GROUP BY + LIMIT)",
    sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name,
                 SUM(oi.quantity) AS sold_qty, SUM(oi.quantity * oi.unit_price) AS revenue
          FROM order_items oi
          JOIN orders o     ON o.order_id = oi.order_id
          JOIN products p   ON p.product_id = oi.product_id
          JOIN categories c ON c.category_id = p.category_id
          WHERE o.status = 'completed'
          GROUP BY p.product_id
          ORDER BY sold_qty DESC, revenue DESC
          LIMIT ?`
  },

  newArrivals: {
    lesson: "บท 6 · IS NULL (สินค้าใหม่ยังไม่มีคะแนน)",
    sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name
          FROM products p JOIN categories c ON c.category_id = p.category_id
          WHERE p.rating IS NULL
          ORDER BY p.product_id DESC
          LIMIT ?`
  },

  topRated: {
    lesson: "บท 5 · ORDER BY + LIMIT",
    sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name
          FROM products p JOIN categories c ON c.category_id = p.category_id
          WHERE p.rating >= 4.6 AND p.stock > 0
          ORDER BY p.rating DESC, p.price DESC
          LIMIT ?`
  },

  // ---------- หน้าสินค้า ----------
  productDetail: {
    lesson: "บท 12 · INNER JOIN + บท 24 · VIEW",
    sql: `SELECT p.*, c.name AS category_name, c.description AS category_desc,
                 s.sold_qty, s.revenue, s.review_count, s.avg_review
          FROM products p
          JOIN categories c ON c.category_id = p.category_id
          LEFT JOIN v_product_stats s ON s.product_id = p.product_id
          WHERE p.product_id = ?`
  },

  productRankInCategory: {
    lesson: "บท 19 · DENSE_RANK() OVER (PARTITION BY ...)",
    sql: `WITH sales AS (
            SELECT p.product_id, p.category_id,
                   COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity END), 0) AS sold_qty
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.product_id
            LEFT JOIN orders o ON o.order_id = oi.order_id
            GROUP BY p.product_id
          ),
          ranked AS (
            SELECT product_id, sold_qty,
                   DENSE_RANK() OVER (PARTITION BY category_id ORDER BY sold_qty DESC) AS sales_rank,
                   COUNT(*) OVER (PARTITION BY category_id) AS products_in_cat
            FROM sales
          )
          SELECT sales_rank, products_in_cat FROM ranked WHERE product_id = ?`
  },

  ratingBreakdown: {
    lesson: "บท 28 · Conditional Aggregation SUM(CASE WHEN)",
    sql: `SELECT COUNT(*) AS total,
                 ROUND(AVG(rating), 1) AS avg_rating,
                 SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star5,
                 SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star4,
                 SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star3,
                 SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star2,
                 SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star1,
                 SUM(CASE WHEN comment IS NULL THEN 1 ELSE 0 END) AS no_comment
          FROM reviews WHERE product_id = ?`
  },

  productReviews: {
    lesson: "บท 12 · JOIN + บท 25 · EXISTS (ผู้ซื้อจริง)",
    sql: `SELECT r.review_id, r.rating, r.comment, r.review_date,
                 c.customer_id, c.name AS customer_name, c.member_tier, c.city,
                 EXISTS (
                   SELECT 1 FROM orders o
                   JOIN order_items oi ON oi.order_id = o.order_id
                   WHERE o.customer_id = r.customer_id
                     AND oi.product_id = r.product_id
                     AND o.status <> 'cancelled'
                 ) AS verified
          FROM reviews r
          JOIN customers c ON c.customer_id = r.customer_id
          WHERE r.product_id = ?
          ORDER BY r.review_date DESC, r.review_id DESC`
  },

  relatedProducts: {
    lesson: "บท 17 · Subquery ใน WHERE",
    sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name
          FROM products p JOIN categories c ON c.category_id = p.category_id
          WHERE p.category_id = (SELECT category_id FROM products WHERE product_id = ?)
            AND p.product_id <> ?
          ORDER BY p.rating IS NULL, p.rating DESC
          LIMIT 4`
  },

  boughtTogether: {
    lesson: "บท 26 · SELF JOIN (order_items กับตัวเอง)",
    sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name,
                 COUNT(DISTINCT a.order_id) AS times_together
          FROM order_items a
          JOIN order_items b ON b.order_id = a.order_id AND b.product_id <> a.product_id
          JOIN products p    ON p.product_id = b.product_id
          JOIN categories c  ON c.category_id = p.category_id
          WHERE a.product_id = ?
          GROUP BY p.product_id
          ORDER BY times_together DESC, p.rating DESC
          LIMIT 4`
  },

  // ==========================================================
  // บัญชีลูกค้า (Account)
  // ==========================================================
  customerList: {
    lesson: "บท 1 · SELECT + บท 5 · ORDER BY",
    sql: `SELECT customer_id, name, email, city, member_tier FROM customers ORDER BY name COLLATE NOCASE`
  },

  customerByEmail: {
    lesson: "บท 2 · WHERE + บท 21 · Parameter",
    sql: `SELECT * FROM customers WHERE email = ?`
  },

  customerById: {
    lesson: "บท 2 · WHERE",
    sql: `SELECT * FROM customers WHERE customer_id = ?`
  },

  registerUpsert: {
    lesson: "บท 27 · UPSERT (ON CONFLICT DO UPDATE) + บท 15 · date()",
    sql: `INSERT INTO customers (name, email, city, member_tier, registered_date)
          VALUES (?, ?, ?, 'Bronze', date('now', 'localtime'))
          ON CONFLICT(email) DO UPDATE SET name = excluded.name, city = excluded.city`
  },

  customerSummary: {
    lesson: "บท 18 · CTE + บท 19 · RANK() + บท 36 · COUNT(DISTINCT) กัน fan-out",
    sql: `WITH spend AS (
            SELECT c.customer_id,
                   COUNT(DISTINCT o.order_id) AS order_count,
                   COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity * oi.unit_price END), 0) AS total_spent,
                   MAX(o.order_date) AS last_order_date
            FROM customers c
            LEFT JOIN orders o       ON o.customer_id = c.customer_id
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            GROUP BY c.customer_id
          ),
          ranked AS (
            SELECT customer_id, order_count, total_spent, last_order_date,
                   RANK() OVER (ORDER BY total_spent DESC) AS spend_rank,
                   COUNT(*) OVER () AS customer_total
            FROM spend
          )
          SELECT r.*,
                 CAST(julianday('now') - julianday(r.last_order_date) AS INTEGER) AS days_since_last
          FROM ranked r
          WHERE r.customer_id = ?`
  },

  tierDiscount: {
    lesson: "บท 16 · CASE WHEN",
    sql: `SELECT member_tier,
                 CASE member_tier
                   WHEN 'Platinum' THEN 8
                   WHEN 'Gold'     THEN 5
                   WHEN 'Silver'   THEN 3
                   ELSE 0
                 END AS discount_pct
          FROM customers WHERE customer_id = ?`
  },

  tierRecalc: {
    lesson: "บท 18 · CTE ร่วมกับ UPDATE + บท 16 · CASE (อัปเกรดระดับสมาชิกอัตโนมัติ)",
    sql: `WITH spend AS (
            SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
            FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.customer_id = ? AND o.status <> 'cancelled'
          ),
          target AS (
            SELECT CASE WHEN total >= 40000 THEN 'Platinum'
                        WHEN total >= 20000 THEN 'Gold'
                        WHEN total >= 8000  THEN 'Silver'
                        ELSE 'Bronze' END AS tier,
                   CASE WHEN total >= 40000 THEN 4
                        WHEN total >= 20000 THEN 3
                        WHEN total >= 8000  THEN 2
                        ELSE 1 END AS lvl
            FROM spend
          )
          UPDATE customers
          SET member_tier = (SELECT tier FROM target)
          WHERE customer_id = ?
            AND CASE member_tier WHEN 'Platinum' THEN 4 WHEN 'Gold' THEN 3 WHEN 'Silver' THEN 2 ELSE 1 END
                < (SELECT lvl FROM target)`
  },

  customerOrders: {
    lesson: "บท 24 · VIEW (v_order_totals) + บท 5 · ORDER BY",
    sql: `SELECT * FROM v_order_totals WHERE customer_id = ? ORDER BY order_date DESC, order_id DESC`
  },

  orderById: {
    lesson: "บท 12 · JOIN กับ VIEW",
    sql: `SELECT v.*, c.name AS customer_name, c.email, c.city, c.member_tier
          FROM v_order_totals v JOIN customers c ON c.customer_id = v.customer_id
          WHERE v.order_id = ?`
  },

  orderItems: {
    lesson: "บท 12 · INNER JOIN + บท 1 · คำนวณคอลัมน์",
    sql: `SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.unit_price,
                 oi.quantity * oi.unit_price AS line_total,
                 p.name, p.price AS current_price, p.category_id
          FROM order_items oi JOIN products p ON p.product_id = oi.product_id
          WHERE oi.order_id = ?
          ORDER BY oi.order_item_id`
  },

  // ---------- Checkout (รันภายใน Transaction — บท 22) ----------
  checkoutStock: {
    lesson: "บท 22 · ตรวจสต็อกก่อนหักภายใน Transaction",
    sql: `SELECT product_id, name, stock, price FROM products WHERE product_id = ?`
  },
  checkoutOrderInsert: {
    lesson: "บท 7 · INSERT + บท 15 · date('now')",
    sql: `INSERT INTO orders (customer_id, order_date, status, payment_method)
          VALUES (?, date('now', 'localtime'), 'pending', ?)`
  },
  checkoutStockDeduct: {
    lesson: "บท 8 · UPDATE แบบมีเงื่อนไขป้องกันสต็อกติดลบ",
    sql: `UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?`
  },
  checkoutItemInsert: {
    lesson: "บท 7 · INSERT (บันทึกราคา ณ เวลาซื้อ)",
    sql: `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`
  },

  payOrder: {
    lesson: "บท 8 · UPDATE + บท 6 · IS NULL",
    sql: `UPDATE orders SET payment_method = ?
          WHERE order_id = ? AND customer_id = ? AND status = 'pending' AND payment_method IS NULL`
  },

  cancelOrder: {
    lesson: "บท 8 · UPDATE เฉพาะสถานะที่อนุญาต",
    sql: `UPDATE orders SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'`
  },
  restockOrder: {
    lesson: "บท 17 · Correlated Subquery ใน UPDATE (คืนสต็อก)",
    sql: `UPDATE products
          SET stock = stock + (SELECT oi.quantity FROM order_items oi
                               WHERE oi.order_id = ? AND oi.product_id = products.product_id)
          WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = ?)`
  },

  hasPurchased: {
    lesson: "บท 25 · EXISTS",
    sql: `SELECT EXISTS (
            SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.customer_id = ? AND oi.product_id = ? AND o.status IN ('shipped', 'completed')
          ) AS purchased`
  },

  reviewInsert: {
    lesson: "บท 7 · INSERT + บท 23 · CHECK(rating 1-5) + บท 15 · NULLIF(TRIM())",
    sql: `INSERT INTO reviews (product_id, customer_id, rating, comment, review_date)
          VALUES (?, ?, ?, NULLIF(TRIM(?), ''), date('now', 'localtime'))`
  },
  productRatingRefresh: {
    lesson: "บท 8 · UPDATE ด้วยค่าจาก Subquery (บท 17)",
    sql: `UPDATE products
          SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?)
          WHERE product_id = ?`
  },

  // ==========================================================
  // แดชบอร์ดผู้ดูแล (Admin)
  // ==========================================================
  kpis: {
    lesson: "บท 10 · Aggregate + บท 17 · Scalar Subqueries",
    sql: `SELECT
            (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
               FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
              WHERE o.status = 'completed')                                        AS revenue,
            (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
               FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
              WHERE o.status IN ('pending', 'shipped'))                            AS pipeline,
            (SELECT COUNT(*) FROM orders)                                          AS orders_total,
            (SELECT COUNT(*) FROM customers)                                       AS customers,
            (SELECT COUNT(*) FROM products)                                        AS products,
            (SELECT COUNT(*) FROM products WHERE stock <= 5)                       AS low_stock,
            (SELECT COUNT(*) FROM orders WHERE status = 'pending' AND payment_method IS NULL) AS unpaid,
            (SELECT ROUND(AVG(rating), 2) FROM reviews)                            AS avg_rating,
            (SELECT ROUND(AVG(t.total), 0) FROM v_order_totals t WHERE t.status = 'completed') AS avg_order_value`
  },

  statusPivot: {
    lesson: "บท 28 · SUM(CASE WHEN) Pivot",
    sql: `SELECT COUNT(*) AS total,
                 SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
                 SUM(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,
                 SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                 SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
          FROM orders`
  },

  monthlySales: {
    lesson: "บท 29 · Recursive CTE (ปฏิทินเดือน) + บท 46 · LAG (MoM%) + บท 47 · Running Total",
    sql: `WITH RECURSIVE months(m) AS (
            SELECT (SELECT strftime('%Y-%m-01', MIN(order_date)) FROM orders)
            UNION ALL
            SELECT date(m, '+1 month') FROM months
            WHERE m < (SELECT strftime('%Y-%m-01', MAX(order_date)) FROM orders)
            LIMIT 60
          ),
          sales AS (
            SELECT strftime('%Y-%m', o.order_date) AS ym,
                   COUNT(DISTINCT o.order_id)      AS orders,
                   SUM(oi.quantity * oi.unit_price) AS revenue
            FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.status = 'completed'
            GROUP BY ym
          ),
          filled AS (
            SELECT strftime('%Y-%m', months.m) AS month,
                   COALESCE(s.orders, 0)  AS orders,
                   COALESCE(s.revenue, 0) AS revenue
            FROM months LEFT JOIN sales s ON s.ym = strftime('%Y-%m', months.m)
          )
          SELECT month, orders, revenue,
                 LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
                 ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
                       / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS mom_pct,
                 SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative,
                 RANK() OVER (ORDER BY revenue DESC) AS revenue_rank
          FROM filled
          ORDER BY month`
  },

  monthlyByCategory: {
    lesson: "บท 28 · Pivot รายเดือน × หมวดหมู่ (SUM(CASE WHEN))",
    sql: `SELECT strftime('%Y-%m', o.order_date) AS month,
                 SUM(CASE WHEN p.category_id = 1 THEN oi.quantity * oi.unit_price ELSE 0 END) AS cat1,
                 SUM(CASE WHEN p.category_id = 2 THEN oi.quantity * oi.unit_price ELSE 0 END) AS cat2,
                 SUM(CASE WHEN p.category_id = 3 THEN oi.quantity * oi.unit_price ELSE 0 END) AS cat3,
                 SUM(CASE WHEN p.category_id = 4 THEN oi.quantity * oi.unit_price ELSE 0 END) AS cat4,
                 SUM(CASE WHEN p.category_id > 4 THEN oi.quantity * oi.unit_price ELSE 0 END) AS cat_other
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.order_id
          JOIN products p     ON p.product_id = oi.product_id
          WHERE o.status = 'completed'
          GROUP BY month
          ORDER BY month`
  },

  topProducts: {
    lesson: "บท 40 · Top-10 สินค้าขายดี (Multi-table JOIN + GROUP BY + LIMIT)",
    sql: `SELECT p.product_id, p.name, c.name AS category_name, p.category_id,
                 SUM(oi.quantity) AS qty,
                 ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
          FROM order_items oi
          JOIN orders o     ON o.order_id = oi.order_id
          JOIN products p   ON p.product_id = oi.product_id
          JOIN categories c ON c.category_id = p.category_id
          WHERE o.status = 'completed'
          GROUP BY p.product_id
          ORDER BY revenue DESC
          LIMIT 10`
  },

  categoryShare: {
    lesson: "บท 45 · สัดส่วนต่อหมวด (SUM() OVER () คิด % ของทั้งหมด)",
    sql: `SELECT c.category_id, c.name,
                 ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue,
                 SUM(oi.quantity) AS qty,
                 ROUND(100.0 * SUM(oi.quantity * oi.unit_price) / SUM(SUM(oi.quantity * oi.unit_price)) OVER (), 1) AS pct
          FROM categories c
          JOIN products p     ON p.category_id = c.category_id
          JOIN order_items oi ON oi.product_id = p.product_id
          JOIN orders o       ON o.order_id = oi.order_id
          WHERE o.status = 'completed'
          GROUP BY c.category_id
          ORDER BY revenue DESC`
  },

  paymentBreakdown: {
    lesson: "บท 6 · COALESCE กับ NULL + บท 11 · GROUP BY",
    sql: `SELECT COALESCE(payment_method, 'ยังไม่ชำระ') AS method,
                 COUNT(*) AS orders,
                 ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
          FROM orders
          WHERE status <> 'cancelled'
          GROUP BY payment_method
          ORDER BY orders DESC`
  },

  tierCategoryHeatmap: {
    lesson: "บท 26 · CROSS JOIN สร้างตารางครบทุกช่อง + บท 13 · LEFT JOIN",
    sql: `WITH tiers(member_tier, lvl) AS (VALUES ('Bronze', 1), ('Silver', 2), ('Gold', 3), ('Platinum', 4)),
          grid AS (
            SELECT t.member_tier, t.lvl, c.category_id, c.name AS category
            FROM tiers t CROSS JOIN categories c
          ),
          sales AS (
            SELECT cu.member_tier, p.category_id, SUM(oi.quantity * oi.unit_price) AS revenue
            FROM orders o
            JOIN customers cu   ON cu.customer_id = o.customer_id
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p     ON p.product_id = oi.product_id
            WHERE o.status = 'completed'
            GROUP BY cu.member_tier, p.category_id
          )
          SELECT g.member_tier, g.category, g.category_id, COALESCE(s.revenue, 0) AS revenue
          FROM grid g
          LEFT JOIN sales s ON s.member_tier = g.member_tier AND s.category_id = g.category_id
          ORDER BY g.lvl, g.category_id`
  },

  cityMvp: {
    lesson: "บท 48 · MVP ประจำเมือง (ROW_NUMBER() OVER (PARTITION BY city))",
    sql: `WITH spend AS (
            SELECT c.city, c.customer_id, c.name, c.member_tier,
                   SUM(oi.quantity * oi.unit_price) AS total
            FROM customers c
            JOIN orders o       ON o.customer_id = c.customer_id AND o.status = 'completed'
            JOIN order_items oi ON oi.order_id = o.order_id
            GROUP BY c.customer_id
          ),
          ranked AS (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY city ORDER BY total DESC) AS rn,
                   COUNT(*) OVER (PARTITION BY city) AS buyers_in_city,
                   SUM(total) OVER (PARTITION BY city) AS city_total
            FROM spend
          )
          SELECT city, customer_id, name, member_tier, ROUND(total, 2) AS total,
                 buyers_in_city, ROUND(city_total, 2) AS city_total
          FROM ranked WHERE rn = 1
          ORDER BY city_total DESC`
  },

  rfm: {
    lesson: "บท 31 · Capstone RFM (CTE + NTILE + CASE)",
    sql: `WITH base AS (
            SELECT c.customer_id, c.name, c.member_tier, c.city,
                   CAST(julianday('now') - julianday(MAX(o.order_date)) AS INTEGER) AS recency_days,
                   COUNT(DISTINCT o.order_id) AS frequency,
                   ROUND(SUM(oi.quantity * oi.unit_price), 2) AS monetary
            FROM customers c
            JOIN orders o       ON o.customer_id = c.customer_id AND o.status = 'completed'
            JOIN order_items oi ON oi.order_id = o.order_id
            GROUP BY c.customer_id
          ),
          scored AS (
            SELECT *,
                   NTILE(3) OVER (ORDER BY recency_days ASC) AS r,
                   NTILE(3) OVER (ORDER BY frequency DESC)   AS f,
                   NTILE(3) OVER (ORDER BY monetary DESC)    AS m
            FROM base
          )
          SELECT *,
                 CASE
                   WHEN r = 1 AND f = 1 AND m = 1 THEN 'Champion'
                   WHEN r = 1 AND f = 3           THEN 'New'
                   WHEN r <= 2 AND m <= 2         THEN 'Loyal'
                   WHEN r = 3 AND m = 1           THEN 'At Risk'
                   WHEN r = 3                     THEN 'Hibernating'
                   ELSE 'Regular'
                 END AS segment
          FROM scored
          ORDER BY monetary DESC`
  },

  atRiskCustomers: {
    lesson: "บท 49 · ลูกค้ากำลังหลุดมือ (HAVING + julianday)",
    sql: `SELECT c.customer_id, c.name, c.member_tier, c.city,
                 MAX(o.order_date) AS last_order_date,
                 CAST(julianday('now') - julianday(MAX(o.order_date)) AS INTEGER) AS days_since,
                 COUNT(DISTINCT o.order_id) AS orders,
                 ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_spent
          FROM customers c
          JOIN orders o       ON o.customer_id = c.customer_id AND o.status = 'completed'
          JOIN order_items oi ON oi.order_id = o.order_id
          GROUP BY c.customer_id
          HAVING julianday('now') - julianday(MAX(o.order_date)) > ?
          ORDER BY total_spent DESC
          LIMIT 8`
  },

  neverOrdered: {
    lesson: "บท 13 · LEFT JOIN ... IS NULL (Anti-join)",
    sql: `SELECT c.customer_id, c.name, c.email, c.city, c.member_tier, c.registered_date
          FROM customers c
          LEFT JOIN orders o ON o.customer_id = c.customer_id
          WHERE o.order_id IS NULL
          ORDER BY c.registered_date DESC`
  },

  lowStock: {
    lesson: "บท 2 · WHERE + บท 24 · VIEW",
    sql: `SELECT p.product_id, p.name, p.stock, p.price, c.name AS category_name, p.category_id,
                 s.sold_qty
          FROM products p
          JOIN categories c ON c.category_id = p.category_id
          LEFT JOIN v_product_stats s ON s.product_id = p.product_id
          WHERE p.stock <= ?
          ORDER BY p.stock ASC, s.sold_qty DESC`
  },

  activityFeed: {
    lesson: "บท 25 · UNION ALL + บท 15 · เชื่อมข้อความด้วย ||",
    sql: `SELECT 'order' AS kind, o.order_date AS at, c.name AS who,
                 'สั่งซื้อ #' || o.order_id || ' · ' || o.status AS detail, o.order_id AS ref
          FROM orders o JOIN customers c ON c.customer_id = o.customer_id
          UNION ALL
          SELECT 'review', r.review_date, c.name,
                 'รีวิว ' || p.name || ' ให้ ' || r.rating || ' ดาว', r.product_id
          FROM reviews r
          JOIN customers c ON c.customer_id = r.customer_id
          JOIN products p  ON p.product_id = r.product_id
          ORDER BY at DESC, ref DESC
          LIMIT 10`
  },

  // ---------- จัดการออเดอร์ ----------
  adminOrders(f) {
    const where = [];
    const params = [];
    if (f.status) { where.push("v.status = ?"); params.push(f.status); }
    if (f.q) { where.push("(c.name LIKE ? OR CAST(v.order_id AS TEXT) LIKE ?)"); params.push(`%${f.q}%`, `%${f.q}%`); }
    if (f.unpaid) where.push("v.payment_method IS NULL");
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return {
      lesson: "บท 24 · VIEW + บท 3 · AND/OR + บท 5 · LIMIT/OFFSET",
      sql: `SELECT v.*, c.name AS customer_name, c.member_tier, c.city
            FROM v_order_totals v JOIN customers c ON c.customer_id = v.customer_id
            ${whereSql}
            ORDER BY v.order_date DESC, v.order_id DESC
            LIMIT ? OFFSET ?`,
      params: [...params, f.limit, f.offset],
      countSql: `SELECT COUNT(*) AS total FROM v_order_totals v JOIN customers c ON c.customer_id = v.customer_id ${whereSql}`,
      countParams: params
    };
  },

  orderStatusUpdate: {
    lesson: "บท 8 · UPDATE ตามเงื่อนไข (state machine)",
    sql: `UPDATE orders SET status = ? WHERE order_id = ? AND status = ?`
  },

  // ---------- จัดการสินค้า ----------
  adminProducts(f) {
    const where = [];
    const params = [];
    if (f.category) { where.push("p.category_id = ?"); params.push(Number(f.category)); }
    if (f.q) { where.push("p.name LIKE ?"); params.push(`%${f.q}%`); }
    if (f.lowStock) where.push("p.stock <= 5");
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return {
      lesson: "บท 30 · RANK() OVER (PARTITION BY) + บท 24 · VIEW",
      sql: `SELECT p.product_id, p.name, p.price, p.stock, p.rating, p.category_id, c.name AS category_name,
                   s.sold_qty, s.revenue, s.review_count,
                   RANK() OVER (PARTITION BY p.category_id ORDER BY s.revenue DESC) AS cat_rank
            FROM products p
            JOIN categories c ON c.category_id = p.category_id
            LEFT JOIN v_product_stats s ON s.product_id = p.product_id
            ${whereSql}
            ORDER BY p.product_id DESC`,
      params
    };
  },

  productInsert: {
    lesson: "บท 7 · INSERT + บท 23 · FK ต้องชี้หมวดที่มีจริง",
    sql: `INSERT INTO products (name, category_id, price, stock, rating) VALUES (?, ?, ?, ?, NULL)`
  },
  productUpdate: {
    lesson: "บท 8 · UPDATE หลายคอลัมน์",
    sql: `UPDATE products SET name = ?, category_id = ?, price = ?, stock = ? WHERE product_id = ?`
  },
  productDelete: {
    lesson: "บท 9 · DELETE + บท 23 · FOREIGN KEY ป้องกันลบของที่ถูกอ้างอิง",
    sql: `DELETE FROM products WHERE product_id = ?`
  },
  productRefs: {
    lesson: "บท 10 · COUNT ก่อนลบ",
    sql: `SELECT (SELECT COUNT(*) FROM order_items WHERE product_id = ?) AS in_orders,
                 (SELECT COUNT(*) FROM reviews WHERE product_id = ?)     AS in_reviews`
  },
  stockAdjust: {
    lesson: "บท 8 · UPDATE แบบ relative (stock = stock + ?)",
    sql: `UPDATE products SET stock = MAX(0, stock + ?) WHERE product_id = ?`
  },
  categoryInsert: {
    lesson: "บท 7 · INSERT + บท 23 · UNIQUE",
    sql: `INSERT INTO categories (name, description) VALUES (?, ?)`
  },

  // ---------- จัดการลูกค้า ----------
  adminCustomers(f) {
    const where = [];
    const params = [];
    if (f.tier) { where.push("c.member_tier = ?"); params.push(f.tier); }
    if (f.q) { where.push("(c.name LIKE ? OR c.email LIKE ? OR c.city LIKE ?)"); params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`); }
    if (f.city) { where.push("c.city = ?"); params.push(f.city); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const having = f.vip
      ? "HAVING COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity * oi.unit_price END), 0) > (SELECT AVG(t) FROM (SELECT SUM(oi2.quantity * oi2.unit_price) AS t FROM orders o2 JOIN order_items oi2 ON oi2.order_id = o2.order_id WHERE o2.status = 'completed' GROUP BY o2.customer_id))"
      : "";
    return {
      lesson: f.vip ? "บท 42 · VIP ใช้จ่ายสูงกว่าค่าเฉลี่ย (HAVING + Subquery)" : "บท 13 · LEFT JOIN + บท 44 · นับออเดอร์ต่อคน",
      sql: `SELECT c.customer_id, c.name, c.email, c.city, c.member_tier, c.registered_date,
                   COUNT(DISTINCT o.order_id) AS order_count,
                   COALESCE(SUM(CASE WHEN o.status = 'completed' THEN oi.quantity * oi.unit_price END), 0) AS total_spent,
                   MAX(o.order_date) AS last_order_date
            FROM customers c
            LEFT JOIN orders o       ON o.customer_id = c.customer_id
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            ${whereSql}
            GROUP BY c.customer_id
            ${having}
            ORDER BY ${f.sort === "orders" ? "order_count DESC, total_spent DESC" : f.sort === "recent" ? "c.registered_date DESC" : "total_spent DESC"}`,
      params
    };
  },

  cities: {
    lesson: "บท 6 · DISTINCT",
    sql: `SELECT DISTINCT city FROM customers ORDER BY city`
  },

  customerTierUpdate: {
    lesson: "บท 8 · UPDATE",
    sql: `UPDATE customers SET member_tier = ? WHERE customer_id = ?`
  }
};

// ---------- ตะกร้า: ดึงสินค้าหลายชิ้นด้วย IN (...) — สร้าง placeholder ตามจำนวน id ----------
Q.cartProducts = (ids) => ({
  lesson: "บท 3 · IN (...) + บท 21 · Parameter ต่อ id",
  sql: `SELECT p.product_id, p.name, p.price, p.stock, p.category_id, p.rating, c.name AS category_name
        FROM products p JOIN categories c ON c.category_id = p.category_id
        WHERE p.product_id IN (${ids.map(() => "?").join(", ")})`,
  params: ids
});
