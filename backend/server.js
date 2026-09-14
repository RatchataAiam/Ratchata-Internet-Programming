require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Products ORDER BY product_id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { product_name, category, description, price, stock_quantity, image_url } = req.body;
    if (!product_name || !category || price === undefined) return res.status(400).json({ message: 'product_name, category and price are required' });
    const [result] = await pool.query(
      'INSERT INTO Products (product_name, category, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [product_name, category, description || null, Number(price), Number(stock_quantity || 0), image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { product_name, category, description, price, stock_quantity, image_url } = req.body;
    const [result] = await pool.query(
      'UPDATE Products SET product_name=?, category=?, description=?, price=?, stock_quantity=?, image_url=? WHERE product_id=?',
      [product_name, category, description || null, Number(price), Number(stock_quantity || 0), image_url || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Products WHERE product_id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = Number(process.env.PORT || 3099);
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
