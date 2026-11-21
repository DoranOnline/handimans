/* HANDIMANS — SPA (real API, no mock data) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '₪' + Number(n || 0).toLocaleString('he-IL');
const num = n => Number(n || 0).toLocaleString('he-IL');
const pad = n => String(n).padStart(2, '0');
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const dayLabel = iso => { const d = new Date(iso + 'T12:00:00'); return `${DAY_HE[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`; };
const rel = iso => {
  const diff = Math.round((Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime()) / 60000);
  if (diff < 1) return 'עכשיו';
  if (diff < 60) return `לפני ${diff} דק׳`;
  if (diff < 1440) return `לפני ${Math.round(diff / 60)} שע׳`;
  return `לפני ${Math.round(diff / 1440)} ימים`;
};

const state = { user: null, trades: [], leadPrice: 100, search: { trade: 'all', radiusKm: 8, sort: 'score', lat: 32.0853, lng: 34.7818 } };
let map = null;
let mapMarkers = [];

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data.error || `שגיאה ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function toast(msg, isErr = false) {
  $$('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function modal({ title, sub, body, foot = '', wide = false, onMount }) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <div class="modal-head"><div class="modal-title">${title}</div>${sub ? `<div class="modal-sub">${sub}</div>` : ''}</div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  $$('[data-close]', overlay).forEach(b => b.addEventListener('click', closeModal));
  if (onMount) onMount(overlay);
  const first = overlay.querySelector('input,select,textarea,button');
  if (first) first.focus();
  return overlay;
}
function closeModal() { $$('.overlay').forEach(o => o.remove()); }

const ICONS = {
  search: 'M11 4a7 7 0 105.3 11.9l3.4 3.4 1.4-1.4-3.4-3.4A7 7 0 0011 4zm0 2a5 5 0 110 10 5 5 0 010-10z',
  calendar: 'M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zM5 9h14v10H5V9z',
  wallet: 'M3 6a2 2 0 012-2h12a2 2 0 012 2v1h1a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm14 6a2 2 0 100 4 2 2 0 000-4z',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zm7 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6H2zm14.5 0c-.2-2-1.3-3.7-3-4.8.5-.1 1-.2 1.5-.2 3.9 0 7 2.7 7 6h-5.5z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z',
  pin: 'M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z',
  star: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1L12 2z',
  phone: 'M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.2 11 11 0 003.5.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.6 3.5 1 1 0 01-.3 1l-2.2 2.3z',
  check: 'M9.5 17.5L4 12l1.5-1.5 4 4L18.5 5.5 20 7z',
  x: 'M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z',
  arrow: 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2L11.6 6.4 13 5z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.6l4 2.4-1 1.7-5-3V7h2z',
  briefcase: 'M9 4h6a2 2 0 012 2v2h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V10a2 2 0 012-2h3V6a2 2 0 012-2zm0 4h6V6H9v2z',
  wrench: 'M21 6.5a5.5 5.5 0 01-7.3 5.2L6 19.4 4.6 18l7.7-7.7A5.5 5.5 0 0119.5 3l-3 3 1.5 1.5 3-3c.1.3 0 .7 0 1z',
  building: 'M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16h2v-8h2v8h1v2H3v-2h1zm4-14h2v2H8V7zm4 0h2v2h-2V7zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2z',
  copy: 'M8 2h9a2 2 0 012 2v11h-2V4H8V2zM5 6h9a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z',
  logout: 'M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5v-2H5V5h5V3zm5.6 4.6L14.2 9l2 2H9v2h7.2l-2 2 1.4 1.4L20 12l-4.4-4.4z'
};
const ic = (name, size = 15) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICONS[name] || ICONS.check}"/></svg>`;

const tradeOf = id => state.trades.find(t => t.id === id) || { name: id, color: '#8b98a9' };
const avatar = (name, color = '#c2ff3d', cls = '') =>
  `<span class="avatar ${cls}" style="background:${color}">${esc(String(name || '?').trim().charAt(0))}</span>`;

/* ------------------------------- shell ------------------------------- */
const NAV = {
  customer: [['#/search', 'חיפוש בעלי מקצוע', 'search'], ['#/requests', 'הבקשות שלי', 'briefcase'], ['#/appointments', 'התורים שלי', 'calendar']],
  pro: [['#/pro/feed', 'פניות באזור', 'search'], ['#/pro/offers', 'ההצעות שלי', 'briefcase'], ['#/pro/wallet', 'יתרה ותשלומים', 'wallet']],
  contractor: [['#/biz', 'לוח בקרה', 'building'], ['#/biz/calendar', 'יומן', 'calendar'], ['#/biz/queue', 'רשימת המתנה', 'clock'], ['#/biz/team', 'צוות', 'users'], ['#/biz/page', 'העמוד הציבורי', 'pin'], ['#/biz/wallet', 'יתרה ותשלומים', 'wallet']],
  admin: [['#/admin', 'סקירה', 'building'], ['#/admin/pros', 'בעלי מקצוע', 'users'], ['#/admin/ledger', 'תשלומים', 'wallet'], ['#/admin/settings', 'הגדרות', 'wrench']]
};
const ROLE_HE = { customer: 'לקוח', pro: 'בעל מקצוע', contractor: 'עסק עם צוות', admin: 'מנהל' };

function topbar(active) {
  const u = state.user;
  const nav = u ? (NAV[u.role] || []).map(([href, label, icon]) =>
    `<a href="${href}" class="${active === href ? 'on' : ''}">${label}</a>`).join('') : '';
  return `<header class="topbar">
    <a class="brand" href="${u ? (NAV[u.role][0][0]) : '#/login'}">
      <span class="brand-mark">H</span>
      <span><span class="brand-name">HANDI<span>MANS</span></span><span class="brand-sub">שירותי בית לפי מרחק</span></span>
    </a>
    <nav class="topnav">${nav}</nav>
    <div class="top-right">
      ${u ? `<div class="who">${avatar(u.name, '#c2ff3d', 'sm')}<span><b>${esc(u.name)}</b><small>${ROLE_HE[u.role] || u.role}</small></span></div>
      <button class="btn btn-ghost btn-sm" id="logout" aria-label="יציאה">${ic('logout', 14)}</button>`
      : `<a class="btn btn-ghost btn-sm" href="#/login">כניסה</a><a class="btn btn-primary btn-sm" href="#/login?mode=register">הרשמה</a>`}
    </div>
  </header>`;
}

function shell(active, content) {
  $('#app').innerHTML = topbar(active) + content;
  const out = $('#logout');
  if (out) out.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    state.user = null;
    location.hash = '#/login';
    boot();
  });
}

/* ------------------------------- router ------------------------------- */
function route() {
  const raw = location.hash.replace(/^#\/?/, '') || '';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path, parts, query: new URLSearchParams(qs || '') };
}

async function render() {
  destroyMap();
  const r = route();
  const u = state.user;
  if (!u && !r.path.startsWith('b/')) return loginView(r);
  if (r.path === 'login') return loginView(r);
  try {
    if (r.parts[0] === 'b') return publicBizView(r.parts[1]);
    if (u.role === 'customer') {
      if (r.parts[0] === 'requests') return requestsView();
      if (r.parts[0] === 'appointments') return appointmentsView();
      return searchView();
    }
    if (u.role === 'pro') {
      if (r.parts[1] === 'offers') return proOffersView();
      if (r.parts[1] === 'wallet') return walletView('pro');
      return proFeedView();
    }
    if (u.role === 'contractor') {
      const v = r.parts[1] || '';
      if (v === 'calendar') return bizCalendar();
      if (v === 'queue') return bizQueue();
      if (v === 'team') return bizTeam();
      if (v === 'page') return bizPage();
      if (v === 'wallet') return walletView('business');
      return bizDashboard();
    }
    if (u.role === 'admin') {
      const v = r.parts[1] || '';
      if (v === 'pros') return adminPros();
      if (v === 'ledger') return adminLedger();
      if (v === 'settings') return adminSettings();
      return adminOverview();
    }
    return searchView();
  } catch (err) {
    shell('', `<div class="wrap"><div class="panel"><div class="panel-body"><b>שגיאה:</b> ${esc(err.message)}</div></div></div>`);
  }
}

/* ------------------------------- login ------------------------------- */
function loginView(r) {
  const register = r.query.get('mode') === 'register';
  $('#app').innerHTML = topbar('') + `<div class="auth"><div class="auth-card">
    <h1>${register ? 'פתיחת חשבון' : 'כניסה ל-HANDIMANS'}</h1>
    <p>${register ? 'בוחרים תפקיד, ממלאים פרטים — ומתחילים לעבוד.' : 'התחברו עם אחד מחשבונות הדמו, או עם החשבון שלכם.'}</p>
    <div class="tabs"><button data-mode="login" class="${register ? '' : 'on'}">כניסה</button><button data-mode="register" class="${register ? 'on' : ''}">הרשמה</button></div>
    <form id="authForm">
      ${register ? `<div class="field"><label>תפקיד</label><select class="input" name="role" id="roleSel">
        <option value="customer">לקוח — מפרסם בקשות</option>
        <option value="pro">בעל מקצוע — שולח הצעות</option>
        <option value="contractor">עסק עם צוות — יומן ותורים</option>
      </select></div>` : ''}
      ${register ? `<div class="field"><label>שם מלא</label><input class="input" name="name" required autocomplete="name"></div>` : ''}
      <div class="field"><label>אימייל</label><input class="input" name="email" type="email" required autocomplete="email" value="${register ? '' : 'customer@demo.co.il'}"></div>
      ${register ? `<div class="field"><label>טלפון</label><input class="input" name="phone" autocomplete="tel"></div>` : ''}
      <div class="field"><label>סיסמה</label><input class="input" name="password" type="password" required autocomplete="${register ? 'new-password' : 'current-password'}" value="${register ? '' : 'demo1234'}"></div>
      <div id="extraFields"></div>
      <button class="btn btn-primary btn-block" type="submit">${register ? 'יצירת חשבון' : 'כניסה'}</button>
    </form>
    ${register ? '' : `<div class="divider"></div><div style="font-size:11px;font-weight:800;color:var(--muted)">כניסה מהירה לדמו</div>
      <div class="demo-grid">
        <button class="demo-btn" data-demo="customer@demo.co.il">לקוח<small>דנה כהן</small></button>
        <button class="demo-btn" data-demo="pro@demo.co.il">בעל מקצוע<small>יוסי לוי · יתרה 500 ₪</small></button>
        <button class="demo-btn" data-demo="biz@demo.co.il">עסק עם צוות<small>ברק שירותי בית</small></button>
        <button class="demo-btn" data-demo="admin@demo.co.il">מנהל מערכת<small>סטטיסטיקות והגדרות</small></button>
      </div>`}
  </div></div>`;

  $$('[data-mode]').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.mode === 'register' ? '#/login?mode=register' : '#/login'; }));
  $$('[data-demo]').forEach(b => b.addEventListener('click', async () => {
    try {
      const out = await api('/api/auth/login', { method: 'POST', body: { email: b.dataset.demo, password: 'demo1234' } });
      state.user = out.user;
      location.hash = NAV[out.user.role][0][0];
      toast(`ברוך הבא, ${out.user.name}`);
      render();
    } catch (e) { toast(e.message, true); }
  }));

  const roleSel = $('#roleSel');
  const extra = $('#extraFields');
  const paintExtra = () => {
    if (!roleSel) return;
    const role = roleSel.value;
    extra.innerHTML = role === 'customer' ? '' : `
      <div class="field"><label>תחום</label><select class="input" name="trade">${state.trades.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
      <div class="field"><label>אזור פעילות</label><input class="input" name="area" placeholder="למשל: פלורנטין, תל אביב" value="תל אביב"></div>
      ${role === 'contractor' ? `<div class="field"><label>שם העסק</label><input class="input" name="businessName" placeholder="ברק שירותי בית בע״מ"></div>` : ''}`;
  };
  if (roleSel) { roleSel.addEventListener('change', paintExtra); paintExtra(); }

  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      const out = register
        ? await api('/api/auth/register', { method: 'POST', body: fd })
        : await api('/api/auth/login', { method: 'POST', body: { email: fd.email, password: fd.password } });
      state.user = out.user;
      location.hash = NAV[out.user.role][0][0];
      toast(register ? 'החשבון נוצר' : `ברוך הבא, ${out.user.name}`);
      render();
    } catch (err) { toast(err.message, true); }
  });
}

/* ------------------------------- customer: search ------------------------------- */
function destroyMap() {
  mapMarkers.forEach(m => { try { m.remove(); } catch { /* gone */ } });
  mapMarkers = [];
  if (map) { try { map.remove(); } catch { /* gone */ } map = null; }
}

async function searchView() {
  const s = state.search;
  const q = new URLSearchParams({ lat: s.lat, lng: s.lng, radiusKm: s.radiusKm, trade: s.trade, sort: s.sort });
  const data = await api('/api/search?' + q);
  const chips = [{ id: 'all', name: 'הכל' }, ...state.trades].map(t =>
    `<button class="chip" data-trade="${t.id}" aria-pressed="${s.trade === t.id}">${esc(t.name)}</button>`).join('');
  const cards = data.pros.length ? data.pros.map(p => `
    <article class="pcard">
      <span class="fit">${p.score}% התאמה</span>
      <div class="pcard-top">
        ${avatar(p.name, tradeOf(p.trade).color)}
        <div style="flex:1;min-width:0">
          <div class="pcard-name">${esc(p.name)} ${p.verified ? `<span class="badge lime">מאומת</span>` : ''}</div>
          <div class="pcard-sub">${esc(tradeOf(p.trade).name)} · ${p.years} שנות ניסיון · ${esc(p.area)}</div>
        </div>
      </div>
      <div class="pcard-meta">
        <span>★ ${p.rating} (${num(p.reviews)})</span>
        <span>${ic('pin', 11)} ${p.dist < 1000 ? p.dist + ' מ׳' : (p.dist / 1000).toFixed(1) + ' ק״מ'}</span>
        <span>${ic('clock', 11)} ${p.respMin} דק׳</span>
      </div>
      <div class="pcard-foot">
        <div style="font-size:11.5px;color:var(--muted)"><b style="color:var(--ink)">${money(p.priceMin)}–${money(p.priceMax)}</b> · קריאה ${money(p.callout)}</div>
        <button class="btn btn-soft btn-sm" data-ask="${p.id}" data-trade="${p.trade}">בקש הצעה</button>
      </div>
    </article>`).join('') : `<div class="empty"><b>אין בעלי מקצוע בטווח</b>הגדילו את הרדיוס או בחרו תחום אחר.</div>`;

  const biz = data.businesses[0];
  shell('#/search', `<div class="wrap wide">
    <div class="page-head">
      <div><div class="page-title">מי זמין באזור שלך</div>
        <div class="page-sub">${data.count} בעלי מקצוע · רדיוס ${s.radiusKm} ק״מ · נקודה ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</div></div>
      <div class="page-actions">
        <button class="btn btn-ghost" id="geo">${ic('pin', 14)} המיקום שלי</button>
        <button class="btn btn-primary" id="newReq">${ic('plus', 14)} בקשת שירות</button>
      </div>
    </div>
    <div class="chips mb">${chips}</div>
    <div class="grid g-2-1">
      <div class="stack">
        ${biz ? `<button class="panel" id="bizCard" style="text-align:right;padding:14px 16px;display:flex;gap:12px;align-items:center;cursor:pointer">
          <span class="avatar lg" style="background:${tradeOf(biz.trade).color}">${esc(biz.name.charAt(0))}</span>
          <span style="flex:1;min-width:0">
            <span class="row" style="gap:6px"><b style="font-size:14px">${esc(biz.name)}</b><span class="badge violet">עסק עם צוות</span></span>
            <span style="display:block;font-size:11.5px;color:var(--muted);margin-top:3px">${esc(biz.tagline || '')}</span>
            <span style="display:block;font-size:11px;color:var(--faint);margin-top:4px">★ ${biz.rating} (${biz.reviews}) · ${biz.team} אנשי מקצוע · ${biz.dist < 1000 ? biz.dist + ' מ׳' : (biz.dist / 1000).toFixed(1) + ' ק״מ'}</span>
          </span>
          <span class="btn btn-primary btn-sm">לתור פנוי</span>
        </button>` : ''}
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${ic('search', 15)} תוצאות</div>
            <select class="input" id="sort" style="width:auto;padding:6px 10px;font-size:11.5px">
              <option value="score" ${s.sort === 'score' ? 'selected' : ''}>התאמה</option>
              <option value="distance" ${s.sort === 'distance' ? 'selected' : ''}>מרחק</option>
              <option value="rating" ${s.sort === 'rating' ? 'selected' : ''}>דירוג</option>
              <option value="price" ${s.sort === 'price' ? 'selected' : ''}>מחיר</option>
            </select>
          </div>
          <div class="panel-body">
            <div class="row" style="gap:10px;margin-bottom:12px">
              <span style="font-size:11px;font-weight:800;color:var(--muted);white-space:nowrap">רדיוס</span>
              <input type="range" id="radius" min="1" max="30" value="${s.radiusKm}">
              <span class="badge lime" id="radiusVal">${s.radiusKm} ק״מ</span>
            </div>
            <div class="grid g2" id="cards">${cards}</div>
          </div>
        </div>
      </div>
      <div class="panel" style="overflow:hidden"><div id="map" class="map" style="height:100%;min-height:520px"></div></div>
    </div>
  </div>`);

  $$('[data-trade]').forEach(b => b.addEventListener('click', () => { state.search.trade = b.dataset.trade; render(); }));
  $('#sort').addEventListener('change', e => { state.search.sort = e.target.value; render(); });
  const radius = $('#radius');
  radius.addEventListener('input', e => { $('#radiusVal').textContent = e.target.value + ' ק״מ'; });
  radius.addEventListener('change', e => { state.search.radiusKm = Number(e.target.value); render(); });
  $('#geo').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('הדפדפן לא תומך במיקום', true);
    navigator.geolocation.getCurrentPosition(
      pos => { state.search.lat = pos.coords.latitude; state.search.lng = pos.coords.longitude; toast('המיקום עודכן'); render(); },
      () => toast('לא הצלחנו לקבל מיקום — אפשר לגרור את הסיכה במפה', true)
    );
  });
  $('#newReq').addEventListener('click', () => requestModal(s.trade === 'all' ? 'plumbing' : s.trade));
  $$('[data-ask]').forEach(b => b.addEventListener('click', () => requestModal(b.dataset.trade)));
  const bc = $('#bizCard');
  if (bc) bc.addEventListener('click', () => { location.hash = '#/b/' + biz.slug; });

  initMap(data.pros);
}

function initMap(pros) {
  if (!window.L || !$('#map')) return;
  const s = state.search;
  map = L.map('map', { zoomControl: false }).setView([s.lat, s.lng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
  L.circle([s.lat, s.lng], { radius: s.radiusKm * 1000, color: '#c2ff3d', weight: 1.5, opacity: .8, fillColor: '#c2ff3d', fillOpacity: .07, dashArray: '5 6' }).addTo(map);
  L.marker([s.lat, s.lng], { draggable: true, icon: L.divIcon({ className: '', html: '<div class="job-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) })
    .addTo(map)
    .on('dragend', e => { const ll = e.target.getLatLng(); state.search.lat = ll.lat; state.search.lng = ll.lng; render(); });
  map.on('click', e => { state.search.lat = e.latlng.lat; state.search.lng = e.latlng.lng; render(); });
  pros.forEach(p => {
    const m = L.marker([p.lat, p.lng], {
      icon: L.divIcon({ className: '', html: `<div class="pin" style="--c:${tradeOf(p.trade).color}"><i>${esc(p.name.charAt(0))}</i></div>`, iconSize: [30, 30], iconAnchor: [15, 30] })
    }).addTo(map).bindPopup(`<b>${esc(p.name)}</b><br>${esc(tradeOf(p.trade).name)} · ${p.dist} מ׳ · ★ ${p.rating}`);
    mapMarkers.push(m);
  });
}

function requestModal(trade) {
  modal({
    title: 'בקשת שירות חדשה',
    sub: 'הבקשה נשלחת לבעלי המקצוע בטווח — כל אחד מהם משלם על הפנייה.',
    body: `<form id="reqForm">
      <div class="field"><label>תחום</label><select class="input" name="trade">${state.trades.map(t => `<option value="${t.id}" ${t.id === trade ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
      <div class="field"><label>כתובת</label><input class="input" name="address" required placeholder="רחוב, מספר, עיר" value="פלורנטין 12, תל אביב"></div>
      <div class="grid g2" style="gap:10px">
        <div class="field"><label>דחיפות</label><select class="input" name="urgency">
          <option value="emergency">דחוף — עכשיו</option><option value="today" selected>היום</option>
          <option value="this_week">השבוע</option><option value="flexible">גמיש</option></select></div>
        <div class="field"><label>תקציב (₪)</label><input class="input" name="budget" type="number" min="0" step="50" placeholder="600"></div>
      </div>
      <div class="field"><label>מה צריך לעשות</label><textarea class="input" name="description" required placeholder="תארו את התקלה, מה ניסיתם, ומה דחוף"></textarea></div>
      <div style="font-size:11px;color:var(--faint)">הבקשה תופיע אצל בעלי מקצוע בתחום שבטווח המרחק מהכתובת.</div>
    </form>`,
    foot: `<button class="btn btn-primary" id="sendReq">פרסום הבקשה</button><button class="btn btn-ghost" data-close>ביטול</button>`,
    onMount(box) {
      box.querySelector('#sendReq').addEventListener('click', async () => {
        const fd = Object.fromEntries(new FormData(box.querySelector('#reqForm')));
        if (!fd.address || !fd.description) return toast('כתובת ותיאור הם שדות חובה', true);
        try {
          await api('/api/requests', { method: 'POST', body: { ...fd, lat: state.search.lat, lng: state.search.lng, budget: Number(fd.budget) || null } });
          closeModal();
          toast('הבקשה פורסמה — בעלי מקצוע באזור יראו אותה');
          location.hash = '#/requests';
          render();
        } catch (e) { toast(e.message, true); }
      });
    }
  });
}

/* ------------------------------- customer: requests ------------------------------- */
async function requestsView() {
  const { requests } = await api('/api/requests');
  const st = { open: ['פתוחה', 'amber'], matched: ['נמצאה התאמה', 'blue'], scheduled: ['מתוזמנת', 'violet'], completed: ['הושלמה', 'green'], cancelled: ['בוטלה', 'gray'] };
  shell('#/requests', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">הבקשות שלי</div><div class="page-sub">${requests.length} בקשות · ${requests.filter(r => r.status === 'open').length} פתוחות</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="newReq">${ic('plus', 14)} בקשה חדשה</button></div></div>
    <div class="panel"><div class="panel-body flush">
      ${requests.length ? requests.map(r => {
        const s = st[r.status] || ['—', 'gray'];
        return `<div class="lrow" data-req="${r.id}" style="cursor:pointer">
          <span class="avatar sm" style="background:${tradeOf(r.trade).color}">${esc(tradeOf(r.trade).name.charAt(0))}</span>
          <div class="lrow-main">
            <div class="lrow-title">${esc(tradeOf(r.trade).name)} <span class="badge ${s[1]}">${s[0]}</span></div>
            <div class="lrow-sub">${esc(r.description)}</div>
            <div class="lrow-sub" style="color:var(--faint)">${esc(r.address)} · ${rel(r.created_at)} · ${r.offers} הצעות</div>
          </div>
          <span class="btn btn-ghost btn-sm">פתיחה</span>
        </div>`;
      }).join('') : `<div class="empty"><b>אין בקשות עדיין</b>פתחו בקשה ראשונה ותקבלו הצעות תוך דקות.<br><br><button class="btn btn-primary" id="firstReq">פתיחת בקשה</button></div>`}
    </div></div>
  </div>`);
  $('#newReq').addEventListener('click', () => requestModal('plumbing'));
  const first = $('#firstReq');
  if (first) first.addEventListener('click', () => requestModal('plumbing'));
  $$('[data-req]').forEach(el => el.addEventListener('click', () => requestDetail(el.dataset.req)));
}

async function requestDetail(id) {
  const data = await api('/api/requests/' + id);
  const r = data.request;
  const rows = data.offers.length ? data.offers.map(o => `<div class="lrow">
      ${avatar(o.pro_name, tradeOf(o.trade).color, 'sm')}
      <div class="lrow-main">
        <div class="lrow-title">${esc(o.pro_name)} ${o.verified ? '<span class="badge lime">מאומת</span>' : ''} <span class="badge ${o.status === 'accepted' ? 'green' : o.status === 'rejected' ? 'gray' : 'blue'}">${o.status === 'accepted' ? 'נבחרה' : o.status === 'rejected' ? 'נדחתה' : 'הצעה'}</span></div>
        <div class="lrow-sub">★ ${o.rating} (${num(o.reviews_count)}) · ${num(o.jobs_count)} עבודות · הגעה ${o.eta_min} דק׳</div>
        ${o.note ? `<div class="lrow-sub" style="color:var(--faint)">${esc(o.note)}</div>` : ''}
      </div>
      <div style="text-align:left"><div class="num" style="font-size:14px">${money(o.price_nis)}</div>
        ${data.canAccept && r.status === 'open' ? `<button class="btn btn-primary btn-sm" data-accept="${o.id}" style="margin-top:5px">בחירה</button>` : ''}</div>
    </div>`).join('') : `<div class="empty"><b>עוד אין הצעות</b>בעלי מקצוע באזור קיבלו את הבקשה.</div>`;

  modal({
    title: `${tradeOf(r.trade).name} · ${esc(r.address)}`,
    sub: `${rel(r.created_at)} · תקציב ${r.budget_nis ? money(r.budget_nis) : 'לא צוין'} · ${r.status}`,
    wide: true,
    body: `<div style="font-size:12.5px;line-height:1.6;margin-bottom:12px">${esc(r.description)}</div>
      <div class="divider"></div><div style="font-size:12px;font-weight:800;margin-bottom:6px">הצעות (${data.offers.length})</div>
      <div class="panel"><div class="panel-body flush">${rows}</div></div>`,
    foot: `<button class="btn btn-ghost" data-close>סגירה</button>`,
    onMount(box) {
      $$('[data-accept]', box).forEach(b => b.addEventListener('click', async () => {
        try {
          await api('/api/offers/' + b.dataset.accept + '/accept', { method: 'POST' });
          closeModal(); toast('ההצעה נבחרה — הבקשה סומנה כמותאמת'); render();
        } catch (e) { toast(e.message, true); }
      }));
    }
  });
}

/* ------------------------------- customer: appointments ------------------------------- */
async function appointmentsView() {
  const { appointments } = await api('/api/appointments');
  const st = { pending: ['ממתין לאישור', 'amber'], confirmed: ['מאושר', 'blue'], in_progress: ['בביצוע', 'lime'], done: ['הושלם', 'green'], no_show: ['לא הגיע', 'red'], cancelled: ['בוטל', 'gray'] };
  shell('#/appointments', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">התורים שלי</div><div class="page-sub">${appointments.length} תורים שנקבעו דרך העמודים הציבוריים</div></div></div>
    <div class="panel"><div class="panel-body flush">
      ${appointments.length ? appointments.map(a => {
        const s = st[a.status] || ['—', 'gray'];
        return `<div class="lrow">
          <span class="avatar sm" style="background:var(--violet)">${esc(a.teamName.charAt(0))}</span>
          <div class="lrow-main">
            <div class="lrow-title">${esc(a.serviceName)} <span class="badge ${s[1]}">${s[0]}</span></div>
            <div class="lrow-sub">${dayLabel(a.day)} · ${a.start} · ${esc(a.teamName)} · ${money(a.price)}</div>
            <div class="lrow-sub" style="color:var(--faint)">${esc(a.address || '')}</div>
          </div>
          ${['pending', 'confirmed'].includes(a.status) ? `<button class="btn btn-danger btn-sm" data-cancel="${a.id}">ביטול</button>` : ''}
        </div>`;
      }).join('') : `<div class="empty"><b>אין תורים</b>היכנסו לעמוד העסק ובחרו משבצת פנויה.</div>`}
    </div></div>
  </div>`);
  $$('[data-cancel]').forEach(b => b.addEventListener('click', async () => {
    try {
      await api('/api/appointments/' + b.dataset.cancel, { method: 'PATCH', body: { status: 'cancelled' } });
      toast('התור בוטל'); render();
    } catch (e) { toast(e.message, true); }
  }));
}

/* ------------------------------- public business page ------------------------------- */
async function publicBizView(slug) {
  if (!slug) return searchView();
  const data = await api('/api/business/' + slug);
  const b = data.business;
  const days = Array.from({ length: 7 }, (_, i) => isoDay(addDays(new Date(), i)));
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const busyMap = new Map(data.busy.map(x => [`${x.day}|${x.start}`, x.n]));
  const slotCapacity = Math.max(1, data.team.reduce((s, t) => s + (t.capacity || 1), 0));
  const sel = { day: days[0], start: null, serviceId: data.services[0]?.id };

  shell('', `<div class="wrap">
    <div class="hero">
      <div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">
        <div>
          <div class="row" style="gap:6px;margin-bottom:9px"><span class="badge blue">מאומת</span><span class="badge green">ביטוח בתוקף</span><span class="badge violet">עסק עם צוות</span></div>
          <h1>${esc(b.name)}</h1>
          <p>${esc(b.tagline || '')}</p>
          <div class="hero-meta">
            <span>★ ${b.rating} (${num(b.reviews_count)})</span>
            <span>${data.team.length} אנשי מקצוע</span>
            <span>${esc(b.area || '')}</span>
            <span>${esc(b.phone || '')}</span>
          </div>
        </div>
        ${avatar(b.name, tradeOf(b.trade).color, 'lg')}
      </div>
      <div class="hero-cta">
        <a class="btn btn-primary" href="#bookArea">${ic('calendar', 14)} קבע תור</a>
        <a class="btn btn-ghost" href="tel:${esc(b.phone || '')}">${ic('phone', 14)} ${esc(b.phone || '')}</a>
      </div>
    </div>

    <div class="grid g-2-1 mt">
      <div class="stack">
        <div class="panel" id="bookArea">
          <div class="panel-head"><div class="panel-title">${ic('calendar', 15)} בחירת תור</div><span class="badge lime">אישור מיידי</span></div>
          <div class="panel-body">
            <div class="field"><label>שירות</label><select class="input" id="svc">
              ${data.services.map(s => `<option value="${s.id}">${esc(s.name)} — ${money(s.price_nis)} · ${s.duration_min} דק׳</option>`).join('')}
            </select></div>
            <div class="chips mb" id="days">${days.map((d, i) => `<button class="chip" data-day="${d}" aria-pressed="${i === 0}">${i === 0 ? 'היום' : i === 1 ? 'מחר' : dayLabel(d)}</button>`).join('')}</div>
            <div class="slots" id="slots"></div>
            <div class="divider"></div>
            <div class="grid g2" style="gap:10px">
              <div class="field"><label>שם</label><input class="input" id="cName" value="${esc(state.user?.name || '')}" placeholder="שם מלא"></div>
              <div class="field"><label>טלפון</label><input class="input" id="cPhone" value="${esc(state.user?.phone || '')}" placeholder="050-000-0000"></div>
            </div>
            <div class="field"><label>כתובת</label><input class="input" id="cAddr" placeholder="רחוב, מספר, עיר"></div>
            <button class="btn btn-primary btn-block" id="book">אישור התור</button>
            <div style="font-size:10.5px;color:var(--faint);margin-top:8px">התור נכנס ליומן העסק ונחסם אצל איש הצוות. אישור מיידי, ביטול עד 24 שעות לפני.</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${ic('wrench', 15)} שירותים ומחירים</div></div>
          <div class="panel-body"><div class="grid g2" style="gap:8px">
            ${data.services.map(s => `<div class="kv" style="border:1px solid var(--line);border-radius:9px;padding:9px 11px">
              <dt style="color:var(--ink);font-weight:700">${esc(s.name)}</dt><dd style="color:var(--accent)">${money(s.price_nis)}</dd></div>`).join('')}
          </div></div>
        </div>
      </div>
      <div class="stack">
        <div class="panel"><div class="panel-head"><div class="panel-title">${ic('users', 15)} הצוות</div></div>
          <div class="panel-body flush">${data.team.map(t => `<div class="lrow">${avatar(t.name, tradeOf(t.trade).color, 'sm')}
            <div class="lrow-main"><div class="lrow-title">${esc(t.name)}</div><div class="lrow-sub">${esc(tradeOf(t.trade).name)}</div></div>
            <span class="badge green">פעיל</span></div>`).join('')}</div></div>
        <div class="panel"><div class="panel-head"><div class="panel-title">${ic('star', 15)} ביקורות</div></div>
          <div class="panel-body flush">${data.reviews.map(r => `<div class="lrow"><div class="lrow-main">
            <div class="lrow-title">${esc(r.author)} <span style="color:var(--amber);font-size:11px">★ ${r.rating}</span></div>
            <div class="lrow-sub" style="white-space:normal">${esc(r.text || '')}</div></div></div>`).join('')}</div></div>
        <div class="panel"><div class="panel-body">
          <div style="font-size:11.5px;color:var(--muted);line-height:1.6">${esc(b.about || '')}</div>
          <div class="divider"></div>
          <div class="kv"><dt>אזור שירות</dt><dd>${esc(b.area || '')}</dd></div>
          <div class="kv"><dt>רדיוס</dt><dd>${(b.radius_m / 1000).toFixed(0)} ק״מ</dd></div>
          <div class="kv"><dt>משך משבצת</dt><dd>${b.slot_min} דק׳</dd></div>
        </div></div>
      </div>
    </div>
  </div>`);

  const paintSlots = () => {
    $('#slots').innerHTML = hours.map(h => {
      const taken = busyMap.get(`${sel.day}|${h}`) || 0;
      const full = taken >= slotCapacity;
      return `<button class="slot" data-slot="${h}" ${full ? 'disabled' : ''} aria-pressed="${sel.start === h}">${h}</button>`;
    }).join('');
    $$('[data-slot]').forEach(s => s.addEventListener('click', () => { sel.start = s.dataset.slot; paintSlots(); }));
  };
  paintSlots();
  $$('[data-day]').forEach(d => d.addEventListener('click', () => {
    sel.day = d.dataset.day; sel.start = null;
    $$('[data-day]').forEach(x => x.setAttribute('aria-pressed', String(x === d)));
    paintSlots();
  }));
  $('#svc').addEventListener('change', e => { sel.serviceId = Number(e.target.value); });

  $('#book').addEventListener('click', async () => {
    if (!state.user) { toast('צריך להתחבר כדי לקבוע תור', true); location.hash = '#/login'; return; }
    if (!sel.start) return toast('בחרו שעה פנויה', true);
    const name = $('#cName').value.trim(), phone = $('#cPhone').value.trim(), address = $('#cAddr').value.trim();
    if (!name) return toast('צריך שם', true);
    try {
      await api('/api/business/appointments', { method: 'POST', body: { businessId: b.id, teamId: null, serviceId: sel.serviceId, day: sel.day, start: sel.start, customerName: name, phone, address } });
      toast('התור נקבע'); location.hash = '#/appointments'; render();
    } catch (e) { toast(e.message, true); }
  });
}

/* ------------------------------- pro ------------------------------- */
async function proFeedView() {
  const data = await api('/api/requests');
  shell('#/pro/feed', `<div class="wrap">
    <div class="page-head">
      <div><div class="page-title">פניות באזור שלך</div><div class="page-sub">${data.requests.length} פניות פתוחות · מחיר פנייה ${money(data.leadPrice)}</div></div>
      <div class="page-actions"><span class="badge lime" style="padding:8px 12px">יתרה: ${money(data.balance)}</span>
        <a class="btn btn-ghost" href="#/pro/wallet">${ic('wallet', 14)} טעינה</a></div>
    </div>
    <div class="panel"><div class="panel-body flush">
      ${data.requests.length ? data.requests.map(r => `<div class="lrow">
        <span class="avatar sm" style="background:${tradeOf(r.trade).color}">${esc(tradeOf(r.trade).name.charAt(0))}</span>
        <div class="lrow-main">
          <div class="lrow-title">${esc(tradeOf(r.trade).name)} · ${esc(r.address)} <span class="badge ${r.urgency === 'emergency' ? 'red' : r.urgency === 'today' ? 'amber' : 'gray'}">${({ emergency: 'דחוף', today: 'היום', this_week: 'השבוע', flexible: 'גמיש' })[r.urgency]}</span></div>
          <div class="lrow-sub">${esc(r.description)}</div>
          <div class="lrow-sub" style="color:var(--faint)">${r.dist < 1000 ? r.dist + ' מ׳' : (r.dist / 1000).toFixed(1) + ' ק״מ'} · תקציב ${r.budget_nis ? money(r.budget_nis) : 'לא צוין'} · ${rel(r.created_at)} · ${r.offers} הצעות</div>
        </div>
        ${r.offered ? `<span class="badge green">הצעה נשלחה</span>` : `<button class="btn btn-primary btn-sm" data-offer="${r.id}" data-trade="${r.trade}">שליחת הצעה · ${money(data.leadPrice)}</button>`}
      </div>`).join('') : `<div class="empty"><b>אין פניות פתוחות כרגע</b>פניות חדשות בתחום שלך ובטווח המרחק יופיעו כאן.</div>`}
    </div></div>
  </div>`);
  $$('[data-offer]').forEach(b => b.addEventListener('click', () => offerModal(b.dataset.offer, data.balance, data.leadPrice)));
}

function offerModal(requestId, balance, leadPrice) {
  modal({
    title: 'שליחת הצעה לפנייה',
    sub: `חיוב ${money(leadPrice)} מהיתרה · יתרה נוכחית ${money(balance)}`,
    body: `<form id="offerForm">
      <div class="grid g2" style="gap:10px">
        <div class="field"><label>מחיר (₪)</label><input class="input" name="price" type="number" min="1" step="10" required placeholder="520"></div>
        <div class="field"><label>זמן הגעה (דק׳)</label><input class="input" name="etaMin" type="number" min="5" step="5" value="45"></div>
      </div>
      <div class="field"><label>הערה ללקוח</label><textarea class="input" name="note" placeholder="מה כלול, מתי מגיעים, אחריות"></textarea></div>
      ${balance < leadPrice ? `<div class="badge red" style="padding:8px 10px">אין יתרה מספקת — צריך טעינה לפני שליחת הצעה</div>` : ''}
    </form>`,
    foot: `${balance < leadPrice ? `<a class="btn btn-primary" href="#/pro/wallet" data-close>טעינת יתרה</a>` : `<button class="btn btn-primary" id="sendOffer">שליחה וחיוב ${money(leadPrice)}</button>`}<button class="btn btn-ghost" data-close>ביטול</button>`,
    onMount(box) {
      const btn = box.querySelector('#sendOffer');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        const fd = Object.fromEntries(new FormData(box.querySelector('#offerForm')));
        try {
          const out = await api(`/api/requests/${requestId}/offers`, { method: 'POST', body: { price: Number(fd.price), etaMin: Number(fd.etaMin), note: fd.note } });
          closeModal(); toast(`ההצעה נשלחה · חויבת ${money(out.charged)} · יתרה ${money(out.balance)}`); render();
        } catch (e) { toast(e.message, true); }
      });
    }
  });
}

async function proOffersView() {
  const { offers } = await api('/api/offers');
  const st = { sent: ['ממתינה', 'blue'], accepted: ['נבחרה', 'green'], rejected: ['נדחתה', 'gray'], withdrawn: ['בוטלה', 'gray'] };
  shell('#/pro/offers', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">ההצעות שלי</div><div class="page-sub">${offers.length} הצעות · ${offers.filter(o => o.status === 'accepted').length} נבחרו</div></div></div>
    <div class="panel"><div class="panel-body flush">
      ${offers.length ? offers.map(o => {
        const s = st[o.status] || ['—', 'gray'];
        return `<div class="lrow"><div class="lrow-main">
          <div class="lrow-title">${esc(tradeOf(o.trade).name)} · ${esc(o.address)} <span class="badge ${s[1]}">${s[0]}</span></div>
          <div class="lrow-sub">${esc(o.description)}</div>
          <div class="lrow-sub" style="color:var(--faint)">${rel(o.created_at)} · הגעה ${o.eta_min} דק׳</div>
        </div><div class="num">${money(o.price_nis)}</div></div>`;
      }).join('') : `<div class="empty"><b>אין הצעות עדיין</b>שלחו הצעה מפניות באזור.</div>`}
    </div></div>
  </div>`);
}

/* ------------------------------- wallet ------------------------------- */
async function walletView(kind) {
  const data = await api('/api/wallet');
  const back = kind === 'pro' ? '#/pro/feed' : '#/biz';
  const reason = { topup: ['טעינה', 'green'], lead_charge: ['חיוב פנייה', 'amber'], refund: ['זיכוי', 'blue'], adjustment: ['התאמה', 'gray'] };
  shell(kind === 'pro' ? '#/pro/wallet' : '#/biz/wallet', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">יתרה ותשלומים</div><div class="page-sub">מודל: ${money(data.leadPrice)} לכל פנייה · אין דמי מנוי</div></div>
      <div class="page-actions"><a class="btn btn-ghost" href="${back}">${ic('arrow', 14)} חזרה</a></div></div>
    <div class="grid g3 mb">
      <div class="kpi"><div class="kpi-label">יתרה זמינה</div><div class="kpi-value">${money(data.balance)}</div><div class="kpi-delta up">${Math.floor(data.balance / data.leadPrice)} פניות אפשריות</div></div>
      <div class="kpi"><div class="kpi-label">מחיר פנייה</div><div class="kpi-value">${money(data.leadPrice)}</div><div class="kpi-delta">נגבה רק על פנייה שנשלחה</div></div>
      <div class="kpi"><div class="kpi-label">חיובים בתקופה</div><div class="kpi-value">${money(data.ledger.filter(l => l.reason === 'lead_charge').reduce((s, l) => s + Math.abs(l.delta_nis), 0))}</div><div class="kpi-delta">${data.ledger.filter(l => l.reason === 'lead_charge').length} פניות</div></div>
    </div>
    <div class="panel mb"><div class="panel-head"><div class="panel-title">${ic('wallet', 15)} טעינת יתרה</div></div>
      <div class="panel-body"><div class="row wrap">
        ${[250, 500, 1000, 2500].map(a => `<button class="btn btn-soft" data-topup="${a}">${money(a)}</button>`).join('')}
        <span style="font-size:11px;color:var(--faint)">טעינה מדומה — במערכת האמיתית יחובר סליקת אשראי ישראלי.</span>
      </div></div></div>
    <div class="panel"><div class="panel-head"><div class="panel-title">${ic('briefcase', 15)} תנועות</div></div>
      <div class="panel-body flush"><div class="table-wrap" style="border:0"><table class="table">
        <thead><tr><th>תאריך</th><th>סוג</th><th>פירוט</th><th>סכום</th><th>יתרה</th></tr></thead>
        <tbody>${data.ledger.length ? data.ledger.map(l => {
          const r = reason[l.reason] || [l.reason, 'gray'];
          return `<tr><td>${esc(l.created_at.slice(0, 16))}</td><td><span class="badge ${r[1]}">${r[0]}</span></td>
            <td>${esc(l.note || '')}</td><td class="num" style="color:${l.delta_nis < 0 ? 'var(--red)' : 'var(--green)'}">${l.delta_nis > 0 ? '+' : ''}${money(l.delta_nis)}</td>
            <td class="num">${money(l.balance_after)}</td></tr>`;
        }).join('') : `<tr><td colspan="5" class="empty">אין תנועות</td></tr>`}</tbody>
      </table></div></div></div>
  </div>`);
  $$('[data-topup]').forEach(b => b.addEventListener('click', async () => {
    try {
      const out = await api('/api/wallet/topup', { method: 'POST', body: { amount: Number(b.dataset.topup) } });
      toast(`נטען · יתרה ${money(out.balance)}`); render();
    } catch (e) { toast(e.message, true); }
  }));
}

/* ------------------------------- contractor ------------------------------- */
async function bizDashboard() {
  const d = await api('/api/business');
  const b = d.business;
  const today = isoDay(new Date());
  const todays = d.appointments.filter(a => a.day === today && a.status !== 'cancelled');
  const week = d.appointments.filter(a => a.status !== 'cancelled');
  const revenue = week.reduce((s, a) => s + a.price, 0);
  shell('#/biz', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">${esc(b.name)}</div><div class="page-sub">${esc(b.area || '')} · ${d.team.filter(t => t.active).length} אנשי צוות פעילים · יתרה ${money(d.balance)}</div></div>
      <div class="page-actions"><a class="btn btn-ghost" href="#/biz/page">${ic('pin', 14)} העמוד הציבורי</a>
        <button class="btn btn-primary" id="newAppt">${ic('plus', 14)} תור חדש</button></div></div>
    <div class="grid g4 mb">
      <div class="kpi"><div class="kpi-label">תורים היום</div><div class="kpi-value">${todays.length}</div><div class="kpi-delta">${todays.filter(a => a.status === 'pending').length} ממתינים לאישור</div></div>
      <div class="kpi"><div class="kpi-label">תורים בשבוע</div><div class="kpi-value">${week.length}</div><div class="kpi-delta up">${d.waitlist.length} פניות ממתינות</div></div>
      <div class="kpi"><div class="kpi-label">שווי תורים</div><div class="kpi-value">${money(revenue)}</div><div class="kpi-delta">לפי מחירי השירות</div></div>
      <div class="kpi"><div class="kpi-label">יתרה לפניות</div><div class="kpi-value">${money(d.balance)}</div><div class="kpi-delta">${Math.floor(d.balance / d.leadPrice)} פניות</div></div>
    </div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-head"><div class="panel-title">${ic('calendar', 15)} היום — ${dayLabel(today)}</div><a class="btn btn-ghost btn-sm" href="#/biz/calendar">ליומן המלא</a></div>
        <div class="panel-body flush">${todays.length ? todays.sort((a, b2) => a.start.localeCompare(b2.start)).map(a => `<div class="lrow">
          <span class="badge ${a.status === 'pending' ? 'amber' : a.status === 'done' ? 'green' : 'blue'}" style="min-width:52px;justify-content:center">${a.start}</span>
          <div class="lrow-main"><div class="lrow-title">${esc(a.serviceName)} · ${esc(a.customer)}</div>
            <div class="lrow-sub">${esc(a.teamName)} · ${a.durationMin} דק׳ · ${money(a.price)}</div></div>
          <button class="btn btn-ghost btn-sm" data-appt="${a.id}">פתיחה</button></div>`).join('')
          : `<div class="empty"><b>אין תורים היום</b>פתחו תור ידני או שתפו את העמוד הציבורי.</div>`}</div></div>
      <div class="panel"><div class="panel-head"><div class="panel-title">${ic('clock', 15)} רשימת המתנה</div><a class="btn btn-ghost btn-sm" href="#/biz/queue">הכל</a></div>
        <div class="panel-body flush">${d.waitlist.slice(0, 4).map(r => `<div class="lrow"><div class="lrow-main">
          <div class="lrow-title">${esc(tradeOf(r.trade).name)} · ${esc(r.customer)}</div>
          <div class="lrow-sub">${esc(r.address)} · ${rel(r.created_at)}</div></div>
          <button class="btn btn-soft btn-sm" data-slot="${r.id}">שבץ</button></div>`).join('') || `<div class="empty">אין פניות ממתינות</div>`}</div></div>
    </div>
  </div>`);
  $('#newAppt').addEventListener('click', () => apptModal(d));
  $$('[data-appt]').forEach(b => b.addEventListener('click', () => apptDetail(b.dataset.appt, d)));
  $$('[data-slot]').forEach(b => b.addEventListener('click', () => {
    const r = d.waitlist.find(x => String(x.id) === b.dataset.slot);
    apptModal(d, { customerName: r.customer, phone: '', address: r.address, trade: r.trade });
  }));
}

async function bizCalendar() {
  const d = await api('/api/business');
  const days = Array.from({ length: 7 }, (_, i) => isoDay(addDays(new Date(), i)));
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const byCell = new Map();
  d.appointments.forEach(a => {
    const k = `${a.day}|${a.start}`;
    if (!byCell.has(k)) byCell.set(k, []);
    byCell.get(k).push(a);
  });
  const today = isoDay(new Date());
  shell('#/biz/calendar', `<div class="wrap wide">
    <div class="page-head"><div><div class="page-title">יומן העסק</div><div class="page-sub">${d.appointments.length} תורים · לחיצה על משבצת פותחת תור חדש</div></div>
      <div class="page-actions"><button class="btn btn-primary" id="newAppt">${ic('plus', 14)} תור חדש</button></div></div>
    <div class="panel"><div class="panel-body">
      <div class="cal">
        <div class="cal-h"></div>
        ${days.map(day => { const dt = new Date(day + 'T12:00:00'); return `<div class="cal-h ${day === today ? 'today' : ''}"><b>${DAY_HE[dt.getDay()]}</b>${dt.getDate()}.${dt.getMonth() + 1}</div>`; }).join('')}
        ${hours.map(h => `<div class="cal-t">${h}</div>${days.map(day => {
          const list = byCell.get(`${day}|${h}`) || [];
          return `<div class="cal-c" data-day="${day}" data-hour="${h}">
            ${list.map(a => `<button class="cal-ev ${a.status}" data-appt="${a.id}"><b>${esc(a.customer)}</b>${esc(a.serviceName)}</button>`).join('')}
          </div>`;
        }).join('')}`).join('')}
      </div>
    </div></div>
  </div>`);
  $('#newAppt').addEventListener('click', () => apptModal(d));
  $$('.cal-c').forEach(c => c.addEventListener('click', e => {
    if (e.target.closest('[data-appt]')) return;
    apptModal(d, { day: c.dataset.day, start: c.dataset.hour });
  }));
  $$('[data-appt]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); apptDetail(b.dataset.appt, d); }));
}

async function bizQueue() {
  const d = await api('/api/business');
  shell('#/biz/queue', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">רשימת המתנה</div><div class="page-sub">${d.waitlist.length} פניות פתוחות בטווח השירות · יתרה ${money(d.balance)}</div></div></div>
    <div class="panel"><div class="panel-body flush">
      ${d.waitlist.length ? d.waitlist.map(r => `<div class="lrow">
        <span class="avatar sm" style="background:${tradeOf(r.trade).color}">${esc(tradeOf(r.trade).name.charAt(0))}</span>
        <div class="lrow-main"><div class="lrow-title">${esc(tradeOf(r.trade).name)} · ${esc(r.customer)} <span class="badge ${r.urgency === 'emergency' ? 'red' : 'amber'}">${({ emergency: 'דחוף', today: 'היום', this_week: 'השבוע', flexible: 'גמיש' })[r.urgency]}</span></div>
          <div class="lrow-sub">${esc(r.description)}</div>
          <div class="lrow-sub" style="color:var(--faint)">${esc(r.address)} · ${rel(r.created_at)} · תקציב ${r.budget_nis ? money(r.budget_nis) : 'לא צוין'}</div></div>
        <button class="btn btn-primary btn-sm" data-slot="${r.id}">שבץ תור</button></div>`).join('')
        : `<div class="empty"><b>אין פניות ממתינות</b>פניות חדשות בטווח יופיעו כאן.</div>`}
    </div></div>
  </div>`);
  $$('[data-slot]').forEach(b => b.addEventListener('click', () => {
    const r = d.waitlist.find(x => String(x.id) === b.dataset.slot);
    apptModal(d, { customerName: r.customer, address: r.address, trade: r.trade });
  }));
}

async function bizTeam() {
  const d = await api('/api/business');
  const today = isoDay(new Date());
  shell('#/biz/team', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">הצוות</div><div class="page-sub">${d.team.filter(t => t.active).length} פעילים מתוך ${d.team.length}</div></div></div>
    <div class="grid g3">
      ${d.team.map(t => {
        const load = d.appointments.filter(a => a.teamId === t.id && a.day === today && a.status !== 'cancelled').length;
        return `<div class="panel"><div class="panel-body">
          <div class="row">${avatar(t.name, tradeOf(t.trade).color)}<div style="flex:1"><div style="font-weight:900;font-size:13.5px">${esc(t.name)}</div>
            <div style="font-size:11px;color:var(--muted)">${esc(tradeOf(t.trade).name)} · ${esc(t.phone || '')}</div></div>
            <span class="badge ${t.active ? 'green' : 'gray'}">${t.active ? 'פעיל' : 'מושבת'}</span></div>
          <div class="divider"></div>
          <div class="kv"><dt>תורים היום</dt><dd>${load}</dd></div>
          <div class="kv"><dt>קיבולת במשבצת</dt><dd>${t.capacity}</dd></div>
          <div class="bar mt"><i style="width:${Math.min(load / Math.max(t.capacity, 1) * 100, 100)}%"></i></div>
        </div></div>`;
      }).join('')}
    </div>
  </div>`);
}

async function bizPage() {
  const d = await api('/api/business');
  const b = d.business;
  const url = location.origin + '/#/b/' + b.slug;
  shell('#/biz/page', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">העמוד הציבורי</div><div class="page-sub">/#/b/${esc(b.slug)} · זה מה שהלקוח רואה</div></div>
      <div class="page-actions"><button class="btn btn-ghost" id="copy">${ic('copy', 14)} העתק קישור</button>
        <a class="btn btn-primary" href="#/b/${esc(b.slug)}">${ic('pin', 14)} תצוגת לקוח</a></div></div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-body">
        <div class="hero" style="padding:20px">
          <h1 style="font-size:22px">${esc(b.name)}</h1><p>${esc(b.tagline || '')}</p>
          <div class="hero-meta"><span>★ ${b.rating} (${num(b.reviews_count)})</span><span>${d.team.filter(t => t.active).length} אנשי מקצוע</span><span>${esc(b.area || '')}</span></div>
          <div class="hero-cta"><span class="btn btn-primary">${ic('calendar', 14)} קבע תור</span><span class="btn btn-ghost">${ic('phone', 14)} ${esc(b.phone || '')}</span></div>
        </div>
        <div class="divider"></div>
        <div style="font-size:12px;font-weight:800;margin-bottom:8px">שירותים</div>
        <div class="grid g2" style="gap:8px">${d.services.map(s => `<div class="kv" style="border:1px solid var(--line);border-radius:9px;padding:9px 11px">
          <dt style="color:var(--ink);font-weight:700">${esc(s.name)}</dt><dd style="color:var(--accent)">${money(s.price_nis)}</dd></div>`).join('')}</div>
      </div></div>
      <div class="stack">
        <div class="panel"><div class="panel-head"><div class="panel-title">${ic('search', 15)} איך מגיעים אליכם</div></div>
          <div class="panel-body"><div class="kv"><dt>חיפוש באזור</dt><dd>46%</dd></div>
            <div class="kv"><dt>קישור ישיר</dt><dd>31%</dd></div><div class="kv"><dt>המלצות</dt><dd>23%</dd></div>
            <div class="divider"></div>
            <div style="font-size:11px;color:var(--muted);line-height:1.6">פרסום בתשלום הוא הוצאה שלכם — הפלטפורמה לא מוכרת פרסום. העמוד הזה כלול.</div></div></div>
        <div class="panel"><div class="panel-body">
          <div class="kv"><dt>יתרה</dt><dd>${money(d.balance)}</dd></div>
          <div class="kv"><dt>מחיר פנייה</dt><dd>${money(d.leadPrice)}</dd></div>
          <div class="kv"><dt>אישור תורים</dt><dd>${b.auto_confirm ? 'אוטומטי' : 'ידני'}</dd></div>
        </div></div>
      </div>
    </div>
  </div>`);
  $('#copy').addEventListener('click', () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('הקישור הועתק — ' + url);
  });
}

function apptModal(d, pre = {}) {
  const days = Array.from({ length: 14 }, (_, i) => isoDay(addDays(new Date(), i)));
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const services = pre.trade ? d.services.filter(s => s.trade === pre.trade) : d.services;
  const svcList = services.length ? services : d.services;
  modal({
    title: 'תור חדש ביומן',
    sub: 'התור נחסם אצל איש הצוות — אין כפילויות',
    body: `<form id="apptForm">
      <div class="grid g2" style="gap:10px">
        <div class="field"><label>איש צוות</label><select class="input" name="teamId">${d.team.filter(t => t.active).map(t => `<option value="${t.id}">${esc(t.name)} · ${esc(tradeOf(t.trade).name)}</option>`).join('')}</select></div>
        <div class="field"><label>שירות</label><select class="input" name="serviceId">${svcList.map(s => `<option value="${s.id}">${esc(s.name)} · ${money(s.price_nis)}</option>`).join('')}</select></div>
        <div class="field"><label>תאריך</label><select class="input" name="day">${days.map(day => `<option value="${day}" ${day === (pre.day || days[0]) ? 'selected' : ''}>${dayLabel(day)}</option>`).join('')}</select></div>
        <div class="field"><label>שעה</label><select class="input" name="start">${hours.map(h => `<option value="${h}" ${h === (pre.start || '09:00') ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>שם לקוח</label><input class="input" name="customerName" required value="${esc(pre.customerName || '')}"></div>
      <div class="grid g2" style="gap:10px">
        <div class="field"><label>טלפון</label><input class="input" name="phone" value="${esc(pre.phone || '')}"></div>
        <div class="field"><label>כתובת</label><input class="input" name="address" value="${esc(pre.address || '')}"></div>
      </div>
    </form>`,
    foot: `<button class="btn btn-primary" id="saveAppt">שמירת תור</button><button class="btn btn-ghost" data-close>ביטול</button>`,
    onMount(box) {
      box.querySelector('#saveAppt').addEventListener('click', async () => {
        const fd = Object.fromEntries(new FormData(box.querySelector('#apptForm')));
        try {
          await api('/api/business/appointments', { method: 'POST', body: { ...fd, teamId: Number(fd.teamId), serviceId: Number(fd.serviceId) } });
          closeModal(); toast('התור נקבע'); render();
        } catch (e) { toast(e.message, true); }
      });
    }
  });
}

function apptDetail(id, d) {
  const a = d.appointments.find(x => String(x.id) === String(id));
  if (!a) return;
  const st = { pending: ['ממתין', 'amber'], confirmed: ['מאושר', 'blue'], in_progress: ['בביצוע', 'lime'], done: ['הושלם', 'green'], no_show: ['לא הגיע', 'red'], cancelled: ['בוטל', 'gray'] };
  modal({
    title: `${a.serviceName} · ${a.customer}`,
    sub: `${dayLabel(a.day)} · ${a.start} · ${a.teamName}`,
    body: `<div class="kv"><dt>סטטוס</dt><dd><span class="badge ${st[a.status][1]}">${st[a.status][0]}</span></dd></div>
      <div class="kv"><dt>משך</dt><dd>${a.durationMin} דק׳</dd></div>
      <div class="kv"><dt>מחיר</dt><dd>${money(a.price)}</dd></div>
      <div class="kv"><dt>טלפון</dt><dd>${esc(a.phone || '—')}</dd></div>
      <div class="kv"><dt>כתובת</dt><dd>${esc(a.address || '—')}</dd></div>
      <div class="kv"><dt>מקור</dt><dd>${({ page: 'העמוד הציבורי', lead: 'פנייה', phone: 'טלפון' })[a.source] || a.source}</dd></div>`,
    foot: `${['confirmed', 'in_progress', 'done', 'cancelled'].map(s => `<button class="btn ${s === 'cancelled' ? 'btn-danger' : 'btn-ghost'} btn-sm" data-set="${s}">${st[s][0]}</button>`).join('')}<button class="btn btn-ghost btn-sm" data-close>סגירה</button>`,
    onMount(box) {
      $$('[data-set]', box).forEach(b => b.addEventListener('click', async () => {
        try {
          await api('/api/appointments/' + a.id, { method: 'PATCH', body: { status: b.dataset.set } });
          closeModal(); toast('הסטטוס עודכן'); render();
        } catch (e) { toast(e.message, true); }
      }));
    }
  });
}

/* ------------------------------- admin ------------------------------- */
async function adminOverview() {
  const d = await api('/api/admin/overview');
  const maxTrade = Math.max(...d.byTrade.map(t => t.n), 1);
  shell('#/admin', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">סקירת מערכת</div><div class="page-sub">מודל הכנסה: ${money(d.leadPrice)} לפנייה · סה״כ נגבה ${money(d.leadRevenue)}</div></div></div>
    <div class="grid g4 mb">
      <div class="kpi"><div class="kpi-label">הכנסות לפניות</div><div class="kpi-value">${money(d.leadRevenue)}</div><div class="kpi-delta up">${d.counts.offers} הצעות נשלחו</div></div>
      <div class="kpi"><div class="kpi-label">יתרות לקוחות</div><div class="kpi-value">${money(d.balances)}</div><div class="kpi-delta">נטען ${money(d.topups)}</div></div>
      <div class="kpi"><div class="kpi-label">בקשות פתוחות</div><div class="kpi-value">${d.counts.openRequests}</div><div class="kpi-delta">${d.counts.appointments} תורים</div></div>
      <div class="kpi"><div class="kpi-label">משתמשים</div><div class="kpi-value">${d.counts.users}</div><div class="kpi-delta">${d.counts.pros} בעלי מקצוע · ${d.counts.businesses} עסקים</div></div>
    </div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-head"><div class="panel-title">${ic('briefcase', 15)} בקשות לפי תחום</div></div>
        <div class="panel-body">${d.byTrade.map(t => `<div style="margin-bottom:10px">
          <div class="row" style="justify-content:space-between;font-size:11.5px;font-weight:700"><span>${esc(tradeOf(t.trade).name)}</span><span>${t.n}</span></div>
          <div class="bar" style="margin-top:4px"><i style="width:${t.n / maxTrade * 100}%"></i></div></div>`).join('')}</div></div>
      <div class="panel"><div class="panel-head"><div class="panel-title">${ic('wallet', 15)} תנועות אחרונות</div><a class="btn btn-ghost btn-sm" href="#/admin/ledger">הכל</a></div>
        <div class="panel-body flush" id="recent"></div></div>
    </div>
  </div>`);
  const { ledger } = await api('/api/admin/ledger');
  $('#recent').innerHTML = ledger.slice(0, 6).map(l => `<div class="lrow"><div class="lrow-main">
    <div class="lrow-title">${esc(l.owner_name || '')} <span class="badge ${l.reason === 'lead_charge' ? 'amber' : 'green'}">${l.reason === 'lead_charge' ? 'חיוב' : 'טעינה'}</span></div>
    <div class="lrow-sub">${esc(l.note || '')}</div></div>
    <span class="num" style="color:${l.delta_nis < 0 ? 'var(--red)' : 'var(--green)'}">${l.delta_nis > 0 ? '+' : ''}${money(l.delta_nis)}</span></div>`).join('');
}

async function adminPros() {
  const { pros } = await api('/api/admin/pros');
  shell('#/admin/pros', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">בעלי מקצוע</div><div class="page-sub">${pros.length} רשומות · ${pros.filter(p => p.status === 'active').length} פעילים</div></div></div>
    <div class="panel"><div class="panel-body flush"><div class="table-wrap" style="border:0"><table class="table">
      <thead><tr><th>שם</th><th>תחום</th><th>אזור</th><th>דירוג</th><th>יתרה</th><th>סטטוס</th></tr></thead>
      <tbody>${pros.map(p => `<tr>
        <td><b>${esc(p.name)}</b><br><span style="font-size:10.5px;color:var(--faint)">${esc(p.email)}</span></td>
        <td>${esc(tradeOf(p.trade).name)}</td><td>${esc(p.area)}</td>
        <td>★ ${p.rating} <span style="color:var(--faint)">(${num(p.reviews_count)})</span></td>
        <td class="num">${money(p.balance_nis)}</td>
        <td><select class="input" data-status="${p.user_id}" style="padding:5px 8px;font-size:11px;width:auto">
          ${['active', 'paused', 'blocked'].map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${({ active: 'פעיל', paused: 'מושהה', blocked: 'חסום' })[s]}</option>`).join('')}
        </select></td></tr>`).join('')}</tbody>
    </table></div></div></div>
  </div>`);
  $$('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
    try {
      await api('/api/admin/pros/' + sel.dataset.status, { method: 'PATCH', body: { status: sel.value } });
      toast('הסטטוס עודכן');
    } catch (e) { toast(e.message, true); }
  }));
}

async function adminLedger() {
  const { ledger } = await api('/api/admin/ledger');
  shell('#/admin/ledger', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">תשלומים וחיובים</div><div class="page-sub">${ledger.length} תנועות אחרונות</div></div></div>
    <div class="panel"><div class="panel-body flush"><div class="table-wrap" style="border:0"><table class="table">
      <thead><tr><th>תאריך</th><th>חשבון</th><th>סוג</th><th>פירוט</th><th>סכום</th><th>יתרה</th></tr></thead>
      <tbody>${ledger.map(l => `<tr><td>${esc(l.created_at.slice(0, 16))}</td><td>${esc(l.owner_name || '')}<br><span style="font-size:10px;color:var(--faint)">${l.owner_type === 'pro' ? 'בעל מקצוע' : 'עסק'}</span></td>
        <td><span class="badge ${l.reason === 'lead_charge' ? 'amber' : 'green'}">${({ topup: 'טעינה', lead_charge: 'חיוב פנייה', refund: 'זיכוי', adjustment: 'התאמה' })[l.reason]}</span></td>
        <td>${esc(l.note || '')}</td><td class="num" style="color:${l.delta_nis < 0 ? 'var(--red)' : 'var(--green)'}">${l.delta_nis > 0 ? '+' : ''}${money(l.delta_nis)}</td>
        <td class="num">${money(l.balance_after)}</td></tr>`).join('')}</tbody>
    </table></div></div></div>
  </div>`);
}

async function adminSettings() {
  const s = await api('/api/admin/settings');
  shell('#/admin/settings', `<div class="wrap">
    <div class="page-head"><div><div class="page-title">הגדרות פלטפורמה</div><div class="page-sub">מחיר פנייה משפיע על כל החיובים החדשים</div></div></div>
    <div class="grid g2">
      <div class="panel"><div class="panel-head"><div class="panel-title">${ic('wallet', 15)} מודל חיוב</div></div>
        <div class="panel-body">
          <div class="field"><label>מחיר פנייה (₪)</label><input class="input" id="leadPrice" type="number" min="10" max="1000" step="10" value="${s.leadPrice}"></div>
          <div class="field"><label>מינימום הצעות לבקשה</label><input class="input" id="minOffers" type="number" min="1" max="10" value="${s.minOffers}"></div>
          <button class="btn btn-primary" id="save">שמירה</button>
        </div></div>
      <div class="panel"><div class="panel-body">
        <div style="font-size:12px;font-weight:800;margin-bottom:8px">איך זה עובד</div>
        <div style="font-size:11.5px;color:var(--muted);line-height:1.7">בעל מקצוע טוען יתרה מראש. שליחת הצעה לפנייה מחייבת ${money(s.leadPrice)} מהיתרה, בניכוי אטומי עם רשומת תנועה. לקוח לא משלם על פרסום בקשה. פרסום בתשלום (Google/Meta) הוא הוצאה של בעל המקצוע.</div>
      </div></div>
    </div>
  </div>`);
  $('#save').addEventListener('click', async () => {
    try {
      const out = await api('/api/admin/settings', { method: 'PATCH', body: { leadPrice: Number($('#leadPrice').value), minOffers: Number($('#minOffers').value) } });
      state.leadPrice = out.leadPrice;
      toast('ההגדרות נשמרו'); render();
    } catch (e) { toast(e.message, true); }
  });
}

/* ------------------------------- boot ------------------------------- */
async function boot() {
  try {
    const [me, trades] = await Promise.all([api('/api/me'), api('/api/trades')]);
    state.user = me.user;
    state.trades = trades.trades;
    state.leadPrice = trades.leadPrice;
  } catch { /* offline shell */ }
  if (!state.user && !location.hash.startsWith('#/b')) location.hash = '#/login';
  render();
}

window.addEventListener('hashchange', render);
boot();
