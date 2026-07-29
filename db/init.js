// db/init.js — Creates and seeds the SQLite database
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tahmesk.db');

function initDb() {
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── contacts table ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name  TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      message     TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── services table ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      icon        TEXT    NOT NULL,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL,
      sort_order  INTEGER DEFAULT 0
    );
  `);

  // ── site_content table (key-value for editable text) ────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Seed services if empty ───────────────────────────────────────
  const count = db.prepare('SELECT COUNT(*) as n FROM services').get();
  if (count.n === 0) {
    const insert = db.prepare(`
      INSERT INTO services (icon, title, description, sort_order)
      VALUES (@icon, @title, @description, @sort_order)
    `);

    const seedServices = db.transaction((rows) => {
      rows.forEach(r => insert.run(r));
    });

    seedServices([
      {
        icon: 'fa-globe',
        title: 'Website Promotion',
        description: 'We build professional websites tailored to your needs — fast, modern, and fully optimised. Every project includes SEO to help you rank higher and reach more customers.',
        sort_order: 1
      },
      {
        icon: 'fa-bullhorn',
        title: 'Product Advertising',
        description: 'We create compelling ad campaigns across platforms that put your products in front of buyers who are ready to convert — from social to search.',
        sort_order: 2
      },
      {
        icon: 'fa-search',
        title: 'SEO & Performance',
        description: 'We optimise your existing website or mobile application for SEO and performance, so you rank higher and load faster than the competition.',
        sort_order: 3
      },
      {
        icon: 'fa-comments',
        title: 'Consulting',
        description: 'We offer expert consultation on your idea and suggest the best approach to bring it to life with a digital-first mindset.',
        sort_order: 4
      },
      {
        icon: 'fa-line-chart',
        title: 'Digital Marketing',
        description: 'We ensure your brand is well-known and well-loved — building a user base, driving traffic, and expanding your digital presence.',
        sort_order: 5
      },
      {
        icon: 'fa-calendar',
        title: 'Event Hosting',
        description: 'We handle the full event hosting and management process. You just show up — we take care of everything else.',
        sort_order: 6
      }
    ]);
    console.log('✅  Services seeded');
  }

  // ── Seed site content if empty ───────────────────────────────────
  const contentCount = db.prepare('SELECT COUNT(*) as n FROM site_content').get();
  if (contentCount.n === 0) {
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO site_content (key, value) VALUES (@key, @value)
    `);
    const seedContent = db.transaction((rows) => {
      rows.forEach(r => upsert.run(r));
    });

    seedContent([
      { key: 'hero_title',      value: 'Where your brand finds its voice' },
      { key: 'hero_subtitle',   value: 'Welcome to Tahmesk Digital — where we craft bold digital strategies that connect your business with the right audience, in the right place, at the right time.' },
      { key: 'about_text',      value: 'We are a team of passionate individuals dedicated to providing the best digital solutions for our clients. We believe in the power of technology to transform businesses and help them reach their full potential.' },
      { key: 'about_text2',     value: 'Our team covers web development, SEO optimisation, digital marketing, and event hosting. We work closely with you to understand your needs and goals, delivering exceptional results.' },
      { key: 'vision_text',     value: 'Our vision is to be the leading provider of digital solutions for businesses of all sizes. We aim to empower our clients with the tools and strategies they need to succeed in the digital age.' },
      { key: 'vision_text2',    value: 'We are committed to staying at the forefront of technology and innovation, and we strive to create a positive impact on our clients, our community, and the world.' },
      { key: 'stat_clients',    value: '479' },
      { key: 'stat_employees',  value: '15' },
      { key: 'stat_years',      value: '20' },
      { key: 'stat_awards',     value: '35' },
      { key: 'contact_address', value: 'Kenya' },
      { key: 'contact_email',   value: 'info@tahmeskdigital.com' },
      { key: 'contact_phone',   value: '+254 793 917 700' }
    ]);
    console.log('✅  Site content seeded');
  }

  console.log('✅  Database ready at', DB_PATH);
  return db;
}

module.exports = { initDb, DB_PATH };
