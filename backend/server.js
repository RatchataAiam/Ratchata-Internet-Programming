require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of requiredEnv) {
  if (!process.env[key]) console.warn(`Warning: ${key} is not configured in backend/.env`);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in backend/.env - using an insecure default for development only.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =====================================================
   PASSWORD HASHING (no extra dependency - uses node:crypto)
===================================================== */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const suppliedBuffer = crypto.scryptSync(password, salt, 64);
  if (hashBuffer.length !== suppliedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, suppliedBuffer);
}

/* =====================================================
   PASSWORD RESET (DEMO MODE)
   No real email is sent. The OTP is generated server-side,
   logged to the console, and returned in the API response so
   the frontend can display it directly on screen. This keeps
   the demo self-contained with no SMTP credentials required.
   Codes live in-memory only (fine for a demo - they reset if
   the server restarts) and expire after 10 minutes.
===================================================== */
const passwordResets = new Map(); // normalizedEmail -> { code, expiresAt }
const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* =====================================================
   USERS TABLE BOOTSTRAP (creates table + seeds demo accounts)
===================================================== */
async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(150) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM Users');
  if (rows[0].count === 0) {
    await pool.query(
      'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
      [
        'admin', 'admin@example.com', hashPassword('admin123'), 'admin',
        'user', 'user@example.com', hashPassword('user123'), 'user',
      ],
    );
    console.log('Seeded demo accounts -> admin/admin123 (role: admin), user/user123 (role: user). Please change these passwords.');
  }
}
ensureUsersTable().catch((error) => console.error('Users table init error:', error.message));

/* =====================================================
   SIMPLE JWT AUTH MIDDLEWARE (available for routes that need it)
===================================================== */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

/* =====================================================
   AI / ML: 1-D K-MEANS PRICE CLUSTERING (High / Medium / Low)
   A lightweight unsupervised clustering model that groups products
   into three price tiers based on their price distribution, instead
   of relying on fixed price thresholds.
===================================================== */
function kmeans1D(values, k, maxIterations = 30) {
  if (!values.length) return { assignments: [], centroids: [] };

  const sorted = [...values].sort((a, b) => a - b);
  let centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.min(sorted.length - 1, Math.floor(((i + 0.5) / k) * sorted.length));
    return sorted[idx];
  });

  const assignments = new Array(values.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    for (let i = 0; i < values.length; i++) {
      let bestCluster = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < k; c++) {
        const distance = Math.abs(values[i] - centroids[c]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    const sums = new Array(k).fill(0);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < values.length; i++) {
      sums[assignments[i]] += values[i];
      counts[assignments[i]] += 1;
    }
    centroids = centroids.map((prev, c) => (counts[c] > 0 ? sums[c] / counts[c] : prev));

    if (!changed) break;
  }

  return { assignments, centroids };
}

const TIER_LABELS = ['Low', 'Medium', 'High'];

/**
 * Clusters products into High / Medium / Low price tiers.
 * Returns each product with an added `priceTier` field, plus the
 * cluster centroids (average price per tier) for transparency.
 */
function computePriceTiers(products) {
  const prices = products.map((p) => Number(p.price) || 0);
  if (!prices.length) {
    return { withTiers: [], centroids: {}, k: 0 };
  }

  const distinctPrices = new Set(prices).size;
  const k = Math.max(1, Math.min(3, distinctPrices));
  const { assignments, centroids } = kmeans1D(prices, k);

  const rankedClusterIndexes = centroids
    .map((centroid, clusterIndex) => ({ clusterIndex, centroid }))
    .sort((a, b) => a.centroid - b.centroid)
    .map((entry) => entry.clusterIndex);

  const clusterToLabel = {};
  rankedClusterIndexes.forEach((clusterIndex, rank) => {
    const labelIndex = k === 1 ? 1 : Math.round((rank / (k - 1)) * (TIER_LABELS.length - 1));
    clusterToLabel[clusterIndex] = TIER_LABELS[labelIndex];
  });

  const withTiers = products.map((product, i) => ({
    ...product,
    priceTier: clusterToLabel[assignments[i]] || 'Medium',
  }));

  const centroidsByLabel = {};
  rankedClusterIndexes.forEach((clusterIndex) => {
    centroidsByLabel[clusterToLabel[clusterIndex]] = Number(centroids[clusterIndex].toFixed(2));
  });

  return { withTiers, centroids: centroidsByLabel, k };
}

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'disconnected', message: error.message });
  }
});

/* =====================================================
   AUTH: REGISTER / LOGIN
===================================================== */

// =========================
// REGISTER USER
// =========================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        message: 'Username and a password of at least 6 characters are required'
      });
    }

    const [existing] = await pool.query(
      'SELECT user_id FROM Users WHERE username = ?',
      [username.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Users
       (username, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [
        username.trim(),
        email?.trim() || null,
        hashPassword(password),
        'user'
      ]
    );

    res.status(201).json({
      message: 'Registered successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      message: error.message
    });
  }
});


// =========================
// LOGIN
// =========================
async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;

    // ตรวจข้อมูล
    if (!username?.trim() || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    const loginName = username.trim();


    // =================================================
    // 1. ตรวจสอบ ADMIN
    // =================================================
    const [admins] = await pool.query(
      `SELECT id, name, password
       FROM Admin
       WHERE name = ?`,
      [loginName]
    );

    if (admins.length > 0) {
      const admin = admins[0];

      // ตรวจ password ของ Admin
      if (password !== admin.password) {
        return res.status(401).json({
          message: 'Invalid username or password'
        });
      }

      // สร้าง JWT สำหรับ Admin
      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.name,
          role: 'admin'
        },
        JWT_SECRET,
        {
          expiresIn: '12h'
        }
      );

      return res.json({
        message: 'Admin login successful',

        token,

        user: {
          id: admin.id,
          username: admin.name,
          role: 'admin'
        }
      });
    }


    // =================================================
    // 2. ถ้าไม่ใช่ ADMIN → ตรวจสอบ USER
    // =================================================
    const [users] = await pool.query(
      `SELECT user_id, username, email, password_hash, role
       FROM Users
       WHERE username = ?`,
      [loginName]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // ตรวจ password ของ User
    const validPassword = verifyPassword(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }


    // =================================================
    // 3. สร้าง JWT สำหรับ USER
    // =================================================
    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        role: user.role || 'user'
      },
      JWT_SECRET,
      {
        expiresIn: '12h'
      }
    );


    return res.json({
      message: 'Login successful',

      token,

      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      message: error.message
    });
  }
}


// =================================================
// LOGIN ROUTE
// สำคัญมาก ต้องมีบรรทัดนี้
// =================================================
app.post('/api/auth/login', loginHandler);

/* =====================================================
   PASSWORD RESET (DEMO MODE) - see comment near passwordResets above
===================================================== */

// =========================
// STEP 1: REQUEST OTP
// =========================
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      'SELECT user_id FROM Users WHERE LOWER(email) = ?',
      [normalizedEmail]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้' });
    }

    const code = generateOtp();
    passwordResets.set(normalizedEmail, { code, expiresAt: Date.now() + OTP_TTL_MS });

    // DEMO MODE: no real email is sent - log it and echo it back to the client.
    console.log(`[DEMO OTP] ${normalizedEmail} -> ${code} (expires in 10 min)`);

    res.json({
      message: 'สร้างรหัส OTP สำเร็จ (โหมดเดโม่ - ไม่มีการส่งอีเมลจริง)',
      demoOtp: code,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =========================
// STEP 2: VERIFY OTP + SET NEW PASSWORD
// =========================
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัส OTP' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const entry = passwordResets.get(normalizedEmail);
    if (!entry || entry.code !== code.trim()) {
      return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' });
    }
    if (Date.now() > entry.expiresAt) {
      passwordResets.delete(normalizedEmail);
      return res.status(400).json({ message: 'รหัส OTP หมดอายุ กรุณาขอรหัสใหม่' });
    }

    const [result] = await pool.query(
      'UPDATE Users SET password_hash = ? WHERE LOWER(email) = ?',
      [hashPassword(newPassword), normalizedEmail]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    }

    passwordResets.delete(normalizedEmail);
    res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   ORDERS / CHECKOUT / PAYMENT
   Matches the uploaded SQL schema:
   Customers, Orders and Order_Items.
===================================================== */
app.post('/api/orders', authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { first_name, last_name, phone, email, address, items } = req.body;
    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim() || !address?.trim()) {
      return res.status(400).json({ message: 'first_name, last_name, phone and address are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    await connection.beginTransaction();
    const [customerResult] = await connection.query(
      'INSERT INTO Customers (first_name, last_name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [first_name.trim(), last_name.trim(), phone.trim(), email?.trim() || null, address.trim()]
    );
    const customerId = customerResult.insertId;

    let total = 0;
    const normalized = [];
    for (const item of items) {
      const itemType = item.item_type === 'Cat' ? 'Cat' : 'Product';

      if (itemType === 'Cat') {
        const catId = Number(item.cat_id);
        if (!Number.isInteger(catId)) throw new Error('Invalid order item');

        const [rows] = await connection.query(
          'SELECT cat_id, name, price, is_available FROM Cats WHERE cat_id = ? FOR UPDATE',
          [catId]
        );
        if (!rows.length) throw new Error(`Cat ${catId} not found`);
        const cat = rows[0];
        if (!cat.is_available) throw new Error(`${cat.name} has already been sold`);

        const unitPrice = Number(cat.price);
        total += unitPrice;
        normalized.push({ item_type: 'Cat', cat_id: catId, product_id: null, quantity: 1, unit_price: unitPrice });
      } else {
        const productId = Number(item.product_id);
        const quantity = Math.max(1, Number(item.quantity || 1));
        if (!Number.isInteger(productId) || !Number.isInteger(quantity)) throw new Error('Invalid order item');

        const [rows] = await connection.query(
          'SELECT product_id, product_name, price, stock_quantity FROM Products WHERE product_id = ? FOR UPDATE',
          [productId]
        );
        if (!rows.length) throw new Error(`Product ${productId} not found`);
        const product = rows[0];
        if (Number(product.stock_quantity) < quantity) {
          throw new Error(`${product.product_name} has insufficient stock`);
        }
        const unitPrice = Number(product.price);
        total += unitPrice * quantity;
        normalized.push({ item_type: 'Product', cat_id: null, product_id: productId, quantity, unit_price: unitPrice });
      }
    }

    const [orderResult] = await connection.query(
      "INSERT INTO Orders (customer_id, total_amount, payment_status) VALUES (?, ?, 'Pending')",
      [customerId, total.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    for (const item of normalized) {
      await connection.query(
        'INSERT INTO Order_Items (order_id, item_type, cat_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.item_type, item.cat_id, item.product_id, item.quantity, item.unit_price.toFixed(2)]
      );
      if (item.item_type === 'Cat') {
        await connection.query('UPDATE Cats SET is_available = 0 WHERE cat_id = ?', [item.cat_id]);
      } else {
        await connection.query(
          'UPDATE Products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ order_id: orderId, customer_id: customerId, total_amount: Number(total.toFixed(2)), payment_status: 'Pending' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.order_id, o.customer_id, o.order_date, o.total_amount, o.payment_status,
             c.first_name, c.last_name, c.phone, c.email, c.address
      FROM Orders o JOIN Customers c ON c.customer_id = o.customer_id
      WHERE o.order_id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const [items] = await pool.query(`
      SELECT oi.item_id, oi.item_type, oi.product_id, oi.cat_id, oi.quantity, oi.unit_price,
             COALESCE(p.product_name, c.name) AS product_name,
             COALESCE(p.image_url, c.image_url) AS image_url
      FROM Order_Items oi
      LEFT JOIN Products p ON p.product_id = oi.product_id
      LEFT JOIN Cats c ON c.cat_id = oi.cat_id
      WHERE oi.order_id = ? ORDER BY oi.item_id ASC
    `, [req.params.id]);
    res.json({ ...rows[0], items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders/:id/pay', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE Orders SET payment_status='Paid' WHERE order_id=? AND payment_status='Pending'",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found or already processed' });
    res.json({ order_id: Number(req.params.id), payment_status: 'Paid' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   BREEDS
===================================================== */

app.get('/api/breeds', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        breed_id,
        breed_name,
        description,
        image_url
      FROM Breeds
      ORDER BY breed_id ASC
    `);

    res.json(rows);

  } catch (error) {
    console.error('BREEDS ERROR:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.get('/api/breeds/:id/cats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.cat_id, c.breed_id, c.name, c.gender, c.birth_date, c.price,
             c.is_available, c.description, c.image_url,
             b.breed_name
      FROM Cats c
      INNER JOIN Breeds b ON b.breed_id = c.breed_id
      WHERE c.breed_id = ?
      ORDER BY c.cat_id DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('BREED CATS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/breeds/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT breed_id, breed_name, description, image_url FROM Breeds WHERE breed_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Breed not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   BREEDS: CRUD (admin only for write operations, matching
   the same admin/user split used for Products)
===================================================== */
app.post('/api/breeds', authenticate, requireAdmin, async (req, res) => {
  try {
    const { breed_name, description, image_url } = req.body;
    if (!breed_name?.trim()) {
      return res.status(400).json({ message: 'breed_name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO Breeds (breed_name, description, image_url) VALUES (?, ?, ?)',
      [breed_name.trim(), description || null, image_url || null],
    );
    const [rows] = await pool.query('SELECT * FROM Breeds WHERE breed_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/breeds/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { breed_name, description, image_url } = req.body;
    if (!breed_name?.trim()) {
      return res.status(400).json({ message: 'breed_name is required' });
    }
    const [result] = await pool.query(
      'UPDATE Breeds SET breed_name=?, description=?, image_url=? WHERE breed_id=?',
      [breed_name.trim(), description || null, image_url || null, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Breed not found' });
    const [rows] = await pool.query('SELECT * FROM Breeds WHERE breed_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/breeds/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Breeds WHERE breed_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Breed not found' });
    res.json({ message: 'Breed deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   CATS: real cats for sale (linked to Breeds).
   Sold once - `is_available` flips to 0 when an order is placed
   for that cat (see /api/orders above), instead of a decrementing
   stock count like Products.
===================================================== */

app.get('/api/cats', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.cat_id, c.breed_id, c.name, c.gender, c.birth_date, c.price,
             c.is_available, c.description, c.image_url,
             b.breed_name
      FROM Cats c LEFT JOIN Breeds b ON b.breed_id = c.breed_id
      ORDER BY c.cat_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/cats/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.cat_id, c.breed_id, c.name, c.gender, c.birth_date, c.price,
             c.is_available, c.description, c.image_url,
             b.breed_name
      FROM Cats c LEFT JOIN Breeds b ON b.breed_id = c.breed_id
      WHERE c.cat_id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Cat not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/cats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { breed_id, name, gender, birth_date, price, description, image_url } = req.body;
    if (!breed_id || !name?.trim() || price === undefined || price === '') {
      return res.status(400).json({ message: 'breed_id, name and price are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO Cats (breed_id, name, gender, birth_date, price, is_available, description, image_url) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [Number(breed_id), name.trim(), gender || null, birth_date || null, Number(price), description || null, image_url || null],
    );
    const [rows] = await pool.query('SELECT * FROM Cats WHERE cat_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/cats/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { breed_id, name, gender, birth_date, price, is_available, description, image_url } = req.body;
    if (!breed_id || !name?.trim() || price === undefined || price === '') {
      return res.status(400).json({ message: 'breed_id, name and price are required' });
    }
    const [result] = await pool.query(
      'UPDATE Cats SET breed_id=?, name=?, gender=?, birth_date=?, price=?, is_available=?, description=?, image_url=? WHERE cat_id=?',
      [Number(breed_id), name.trim(), gender || null, birth_date || null, Number(price), is_available === false ? 0 : 1, description || null, image_url || null, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Cat not found' });
    const [rows] = await pool.query('SELECT * FROM Cats WHERE cat_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/cats/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Cats WHERE cat_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Cat not found' });
    res.json({ message: 'Cat deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   PRODUCTS: AI / ML PRICE CLUSTERING
   (Registered before "/api/products/:id" so "clusters" is not
   swallowed by the :id param route.)
===================================================== */
app.get('/api/products/clusters', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Products ORDER BY price DESC');
    const { withTiers, centroids, k } = computePriceTiers(rows);

    const tiers = { High: [], Medium: [], Low: [] };
    withTiers.forEach((product) => {
      (tiers[product.priceTier] || tiers.Medium).push(product);
    });

    res.json({
      tiers,
      counts: { High: tiers.High.length, Medium: tiers.Medium.length, Low: tiers.Low.length },
      centroids,
      clusterCount: k,
      totalProducts: withTiers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   PRODUCTS: CRUD
===================================================== */
app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Products ORDER BY product_id DESC');
    const { withTiers } = computePriceTiers(rows);
    res.json(withTiers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [allRows] = await pool.query('SELECT * FROM Products');
    const { withTiers } = computePriceTiers(allRows);
    const product = withTiers.find((p) => String(p.product_id) === String(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { product_name, category, description, price, stock_quantity, image_url } = req.body;
    if (!product_name?.trim() || !category?.trim() || price === undefined || price === '') {
      return res.status(400).json({ message: 'product_name, category and price are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO Products (product_name, category, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [product_name.trim(), category.trim(), description || null, Number(price), Number(stock_quantity || 0), image_url || null],
    );
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { product_name, category, description, price, stock_quantity, image_url } = req.body;
    if (!product_name?.trim() || !category?.trim() || price === undefined || price === '') {
      return res.status(400).json({ message: 'product_name, category and price are required' });
    }
    const [result] = await pool.query(
      'UPDATE Products SET product_name=?, category=?, description=?, price=?, stock_quantity=?, image_url=? WHERE product_id=?',
      [product_name.trim(), category.trim(), description || null, Number(price), Number(stock_quantity || 0), image_url || null, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Products WHERE product_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = Number(process.env.PORT || 3099);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
