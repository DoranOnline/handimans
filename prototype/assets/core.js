/* ============================================================
   HANDIMANS — Core: icons, helpers, store, router, UI primitives
   ============================================================ */
window.HM = window.HM || {};

/* ---------------- Icons ---------------- */
HM.ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.8 2.8 0 0 1-4-4L15.7 7.3"/><path d="M14.7 6.3 17 4a4 4 0 0 1 3 6.9"/>',
  zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  wind:'<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  hammer:'<path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 6.4 21 3l-3-3-3.4 3.4"/><path d="m14 7 3 3"/>',
  brush:'<path d="M9.06 11.9 3 18v3h3l6.1-6.06"/><path d="M14 4.5 19.5 10 21 8.5 15.5 3 14 4.5Z"/><path d="m11 9 4 4"/>',
  tool:'<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.8 2.8 0 0 1-4-4L15.7 7.3"/>',
  key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8"/><path d="m16 4 4 4"/><path d="m14 6 4 4"/>',
  sparkles:'<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9L18 15Z"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-9 17Z"/><path d="M4 21c2-6 6-9 11-11"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  map:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  arrowLeft:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  shieldCheck:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  alertCircle:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m21 15-5-5L5 21"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  message:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  creditCard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 14 3-4 3 3 4-6"/>',
  trending:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 8.9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.5a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  filter:'<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  external:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
  briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="m8.2 13.9-1.7 7.6L12 18.5l5.5 3-1.7-7.6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play:'<path d="m5 3 14 9-14 9V3Z"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  helpCircle:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  route:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h5a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3"/>',
  zapOff:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/><path d="m2 2 20 20"/>',
  package:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5"/><path d="M12 22V12"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'
};

HM.icon = function(name, size, extra){
  const p = HM.ICONS[name] || HM.ICONS.info;
  return `<svg width="${size||16}" height="${size||16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra||''}>${p}</svg>`;
};

/* ---------------- Formatting ---------------- */
HM.nf = new Intl.NumberFormat('he-IL');
HM.fmt = {
  money(n, dec){
    if (n === null || n === undefined) return '—';
    const v = dec ? Number(n).toFixed(dec) : Math.round(n);
    return '₪' + HM.nf.format(v);
  },
  num(n){ return HM.nf.format(n || 0); },
  dist(m){ return m < 1000 ? Math.round(m) + ' מ׳' : (m/1000).toFixed(1) + ' ק״מ'; },
  pct(v, dec){ return (v*100).toFixed(dec === undefined ? 0 : dec) + '%'; },
  date(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' });
  },
  dateLong(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day:'numeric', month:'long' });
  },
  time(iso){
    const d = new Date(iso);
    return d.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' });
  },
  dt(iso){ return HM.fmt.date(iso) + ' · ' + HM.fmt.time(iso); },
  rel(iso){
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (diff < 1) return 'עכשיו';
    if (diff < 60) return 'לפני ' + Math.round(diff) + ' דק׳';
    if (diff < 1440) return 'לפני ' + Math.round(diff/60) + ' שעות';
    if (diff < 10080) return 'לפני ' + Math.round(diff/1440) + ' ימים';
    return HM.fmt.date(iso);
  },
  initials(name){
    return (name || '?').trim().split(/\s+/).slice(0,2).map(w => w.charAt(0)).join('');
  },
  phone(p){ return p || '—'; }
};

HM.trade = function(id){ return HM.TRADES.find(t => t.id === id) || { name:id, color:'#64748b' }; };
HM.pro = function(id){ return HM.PROS.find(p => p.id === id); };
HM.request = function(id){ return HM.REQUESTS.find(r => r.id === id); };
HM.job = function(id){ return HM.JOBS.find(j => j.id === id); };

HM.haversine = function(a, b){
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/* ---------------- Store ---------------- */
HM.db = {
  pros: HM.PROS,
  customers: HM.CUSTOMERS,
  requests: HM.REQUESTS,
  offers: HM.OFFERS,
  jobs: HM.JOBS,
  reviews: HM.REVIEWS,
  disputes: HM.DISPUTES,
  ledger: HM.LEDGER,
  audit: HM.AUDIT,
  threads: HM.THREADS,
  messages: HM.MESSAGES,
  settings: HM.SETTINGS,
  business: HM.BUSINESS,
  services: HM.SERVICES,
  team: HM.TEAM,
  appointments: HM.APPOINTMENTS,
  waitlist: HM.WAITLIST,
  bizLedger: HM.BIZ_LEDGER
};

HM.state = {
  role:'customer',
  trade:'all',
  radius:8,
  urgency:'today',
  sort:'score',
  job:{ lat:32.0853, lng:34.7818 },
  selected:null,
  activeThread:'t1',
  proId:1,
  customerId:'c1',
  proTab:'dashboard',
  adminTab:'overview',
  contractorTab:'dashboard',
  contractorDay:'2026-11-18',
  customerTab:'search',
  requestFilter:'all'
};

let seq = 1000;
HM.uid = function(prefix){ return (prefix || 'x') + (++seq); };

HM.addAudit = function(actor, action, target, kind){
  HM.db.audit.unshift({ id:HM.uid('a'), actor, action, target, at:new Date().toISOString(), kind:kind||'system' });
};

HM.chargeLead = function(proId, amount, note){
  const p = HM.pro(proId);
  if (!p) return false;
  if (p.balance < amount) return false;
  p.balance -= amount;
  HM.db.ledger.unshift({
    id:HM.uid('l'), proId, delta:-amount, reason:'lead_charge', note,
    createdAt:new Date().toISOString(), balance:p.balance
  });
  return true;
};

HM.topUp = function(proId, amount, note){
  const p = HM.pro(proId);
  if (!p) return;
  p.balance += amount;
  HM.db.ledger.unshift({
    id:HM.uid('l'), proId, delta:amount, reason:'purchase', note,
    createdAt:new Date().toISOString(), balance:p.balance
  });
};

HM.addMessage = function(threadId, from, body){
  const t = HM.db.threads.find(x => x.id === threadId);
  if (!t) return;
  HM.db.messages[threadId] = HM.db.messages[threadId] || [];
  HM.db.messages[threadId].push({ id:HM.uid('m'), from, body, at:new Date().toISOString() });
  t.lastAt = new Date().toISOString();
  if (from === 'them') t.unread = (t.unread || 0) + 1;
};

/* ---------------- UI primitives ---------------- */
HM.esc = function(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};

HM.avatar = function(name, color, size){
  const cls = size || 'md';
  return `<div class="avatar ${cls}" style="background:${color || '#475569'}">${HM.esc(HM.fmt.initials(name))}</div>`;
};

HM.badge = function(text, tone, dot){
  return `<span class="badge ${tone || 'gray'}">${dot ? '<span class="dot"></span>' : ''}${HM.esc(text)}</span>`;
};

HM.stars = function(rating, count){
  return `<span class="stars">★ ${Number(rating).toFixed(1)}${count !== undefined ? ` <em>(${count})</em>` : ''}</span>`;
};

HM.kpi = function(label, value, delta, dir, spark){
  const d = delta ? `<div class="kpi-delta ${dir || 'flat'}">${dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'} ${delta}</div>` : '';
  return `<div class="kpi">
    <div class="kpi-label">${HM.esc(label)}</div>
    <div class="kpi-value">${value}</div>
    ${d}
    ${spark ? `<div class="kpi-spark">${spark}</div>` : ''}
  </div>`;
};

HM.spark = function(values, color, w, h){
  w = w || 200; h = h || 34;
  const max = Math.max(...values), min = Math.min(...values);
  const span = (max - min) || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${id})"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
};

HM.bars = function(values, labels, color, h){
  h = h || 120;
  const max = Math.max(...values) || 1;
  return `<div style="display:flex;align-items:flex-end;gap:6px;height:${h}px">
    ${values.map((v, i) => {
      const ph = Math.max(4, (v / max) * (h - 22));
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0">
        <div style="width:100%;max-width:34px;height:${ph}px;background:${color};border-radius:5px 5px 2px 2px;opacity:${0.45 + (v/max)*0.55}" title="${v}"></div>
        <span style="font-size:9px;color:#94a3b8;font-weight:700;white-space:nowrap">${labels ? labels[i] : ''}</span>
      </div>`;
    }).join('')}
  </div>`;
};

HM.donut = function(segments, size, thickness){
  size = size || 120; thickness = thickness || 14;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const arcs = segments.map(s => {
    const len = (s.value / total) * c;
    const el = `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}"
      stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size/2} ${size/2})" stroke-linecap="butt"/>`;
    offset += len;
    return el;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${arcs}</svg>`;
};

HM.progress = function(value, tone){
  return `<div class="progress ${tone||''}"><i style="width:${Math.min(100, Math.max(0, value*100))}%"></i></div>`;
};

HM.empty = function(icon, title, text, action){
  return `<div class="empty">
    <div class="empty-icon">${HM.icon(icon, 24)}</div>
    <h3>${HM.esc(title)}</h3>
    <p>${HM.esc(text)}</p>
    ${action || ''}
  </div>`;
};

/* ---------------- Toast ---------------- */
let toastTimer;
HM.toast = function(msg, kind){
  let el = document.getElementById('toast');
  if (!el){
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg><span id="toastText"></span>`;
    document.body.appendChild(el);
  }
  el.classList.toggle('warn', kind === 'warn');
  el.querySelector('#toastText').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
};

/* ---------------- Modal ---------------- */
HM.modal = function(opts){
  const overlay = document.getElementById('modalOverlay');
  const box = overlay.querySelector('.modal');
  box.className = 'modal' + (opts.size ? ' ' + opts.size : '');
  box.innerHTML = `
    <div class="modal-head">
      <div>
        <h2>${opts.title || ''}</h2>
        ${opts.sub ? `<p>${opts.sub}</p>` : ''}
      </div>
      <button class="x" data-close aria-label="סגירה">${HM.icon('x', 16)}</button>
    </div>
    <div class="modal-body">${opts.body || ''}</div>
    ${opts.foot ? `<div class="modal-foot">${opts.foot}</div>` : ''}
  `;
  overlay.classList.add('open');
  box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', HM.closeModal));
  if (opts.onMount) opts.onMount(box);
  return box;
};

HM.closeModal = function(){
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
};

/* ---------------- Router ---------------- */
HM.parseHash = function(){
  const h = (location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  return { role: parts[0] || 'customer', view: parts[1] || 'search' };
};

HM.go = function(path){
  if (location.hash === '#/' + path) HM.render();
  else location.hash = '#/' + path;
};

HM.render = function(){
  const { role, view } = HM.parseHash();
  HM.state.role = role;
  document.querySelectorAll('.roleswitch button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.role === role));
  });
  const root = document.getElementById('view');
  root.innerHTML = '';
  root.className = 'workspace';
  if (role === 'pro') HM.views.pro(root, view);
  else if (role === 'admin') HM.views.admin(root, view);
  else if (role === 'contractor') HM.views.contractor(root, view);
  else HM.views.customer(root, view);
  HM.syncChrome();
};

HM.syncChrome = function(){
  const badge = document.getElementById('notifCount');
  const unread = HM.db.threads.reduce((s, t) => s + (t.unread || 0), 0);
  if (badge){
    badge.textContent = unread;
    badge.style.display = unread ? 'grid' : 'none';
  }
};

HM.views = {};

window.addEventListener('hashchange', HM.render);
