// server.js — Tahmesk Digital Node.js + SQLite server
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const Database = require('better-sqlite3');
const { initDb, DB_PATH } = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Database ─────────────────────────────────────────────────────
const db = initDb();

// ── Admin auth ───────────────────────────────────────────────────
// Protects write/admin routes. Set ADMIN_KEY in your environment and
// send it as an "x-admin-key" header (or ?admin_key= query param).
function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured: ADMIN_KEY is not set'
    });
  }

  const providedKey = req.get('x-admin-key') || req.query.admin_key;
  if (providedKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  next();
}

// ════════════════════════════════════════════════════════════════
//  CONTENT ROUTES
// ════════════════════════════════════════════════════════════════

// GET /api/content  — returns all site_content as a flat object
app.get('/api/content', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_content').all();
    const content = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/content/:key  — update a single content value
app.put('/api/content/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (!value) return res.status(400).json({ success: false, error: 'value is required' });

  try {
    db.prepare(`
      INSERT INTO site_content (key, value, updated_at)
      VALUES (@key, @value, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run({ key, value });
    res.json({ success: true, message: `Content "${key}" updated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
//  SERVICES ROUTES
// ════════════════════════════════════════════════════════════════

// GET /api/services  — returns all services ordered by sort_order
app.get('/api/services', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services  — add a new service
app.post('/api/services', requireAdmin, (req, res) => {
  const { icon, title, description, sort_order = 99 } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'title and description are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO services (icon, title, description, sort_order)
      VALUES (@icon, @title, @description, @sort_order)
    `).run({ icon: icon || 'fa-star', title, description, sort_order });
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/services/:id  — update a service
app.put('/api/services/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { icon, title, description, sort_order } = req.body;
  try {
    db.prepare(`
      UPDATE services SET
        icon        = COALESCE(@icon, icon),
        title       = COALESCE(@title, title),
        description = COALESCE(@description, description),
        sort_order  = COALESCE(@sort_order, sort_order)
      WHERE id = @id
    `).run({ icon, title, description, sort_order, id });
    res.json({ success: true, message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/services/:id  — delete a service
app.delete('/api/services/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
//  CONTACT ROUTES
// ════════════════════════════════════════════════════════════════

// POST /api/contact  — save a contact form submission
app.post('/api/contact', (req, res) => {
  const { first_name, email, message } = req.body;

  if (!first_name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'first_name, email and message are all required'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO contacts (first_name, email, message)
      VALUES (@first_name, @email, @message)
    `).run({ first_name, email, message });

    res.status(201).json({
      success: true,
      message: 'Thank you! We will be in touch shortly.',
      id: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contacts  — list all contact submissions (admin use)
app.get('/api/contacts', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    ).all();
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/contacts/:id  — delete a contact submission
app.delete('/api/contacts/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Catch-all: serve the frontend ───────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Tahmesk Digital running at http://localhost:${PORT}`);
  console.log(`📦  API endpoints:`);
  console.log(`    GET    /api/content`);
  console.log(`    PUT    /api/content/:key`);
  console.log(`    GET    /api/services`);
  console.log(`    POST   /api/services`);
  console.log(`    PUT    /api/services/:id`);
  console.log(`    DELETE /api/services/:id`);
  console.log(`    POST   /api/contact`);
  console.log(`    GET    /api/contacts`);
  console.log(`    DELETE /api/contacts/:id\n`);
});
