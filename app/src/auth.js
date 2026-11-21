/* HANDIMANS — passwords + sessions (scrypt, httpOnly cookie) */
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { get, run } from './db.js';

const SESSION_DAYS = 30;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  run('INSERT INTO sessions(token, user_id, expires_at) VALUES(?, ?, ?)', token, userId, expires);
  return { token, expires };
}

export function destroySession(token) {
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
}

export function userFromToken(token) {
  if (!token) return null;
  const row = get(
    `SELECT u.id, u.role, u.name, u.email, u.phone, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
    token
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, role: row.role, name: row.name, email: row.email, phone: row.phone };
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token, maxAgeSeconds) {
  const base = `hm_session=${token}; Path=/; HttpOnly; SameSite=Lax`;
  return maxAgeSeconds ? `${base}; Max-Age=${maxAgeSeconds}` : `${base}; Max-Age=0`;
}
