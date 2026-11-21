/* HANDIMANS — HTTP API (real persistence, real money ledger, real booking conflicts) */
import { all, get, run, tx, haversine, setting, setSetting } from './db.js';
import { hashPassword, verifyPassword, createSession, destroySession, sessionCookie } from './auth.js';
import { TRADES } from './seed.js';

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const bad = (msg, status = 400, extra) => { throw new HttpError(status, msg, extra); };

const TRADE_IDS = new Set(TRADES.map(t => t.id));
const money = n => Math.round(Number(n) || 0);

function publicUser(u) {
  return u ? { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone } : null;
}

function proRow(userId) {
  return get(`SELECT p.*, u.name, u.email, u.phone FROM pros p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?`, userId);
}

function businessOf(userId) {
  return get('SELECT * FROM businesses WHERE owner_user_id = ?', userId);
}

function requireUser(ctx) {
  if (!ctx.user) bad('צריך להתחבר', 401);
  return ctx.user;
}

function requireRole(ctx, ...roles) {
  const u = requireUser(ctx);
  if (!roles.includes(u.role)) bad('אין הרשאה לפעולה הזו', 403);
  return u;
}

function chargeLead(ownerType, ownerId, amount, note, ref) {
  return tx(() => {
    const table = ownerType === 'pro' ? 'pros' : 'businesses';
    const key = ownerType === 'pro' ? 'user_id' : 'id';
    const row = get(`SELECT balance_nis FROM ${table} WHERE ${key} = ?`, ownerId);
    if (!row) bad('לא נמצא חשבון', 404);
    if (row.balance_nis < amount) {
      bad('אין יתרה מספקת לפנייה', 402, { balance: row.balance_nis, required: amount });
    }
    const next = row.balance_nis - amount;
    run(`UPDATE ${table} SET balance_nis = ? WHERE ${key} = ?`, next, ownerId);
    run(`INSERT INTO ledger(owner_type, owner_id, delta_nis, reason, note, ref, balance_after)
         VALUES(?,?,?,?,?,?,?)`, ownerType, ownerId, -amount, 'lead_charge', note, ref || null, next);
    return next;
  });
}

function topUp(ownerType, ownerId, amount, note) {
  return tx(() => {
    const table = ownerType === 'pro' ? 'pros' : 'businesses';
    const key = ownerType === 'pro' ? 'user_id' : 'id';
    const row = get(`SELECT balance_nis FROM ${table} WHERE ${key} = ?`, ownerId);
    if (!row) bad('לא נמצא חשבון', 404);
    const next = row.balance_nis + amount;
    run(`UPDATE ${table} SET balance_nis = ? WHERE ${key} = ?`, next, ownerId);
    run(`INSERT INTO ledger(owner_type, owner_id, delta_nis, reason, note, balance_after)
         VALUES(?,?,?,?,?,?)`, ownerType, ownerId, amount, 'topup', note || 'טעינת יתרה', next);
    return next;
  });
}

function scoreOf(p, dist, radiusM) {
  const proximity = 1 - Math.min(dist / Math.max(radiusM, 1), 1);
  const rating = Math.max(p.rating - 3, 0) / 2;
  const avail = p.avail === 'now' ? 1 : p.avail === 'soon' ? 0.65 : 0.3;
  const reliability = Math.min(p.jobs_count / 800, 1);
  const resp = 1 - Math.min(p.resp_min / 120, 1);
  return 0.35 * proximity + 0.25 * rating + 0.15 * avail + 0.15 * reliability + 0.1 * resp;
}

function shapePro(p, dist) {
  return {
    id: p.user_id, name: p.name, trade: p.trade, area: p.area, lat: p.lat, lng: p.lng,
    radiusM: p.radius_m, priceMin: p.price_min, priceMax: p.price_max, callout: p.callout,
    years: p.years, verified: !!p.verified, rating: p.rating, reviews: p.reviews_count,
    jobs: p.jobs_count, respMin: p.resp_min, avail: p.avail, balance: p.balance_nis,
    status: p.status, bio: p.bio, dist: Math.round(dist), score: Math.round(60 + scoreOf(p, dist, p.radius_m) * 40)
  };
}

function shapeAppt(a) {
  return {
    id: a.id, day: a.day, start: a.start, durationMin: a.duration_min, price: a.price_nis,
    status: a.status, source: a.source, customer: a.customer_name, phone: a.phone, address: a.address,
    teamId: a.team_id, teamName: a.team_name, serviceId: a.service_id, serviceName: a.service_name,
    customerId: a.customer_id
  };
}

const APPT_SELECT = `SELECT a.*, t.name AS team_name, s.name AS service_name
  FROM appointments a JOIN team_members t ON t.id = a.team_id JOIN services s ON s.id = a.service_id`;

/* ------------------------------- routes ------------------------------- */
export const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, rx, keys, handler });
};

route('GET', '/api/health', () => ({ ok: true, at: new Date().toISOString() }));

route('GET', '/api/trades', () => ({ trades: TRADES, leadPrice: Number(setting('lead_price_nis', 100)) }));

route('POST', '/api/auth/register', ctx => {
  const { role, name, email, phone, password, trade, area, lat, lng, businessName, slug } = ctx.body || {};
  if (!['customer', 'pro', 'contractor'].includes(role)) bad('תפקיד לא חוקי');
  if (!name || !email || !password) bad('שם, אימייל וסיסמה הם שדות חובה');
  if (String(password).length < 6) bad('סיסמה חייבת להיות באורך 6 תווים לפחות');
  if (get('SELECT id FROM users WHERE email = ?', String(email).toLowerCase())) bad('האימייל כבר רשום', 409);

  const userId = tx(() => {
    const id = run('INSERT INTO users(role, name, email, phone, password_hash) VALUES(?,?,?,?,?)',
      role, name, String(email).toLowerCase(), phone || null, hashPassword(password)).lastInsertRowid;
    if (role === 'pro') {
      const t = TRADE_IDS.has(trade) ? trade : 'handyman';
      run(`INSERT INTO pros(user_id, trade, area, lat, lng, radius_m, price_min, price_max, callout, years,
            verified, rating, reviews_count, jobs_count, resp_min, avail, balance_nis, status)
           VALUES(?,?,?,?,?,?,?,?,?,?,0,0,0,0,30,'soon',0,'active')`,
        id, t, area || 'תל אביב', Number(lat) || 32.0853, Number(lng) || 34.7818, 8000, 250, 600, 150, 1);
    }
    if (role === 'contractor') {
      const base = (slug || businessName || name).toString().trim().toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05FF]+/g, '-').replace(/^-|-$/g, '') || 'business';
      let s = base, i = 1;
      while (get('SELECT id FROM businesses WHERE slug = ?', s)) s = `${base}-${++i}`;
      const bizId = run(`INSERT INTO businesses(owner_user_id, name, slug, trade, tagline, phone, area, lat, lng,
          radius_m, rating, reviews_count, capacity, slot_min, auto_confirm, balance_nis, verified)
          VALUES(?,?,?,?,?,?,?,?,?,?,0,0,2,60,1,0,0)`,
        id, businessName || name, s, TRADE_IDS.has(trade) ? trade : 'handyman', 'עסק חדש ב-HANDIMANS',
        phone || null, area || 'תל אביב', Number(lat) || 32.0853, Number(lng) || 34.7818, 12000).lastInsertRowid;
      run('INSERT INTO team_members(business_id, name, trade, phone, active, capacity) VALUES(?,?,?,?,1,5)',
        bizId, name, TRADE_IDS.has(trade) ? trade : 'handyman', phone || null);
    }
    return id;
  });

  const user = get('SELECT id, role, name, email, phone FROM users WHERE id = ?', userId);
  const s = createSession(userId);
  return { status: 201, body: { user: publicUser(user) }, cookies: [sessionCookie(s.token, 30 * 86400)] };
});

route('POST', '/api/auth/login', ctx => {
  const { email, password } = ctx.body || {};
  const row = get('SELECT * FROM users WHERE email = ?', String(email || '').toLowerCase());
  if (!row || !verifyPassword(String(password || ''), row.password_hash)) bad('אימייל או סיסמה שגויים', 401);
  const s = createSession(row.id);
  return { body: { user: publicUser(row) }, cookies: [sessionCookie(s.token, 30 * 86400)] };
});

route('POST', '/api/auth/logout', ctx => {
  destroySession(ctx.token);
  return { body: { ok: true }, cookies: [sessionCookie('', 0)] };
});

route('GET', '/api/me', ctx => {
  const u = publicUser(ctx.user);
  if (!u) return { body: { user: null } };
  const out = { user: u };
  if (u.role === 'pro') out.pro = shapePro(proRow(u.id), 0);
  if (u.role === 'contractor') out.business = businessOf(u.id);
  return { body: out };
});

route('GET', '/api/search', ctx => {
  const q = ctx.query;
  const lat = Number(q.lat) || 32.0853, lng = Number(q.lng) || 34.7818;
  const radiusM = Math.min(Math.max(Number(q.radiusKm) || 8, 1), 40) * 1000;
  const trade = q.trade && q.trade !== 'all' ? q.trade : null;
  const sort = q.sort || 'score';
  const rows = all(`SELECT p.*, u.name FROM pros p JOIN users u ON u.id = p.user_id WHERE p.status = 'active'`);
  let list = rows.map(p => {
    const dist = haversine({ lat, lng }, { lat: p.lat, lng: p.lng });
    return { p, dist };
  }).filter(x => x.dist <= Math.min(radiusM, x.p.radius_m) && (!trade || x.p.trade === trade))
    .map(x => shapePro(x.p, x.dist));
  const sorters = {
    score: (a, b) => b.score - a.score,
    distance: (a, b) => a.dist - b.dist,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    price: (a, b) => a.priceMin - b.priceMin
  };
  list.sort(sorters[sort] || sorters.score);
  const biz = all('SELECT * FROM businesses WHERE verified = 1');
  const businesses = biz.map(b => {
    const dist = haversine({ lat, lng }, { lat: b.lat, lng: b.lng });
    return { id: b.id, name: b.name, slug: b.slug, trade: b.trade, tagline: b.tagline, rating: b.rating,
      reviews: b.reviews_count, area: b.area, dist: Math.round(dist), verified: !!b.verified,
      team: get('SELECT COUNT(*) AS n FROM team_members WHERE business_id = ? AND active = 1', b.id).n };
  }).filter(b => b.dist <= radiusM && (!trade || b.trade === trade));
  return { body: { pros: list, businesses, radiusKm: radiusM / 1000, count: list.length } };
});

route('GET', '/api/requests', ctx => {
  const u = requireUser(ctx);
  if (u.role === 'customer') {
    const rows = all(`SELECT r.*, (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offers
      FROM requests r WHERE r.customer_id = ? ORDER BY r.created_at DESC`, u.id);
    return { body: { requests: rows.map(r => ({ ...r, offers: r.offers })) } };
  }
  if (u.role === 'pro') {
    const p = proRow(u.id);
    if (!p) bad('פרופיל בעל מקצוע חסר', 404);
    const rows = all(`SELECT r.*, u.name AS customer,
        (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offers,
        (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id AND o.pro_user_id = ?) AS mine
      FROM requests r JOIN users u ON u.id = r.customer_id
      WHERE r.status = 'open' AND r.trade = ? ORDER BY r.created_at DESC`, u.id, p.trade);
    const feed = rows.map(r => {
      const dist = haversine({ lat: p.lat, lng: p.lng }, { lat: r.lat, lng: r.lng });
      return { ...r, dist: Math.round(dist), offered: r.mine > 0, inRadius: dist <= p.radius_m };
    }).filter(r => r.inRadius);
    return { body: { requests: feed, balance: p.balance_nis, leadPrice: Number(setting('lead_price_nis', 100)) } };
  }
  const b = businessOf(u.id);
  if (!b) bad('עסק חסר', 404);
  const rows = all(`SELECT r.*, u.name AS customer,
      (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offers
    FROM requests r JOIN users u ON u.id = r.customer_id
    WHERE r.status = 'open' ORDER BY r.created_at DESC`);
  const feed = rows.map(r => {
    const dist = haversine({ lat: b.lat, lng: b.lng }, { lat: r.lat, lng: r.lng });
    return { ...r, dist: Math.round(dist), inRadius: dist <= b.radius_m };
  }).filter(r => r.inRadius);
  return { body: { requests: feed, balance: b.balance_nis, leadPrice: Number(setting('lead_price_nis', 100)) } };
});

route('POST', '/api/requests', ctx => {
  const u = requireRole(ctx, 'customer');
  const { trade, address, lat, lng, urgency, description, budget } = ctx.body || {};
  if (!TRADE_IDS.has(trade)) bad('קטגוריה לא חוקית');
  if (!address || !description) bad('כתובת ותיאור הם שדות חובה');
  const id = run(`INSERT INTO requests(customer_id, trade, address, lat, lng, urgency, description, budget_nis, status)
    VALUES(?,?,?,?,?,?,?,?, 'open')`,
    u.id, trade, address, Number(lat) || 32.0853, Number(lng) || 34.7818,
    ['emergency', 'today', 'this_week', 'flexible'].includes(urgency) ? urgency : 'today',
    description, budget ? money(budget) : null).lastInsertRowid;
  return { status: 201, body: { request: get('SELECT * FROM requests WHERE id = ?', id) } };
});

route('GET', '/api/requests/:id', ctx => {
  const u = requireUser(ctx);
  const r = get(`SELECT r.*, cu.name AS customer FROM requests r JOIN users cu ON cu.id = r.customer_id WHERE r.id = ?`, ctx.params.id);
  if (!r) bad('בקשה לא נמצאה', 404);
  const offers = all(`SELECT o.*, u.name AS pro_name, p.trade, p.rating, p.reviews_count, p.jobs_count, p.verified
    FROM offers o JOIN users u ON u.id = o.pro_user_id JOIN pros p ON p.user_id = o.pro_user_id
    WHERE o.request_id = ? ORDER BY o.price_nis ASC`, r.id);
  const mine = u.role === 'customer' && r.customer_id === u.id;
  return {
    body: {
      request: r,
      offers: offers.map(o => ({ ...o, verified: !!o.verified, mine: o.pro_user_id === u.id })),
      canAccept: mine,
      isOwner: mine
    }
  };
});

route('POST', '/api/requests/:id/offers', ctx => {
  const u = requireRole(ctx, 'pro');
  const p = proRow(u.id);
  if (!p) bad('פרופיל בעל מקצוע חסר', 404);
  const r = get('SELECT * FROM requests WHERE id = ?', ctx.params.id);
  if (!r) bad('בקשה לא נמצאה', 404);
  if (r.status !== 'open') bad('הבקשה כבר לא פתוחה', 409);
  if (r.trade !== p.trade) bad('הבקשה בקטגוריה אחרת', 403);
  if (get('SELECT id FROM offers WHERE request_id = ? AND pro_user_id = ?', r.id, u.id)) bad('כבר שלחת הצעה לבקשה הזו', 409);
  const price = money(ctx.body?.price);
  if (price <= 0) bad('צריך מחיר הצעה');
  const leadPrice = Number(setting('lead_price_nis', 100));
  const balance = chargeLead('pro', u.id, leadPrice, `פנייה #${r.id} — ${r.address}`, `request:${r.id}`);
  const id = run('INSERT INTO offers(request_id, pro_user_id, price_nis, eta_min, note) VALUES(?,?,?,?,?)',
    r.id, u.id, price, money(ctx.body?.etaMin) || 60, ctx.body?.note || null).lastInsertRowid;
  return { status: 201, body: { offer: get('SELECT * FROM offers WHERE id = ?', id), balance, charged: leadPrice } };
});

route('POST', '/api/offers/:id/accept', ctx => {
  const u = requireRole(ctx, 'customer');
  const o = get('SELECT * FROM offers WHERE id = ?', ctx.params.id);
  if (!o) bad('הצעה לא נמצאה', 404);
  const r = get('SELECT * FROM requests WHERE id = ?', o.request_id);
  if (!r || r.customer_id !== u.id) bad('אין הרשאה', 403);
  if (r.status !== 'open') bad('הבקשה כבר טופלה', 409);
  tx(() => {
    run("UPDATE offers SET status = 'accepted' WHERE id = ?", o.id);
    run("UPDATE offers SET status = 'rejected' WHERE request_id = ? AND id <> ?", r.id, o.id);
    run("UPDATE requests SET status = 'matched' WHERE id = ?", r.id);
  });
  return { body: { ok: true, request: get('SELECT * FROM requests WHERE id = ?', r.id), offer: get('SELECT * FROM offers WHERE id = ?', o.id) } };
});

route('GET', '/api/offers', ctx => {
  const u = requireRole(ctx, 'pro');
  const rows = all(`SELECT o.*, r.address, r.trade, r.description, r.status AS request_status, r.created_at AS request_at
    FROM offers o JOIN requests r ON r.id = o.request_id WHERE o.pro_user_id = ? ORDER BY o.created_at DESC`, u.id);
  return { body: { offers: rows } };
});

route('GET', '/api/wallet', ctx => {
  const u = requireUser(ctx);
  if (u.role === 'pro') {
    const p = proRow(u.id);
    const ledger = all("SELECT * FROM ledger WHERE owner_type = 'pro' AND owner_id = ? ORDER BY id DESC LIMIT 50", u.id);
    return { body: { balance: p.balance_nis, ledger, leadPrice: Number(setting('lead_price_nis', 100)) } };
  }
  if (u.role === 'contractor') {
    const b = businessOf(u.id);
    const ledger = all("SELECT * FROM ledger WHERE owner_type = 'business' AND owner_id = ? ORDER BY id DESC LIMIT 50", b.id);
    return { body: { balance: b.balance_nis, ledger, leadPrice: Number(setting('lead_price_nis', 100)) } };
  }
  bad('אין ארנק לתפקיד הזה', 403);
});

route('POST', '/api/wallet/topup', ctx => {
  const u = requireRole(ctx, 'pro', 'contractor');
  const amount = money(ctx.body?.amount);
  if (amount < 100 || amount > 50000) bad('סכום טעינה בין 100 ל-50,000 ש״ח');
  if (u.role === 'pro') return { body: { balance: topUp('pro', u.id, amount, ctx.body?.note) } };
  const b = businessOf(u.id);
  return { body: { balance: topUp('business', b.id, amount, ctx.body?.note) } };
});

route('GET', '/api/business/:slug', ctx => {
  const b = get('SELECT * FROM businesses WHERE slug = ?', ctx.params.slug);
  if (!b) bad('עסק לא נמצא', 404);
  const team = all('SELECT id, name, trade, active, capacity FROM team_members WHERE business_id = ? AND active = 1', b.id);
  const services = all('SELECT * FROM services WHERE business_id = ? ORDER BY price_nis', b.id);
  const reviews = all("SELECT * FROM reviews WHERE subject_type = 'business' AND subject_id = ? ORDER BY id DESC LIMIT 6", b.id);
  const busy = all(`SELECT day, start, COUNT(*) AS n FROM appointments
    WHERE business_id = ? AND status <> 'cancelled' AND day >= date('now') GROUP BY day, start`, b.id);
  return {
    body: {
      business: { ...b, verified: !!b.verified, auto_confirm: !!b.auto_confirm },
      team, services, reviews, busy
    }
  };
});

route('GET', '/api/business', ctx => {
  const u = requireRole(ctx, 'contractor');
  const b = businessOf(u.id);
  if (!b) bad('עסק לא נמצא', 404);
  const team = all('SELECT * FROM team_members WHERE business_id = ? ORDER BY active DESC, id', b.id);
  const services = all('SELECT * FROM services WHERE business_id = ? ORDER BY id', b.id);
  const appts = all(`${APPT_SELECT} WHERE a.business_id = ? AND a.day >= date('now','-7 day') ORDER BY a.day, a.start`, b.id);
  const waitlist = all(`SELECT r.*, u.name AS customer FROM requests r JOIN users u ON u.id = r.customer_id
    WHERE r.status = 'open' ORDER BY r.created_at DESC`).filter(r =>
      haversine({ lat: b.lat, lng: b.lng }, { lat: r.lat, lng: r.lng }) <= b.radius_m);
  return {
    body: {
      business: { ...b, verified: !!b.verified, auto_confirm: !!b.auto_confirm },
      team: team.map(t => ({ ...t, active: !!t.active })),
      services, appointments: appts.map(shapeAppt), waitlist,
      balance: b.balance_nis, leadPrice: Number(setting('lead_price_nis', 100))
    }
  };
});

route('POST', '/api/business/appointments', ctx => {
  const u = requireUser(ctx);
  let b = null;
  if (u.role === 'contractor') b = businessOf(u.id);
  else {
    const { businessId, slug, teamId } = ctx.body || {};
    b = businessId ? get('SELECT * FROM businesses WHERE id = ?', Number(businessId))
      : slug ? get('SELECT * FROM businesses WHERE slug = ?', slug)
      : teamId ? get('SELECT b.* FROM businesses b JOIN team_members t ON t.business_id = b.id WHERE t.id = ?', Number(teamId))
      : null;
  }
  if (!b) bad('עסק לא נמצא', 404);
  const { teamId, serviceId, day, start, customerName, phone, address } = ctx.body || {};
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) bad('תאריך לא חוקי');
  if (!start || !/^\d{2}:\d{2}$/.test(start)) bad('שעה לא חוקית');
  const service = get('SELECT * FROM services WHERE id = ? AND business_id = ?', serviceId, b.id);
  if (!service) bad('שירות לא נמצא', 404);
  let team = teamId ? get('SELECT * FROM team_members WHERE id = ? AND business_id = ?', teamId, b.id) : null;
  if (!team) {
    const pool = all('SELECT * FROM team_members WHERE business_id = ? AND active = 1', b.id);
    const matching = pool.filter(t => t.trade === service.trade);
    const candidates = matching.length ? matching : pool;
    const load = t => get(`SELECT COUNT(*) AS n FROM appointments
      WHERE team_id = ? AND day = ? AND status <> 'cancelled'`, t.id, day).n;
    team = candidates.slice().sort((x, y) => load(x) - load(y))[0];
  }
  if (!team) bad('אין איש צוות פנוי', 409);
  if (!customerName) bad('צריך שם לקוח');
  const appt = tx(() => {
    const taken = get(`SELECT COUNT(*) AS n FROM appointments
      WHERE team_id = ? AND day = ? AND start = ? AND status <> 'cancelled'`, team.id, day, start).n;
    if (taken >= Math.max(1, team.capacity)) bad('המשבצת תפוסה אצל איש הצוות', 409, { taken, capacity: team.capacity });
    const id = run(`INSERT INTO appointments(business_id, team_id, service_id, customer_id, customer_name, phone,
        address, day, start, duration_min, price_nis, status, source)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      b.id, team.id, service.id, u.role === 'customer' ? u.id : null, customerName, phone || null, address || null,
      day, start, service.duration_min, service.price_nis, b.auto_confirm ? 'confirmed' : 'pending',
      u.role === 'customer' ? 'page' : 'phone').lastInsertRowid;
    return get(`${APPT_SELECT} WHERE a.id = ?`, id);
  });
  return { status: 201, body: { appointment: shapeAppt(appt) } };
});

route('PATCH', '/api/appointments/:id', ctx => {
  const u = requireUser(ctx);
  const a = get('SELECT * FROM appointments WHERE id = ?', ctx.params.id);
  if (!a) bad('תור לא נמצא', 404);
  const status = ctx.body?.status;
  if (!['pending', 'confirmed', 'in_progress', 'done', 'no_show', 'cancelled'].includes(status)) bad('סטטוס לא חוקי');
  if (u.role === 'contractor') {
    const b = businessOf(u.id);
    if (!b || b.id !== a.business_id) bad('אין הרשאה', 403);
  } else if (u.role === 'customer') {
    if (a.customer_id !== u.id || status !== 'cancelled') bad('אין הרשאה', 403);
  } else bad('אין הרשאה', 403);
  run('UPDATE appointments SET status = ? WHERE id = ?', status, a.id);
  return { body: { appointment: shapeAppt(get(`${APPT_SELECT} WHERE a.id = ?`, a.id)) } };
});

route('GET', '/api/appointments', ctx => {
  const u = requireUser(ctx);
  if (u.role === 'customer') {
    const rows = all(`${APPT_SELECT} WHERE a.customer_id = ? ORDER BY a.day DESC, a.start DESC`, u.id);
    return { body: { appointments: rows.map(shapeAppt) } };
  }
  if (u.role === 'contractor') {
    const b = businessOf(u.id);
    const rows = all(`${APPT_SELECT} WHERE a.business_id = ? ORDER BY a.day, a.start`, b.id);
    return { body: { appointments: rows.map(shapeAppt) } };
  }
  bad('אין הרשאה', 403);
});

route('GET', '/api/admin/overview', ctx => {
  requireRole(ctx, 'admin');
  const counts = {
    users: get('SELECT COUNT(*) AS n FROM users').n,
    customers: get("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").n,
    pros: get('SELECT COUNT(*) AS n FROM pros').n,
    businesses: get('SELECT COUNT(*) AS n FROM businesses').n,
    openRequests: get("SELECT COUNT(*) AS n FROM requests WHERE status = 'open'").n,
    offers: get('SELECT COUNT(*) AS n FROM offers').n,
    appointments: get('SELECT COUNT(*) AS n FROM appointments').n
  };
  const leadRevenue = get("SELECT COALESCE(SUM(-delta_nis),0) AS n FROM ledger WHERE reason = 'lead_charge'").n;
  const topups = get("SELECT COALESCE(SUM(delta_nis),0) AS n FROM ledger WHERE reason = 'topup'").n;
  const gmv = get("SELECT COALESCE(SUM(price_nis),0) AS n FROM appointments WHERE status = 'done'").n;
  const balances = get("SELECT COALESCE(SUM(balance_nis),0) AS n FROM pros").n + get('SELECT COALESCE(SUM(balance_nis),0) AS n FROM businesses').n;
  const byTrade = all(`SELECT trade, COUNT(*) AS n FROM requests GROUP BY trade ORDER BY n DESC`);
  return { body: { counts, leadRevenue, topups, gmv, balances, byTrade, leadPrice: Number(setting('lead_price_nis', 100)) } };
});

route('GET', '/api/admin/ledger', ctx => {
  requireRole(ctx, 'admin');
  const rows = all(`SELECT l.*, CASE WHEN l.owner_type = 'pro' THEN (SELECT name FROM users WHERE id = l.owner_id)
      ELSE (SELECT name FROM businesses WHERE id = l.owner_id) END AS owner_name
    FROM ledger l ORDER BY l.id DESC LIMIT 100`);
  return { body: { ledger: rows } };
});

route('GET', '/api/admin/pros', ctx => {
  requireRole(ctx, 'admin');
  const rows = all(`SELECT p.*, u.name, u.email FROM pros p JOIN users u ON u.id = p.user_id ORDER BY p.user_id`);
  return { body: { pros: rows.map(p => ({ ...p, verified: !!p.verified })) } };
});

route('PATCH', '/api/admin/pros/:id', ctx => {
  requireRole(ctx, 'admin');
  const status = ctx.body?.status;
  if (!['active', 'paused', 'blocked'].includes(status)) bad('סטטוס לא חוקי');
  run('UPDATE pros SET status = ? WHERE user_id = ?', status, ctx.params.id);
  return { body: { ok: true } };
});

route('GET', '/api/admin/settings', ctx => {
  requireRole(ctx, 'admin');
  return { body: { leadPrice: Number(setting('lead_price_nis', 100)), minOffers: Number(setting('min_offers', 3)) } };
});

route('PATCH', '/api/admin/settings', ctx => {
  requireRole(ctx, 'admin');
  const { leadPrice, minOffers } = ctx.body || {};
  if (leadPrice !== undefined) {
    const v = money(leadPrice);
    if (v < 10 || v > 1000) bad('מחיר פנייה בין 10 ל-1,000 ש״ח');
    setSetting('lead_price_nis', v);
  }
  if (minOffers !== undefined) setSetting('min_offers', Math.max(1, money(minOffers)));
  return { body: { leadPrice: Number(setting('lead_price_nis', 100)), minOffers: Number(setting('min_offers', 3)) } };
});

export async function handleApi(ctx) {
  const path = ctx.path;
  for (const r of routes) {
    if (r.method !== ctx.method) continue;
    const m = r.rx.exec(path);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    const out = await r.handler({ ...ctx, params });
    if (!out) return { status: 204, body: null };
    if (out.body !== undefined && out.status) return out;
    return { status: 200, body: out.body !== undefined ? out.body : out, cookies: out.cookies };
  }
  return null;
}
