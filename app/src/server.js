/* HANDIMANS — HTTP server: static SPA + JSON API, zero dependencies */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi, HttpError } from './api.js';
import { parseCookies, userFromToken } from './auth.js';
import { seed } from './seed.js';

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(here, '..', 'public');
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function send(res, status, body, headers = {}) {
  const payload = body === null || body === undefined ? '' : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    ...headers
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new HttpError(413, 'גוף הבקשה גדול מדי');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw); } catch { throw new HttpError(400, 'JSON לא תקין'); }
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const target = resolve(join(PUBLIC, normalize(rel)));
  if (!target.startsWith(PUBLIC)) return send(res, 403, { error: 'forbidden' });

  let file = target;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
  } catch {
    if (extname(rel)) return send(res, 404, { error: 'not found' });
    file = join(PUBLIC, 'index.html');
  }
  try {
    const data = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
    const cache = extname(file) === '.html' ? 'no-cache' : 'public, max-age=300';
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    send(res, 404, { error: 'not found' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (path.startsWith('/api/')) {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.hm_session || null;
      const user = userFromToken(token);
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
      const out = await handleApi({
        req, res, method: req.method, path, query: Object.fromEntries(url.searchParams),
        body, user, token
      });
      if (!out) return send(res, 404, { error: 'נתיב API לא קיים' });
      const headers = {};
      if (out.cookies) headers['Set-Cookie'] = out.cookies;
      return send(res, out.status || 200, out.body, headers);
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, ...(err.extra || {}) });
      console.error('[api]', err);
      return send(res, 500, { error: 'שגיאת שרת' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
  return serveStatic(req, res, path);
});

const created = seed();
server.listen(PORT, HOST, () => {
  console.log(`HANDIMANS running on http://${HOST}:${PORT}`);
  console.log(created ? 'database seeded with demo data' : 'database already seeded');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
