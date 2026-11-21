/* HANDIMANS — data layer (SQLite via node:sqlite, zero dependencies) */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.HM_DB || join(here, '..', 'data', 'handimans.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA busy_timeout = 5000');

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('customer','pro','contractor','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pros (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 8000,
  price_min INTEGER NOT NULL DEFAULT 250,
  price_max INTEGER NOT NULL DEFAULT 600,
  callout INTEGER NOT NULL DEFAULT 150,
  years INTEGER NOT NULL DEFAULT 3,
  verified INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  jobs_count INTEGER NOT NULL DEFAULT 0,
  resp_min INTEGER NOT NULL DEFAULT 30,
  avail TEXT NOT NULL DEFAULT 'soon' CHECK (avail IN ('now','soon','later')),
  balance_nis INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','blocked')),
  bio TEXT
);

CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  trade TEXT NOT NULL,
  tagline TEXT,
  about TEXT,
  phone TEXT,
  area TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 12000,
  rating REAL NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 2,
  slot_min INTEGER NOT NULL DEFAULT 60,
  auto_confirm INTEGER NOT NULL DEFAULT 1,
  balance_nis INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_nis INTEGER NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  trade TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'today' CHECK (urgency IN ('emergency','today','this_week','flexible')),
  description TEXT NOT NULL,
  budget_nis INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','scheduled','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  pro_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_nis INTEGER NOT NULL,
  eta_min INTEGER NOT NULL DEFAULT 60,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','rejected','withdrawn')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (request_id, pro_user_id)
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('pro','business')),
  owner_id INTEGER NOT NULL,
  delta_nis INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('topup','lead_charge','refund','adjustment')),
  note TEXT,
  ref TEXT,
  balance_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES team_members(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  day TEXT NOT NULL,
  start TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  price_nis INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','done','no_show','cancelled')),
  source TEXT NOT NULL DEFAULT 'page' CHECK (source IN ('page','lead','phone')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('pro','business')),
  subject_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, trade);
CREATE INDEX IF NOT EXISTS idx_offers_request ON offers(request_id);
CREATE INDEX IF NOT EXISTS idx_appt_day ON appointments(business_id, day, start);
CREATE INDEX IF NOT EXISTS idx_ledger_owner ON ledger(owner_type, owner_id);
`;

db.exec(SCHEMA);

export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw err;
  }
}

export function get(sql, ...params) {
  return db.prepare(sql).get(...params);
}

export function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

export function run(sql, ...params) {
  return db.prepare(sql).run(...params);
}

export function setting(key, fallback) {
  const row = get('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  run('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, String(value));
}

export function haversine(a, b) {
  const R = 6371000, toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function isSeeded() {
  return get('SELECT COUNT(*) AS n FROM users').n > 0;
}
