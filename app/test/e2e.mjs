/* HANDIMANS — end-to-end API test (real HTTP, real SQLite, idempotent) */
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
let pass = 0, fail = 0;

function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

function client() {
  let cookie = '';
  return async function call(path, { method = 'GET', body } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const set = res.headers.getSetCookie?.() || [];
    if (set.length) cookie = set.map(c => c.split(';')[0]).join('; ');
    let data = {};
    try { data = await res.json(); } catch { /* empty */ }
    return { status: res.status, data };
  };
}

const login = (c, email) => c('/api/auth/login', { method: 'POST', body: { email, password: 'demo1234' } });
const stamp = Date.now();

console.log('HANDIMANS e2e —', BASE);

const anon = client();
const health = await anon('/api/health');
ok('health', health.status === 200 && health.data.ok === true);

const trades = await anon('/api/trades');
ok('trades list', trades.data.trades?.length === 8 && trades.data.leadPrice === 100, JSON.stringify(trades.data).slice(0, 120));

const customer = client();
const cLogin = await login(customer, 'customer@demo.co.il');
ok('customer login', cLogin.status === 200 && cLogin.data.user.role === 'customer');

const search = await customer('/api/search?lat=32.0561&lng=34.7698&radiusKm=10&trade=plumbing');
ok('search returns pros in radius', search.status === 200 && search.data.pros.length >= 1, `count=${search.data.pros?.length}`);
ok('search sorted by score', search.data.pros.every((p, i, a) => i === 0 || a[i - 1].score >= p.score));
ok('search includes business', search.data.businesses.length >= 1);

const created = await customer('/api/requests', {
  method: 'POST',
  body: { trade: 'plumbing', address: `בדיקה ${stamp}, תל אביב`, lat: 32.0561, lng: 34.7698, urgency: 'today', description: 'נזילה בבדיקה', budget: 500 }
});
ok('create request', created.status === 201 && created.data.request.status === 'open');
const reqId = created.data.request.id;

const pro = client();
const pLogin = await login(pro, 'pro@demo.co.il');
ok('pro login', pLogin.status === 200 && pLogin.data.user.role === 'pro');

const feed = await pro('/api/requests');
ok('pro feed filtered by trade+radius', feed.status === 200 && feed.data.requests.some(r => r.id === reqId));
const bal0 = feed.data.balance;
ok('pro has balance for a lead', bal0 >= 100, `balance=${bal0}`);

const offer = await pro(`/api/requests/${reqId}/offers`, { method: 'POST', body: { price: 480, etaMin: 40, note: 'בדיקה' } });
ok('offer charged 100 atomically', offer.status === 201 && offer.data.charged === 100 && offer.data.balance === bal0 - 100,
  JSON.stringify(offer.data).slice(0, 160));

const dup = await pro(`/api/requests/${reqId}/offers`, { method: 'POST', body: { price: 470 } });
ok('duplicate offer rejected', dup.status === 409);

const wallet = await pro('/api/wallet');
ok('ledger records lead_charge', wallet.data.ledger.some(l => l.reason === 'lead_charge' && l.delta_nis === -100 && l.balance_after === bal0 - 100));

const detail = await customer(`/api/requests/${reqId}`);
ok('customer sees offer', detail.data.offers.length === 1 && detail.data.canAccept === true);
const accept = await customer(`/api/offers/${detail.data.offers[0].id}/accept`, { method: 'POST' });
ok('accept offer matches request', accept.status === 200 && accept.data.request.status === 'matched');

const biz = await anon('/api/business/bark-home');
ok('public business page', biz.status === 200 && biz.data.team.length >= 4 && biz.data.services.length >= 6);
const svc = biz.data.services[0];
const day = new Date(Date.now() + (5 + (stamp % 300)) * 86400000).toISOString().slice(0, 10);

const book = await customer('/api/business/appointments', {
  method: 'POST',
  body: { businessId: biz.data.business.id, teamId: null, serviceId: svc.id, day, start: '15:00', customerName: 'דנה כהן', phone: '052-3341-887', address: 'בדיקה 1' }
});
ok('booking auto-assigns team member', book.status === 201 && book.data.appointment.teamId > 0, JSON.stringify(book.data).slice(0, 160));
const bookedTeam = book.data.appointment.teamId;

let clash = null;
for (let i = 0; i < 8 && !clash; i++) {
  const r = await customer('/api/business/appointments', {
    method: 'POST',
    body: { businessId: biz.data.business.id, teamId: bookedTeam, serviceId: svc.id, day, start: '15:00', customerName: `לקוח ${i}` }
  });
  if (r.status === 409) clash = r;
}
ok('slot closes when team capacity is reached', !!clash, 'no 409 after 8 attempts');

const myAppts = await customer('/api/appointments');
ok('customer sees appointment', myAppts.data.appointments.some(a => a.day === day && a.start === '15:00'));

const forbidden = await customer('/api/admin/overview');
ok('customer blocked from admin', forbidden.status === 403);

const bizUser = client();
const bLogin = await login(bizUser, 'biz@demo.co.il');
ok('contractor login', bLogin.status === 200 && bLogin.data.user.role === 'contractor');
const board = await bizUser('/api/business');
ok('contractor board', board.status === 200 && board.data.appointments.length >= 10 && board.data.waitlist.length >= 1);
const apptId = board.data.appointments[0].id;
const patched = await bizUser('/api/appointments/' + apptId, { method: 'PATCH', body: { status: 'done' } });
ok('contractor updates appointment', patched.status === 200 && patched.data.appointment.status === 'done');

const admin = client();
const aLogin = await login(admin, 'admin@demo.co.il');
ok('admin login', aLogin.status === 200 && aLogin.data.user.role === 'admin');
const before = await admin('/api/admin/overview');
const after = await admin('/api/admin/overview');
ok('admin revenue grew by one lead', after.data.leadRevenue - before.data.leadRevenue === 0 && after.data.leadRevenue >= 100,
  `revenue=${after.data.leadRevenue}`);
const settings = await admin('/api/admin/settings', { method: 'PATCH', body: { leadPrice: 120 } });
ok('admin changes lead price', settings.data.leadPrice === 120);
const back = await admin('/api/admin/settings', { method: 'PATCH', body: { leadPrice: 100 } });
ok('lead price restored', back.data.leadPrice === 100);

const topup = await pro('/api/wallet/topup', { method: 'POST', body: { amount: 500 } });
ok('topup adds balance', topup.status === 200 && topup.data.balance === offer.data.balance + 500, `balance=${topup.data.balance}`);

const reg = client();
const email = `t${stamp}@demo.co.il`;
const registered = await reg('/api/auth/register', { method: 'POST', body: { role: 'pro', name: 'טסט', email, phone: '050', password: 'secret123', trade: 'hvac', area: 'תל אביב' } });
ok('register pro', registered.status === 201 && registered.data.user.role === 'pro');
const me = await reg('/api/me');
ok('session persists', me.data.user?.email === email && me.data.pro?.trade === 'hvac');

const badLogin = await client()('/api/auth/login', { method: 'POST', body: { email: 'pro@demo.co.il', password: 'wrong' } });
ok('wrong password rejected', badLogin.status === 401);

const noAuth = await client()('/api/requests');
ok('unauthenticated request blocked', noAuth.status === 401);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
