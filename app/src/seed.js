/* HANDIMANS — demo seed (idempotent; `node src/seed.js --force` wipes and reseeds) */
import { db, get, run, setSetting, isSeeded, tx } from './db.js';
import { hashPassword } from './auth.js';

export const TRADES = [
  { id: 'plumbing',  name: 'אינסטלציה',  color: '#38bdf8', icon: 'wrench' },
  { id: 'electrical', name: 'חשמל',      color: '#fbbf24', icon: 'zap' },
  { id: 'hvac',      name: 'מיזוג אוויר', color: '#22d3ee', icon: 'wind' },
  { id: 'handyman',  name: 'תיקוני בית',  color: '#c2ff3d', icon: 'hammer' },
  { id: 'painting',  name: 'צביעה',       color: '#a78bfa', icon: 'brush' },
  { id: 'locksmith', name: 'מנעולנות',    color: '#fb7185', icon: 'key' },
  { id: 'cleaning',  name: 'ניקיון',      color: '#4ade80', icon: 'sparkles' },
  { id: 'moving',    name: 'הובלות',      color: '#f97316', icon: 'package' }
];

const PASSWORD = 'demo1234';
const hash = () => hashPassword(PASSWORD);

function dayOffset(n) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function wipe() {
  for (const t of ['reviews', 'appointments', 'ledger', 'offers', 'requests', 'services', 'team_members', 'businesses', 'pros', 'sessions', 'users', 'settings']) {
    db.exec(`DELETE FROM ${t}`);
  }
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','businesses','team_members','services','requests','offers','ledger','appointments','reviews')");
}

export function seed({ force = false } = {}) {
  if (isSeeded() && !force) return false;
  tx(() => {
    if (force) wipe();

    const addUser = (role, name, email, phone) =>
      run('INSERT INTO users(role, name, email, phone, password_hash) VALUES(?,?,?,?,?)', role, name, email, phone, hash()).lastInsertRowid;

    const customerId = addUser('customer', 'דנה כהן', 'customer@demo.co.il', '052-3341-887');
    const proUserId = addUser('pro', 'יוסי לוי', 'pro@demo.co.il', '052-7712-660');
    const bizUserId = addUser('contractor', 'מיכאל ברק', 'biz@demo.co.il', '052-3301-889');
    addUser('admin', 'מנהל מערכת', 'admin@demo.co.il', '050-000-0000');

    const extraCustomers = [
      ['אורי מזרחי', 'uri@demo.co.il', '054-9910-223'],
      ['יעל בן עמי', 'yael@demo.co.il', '050-4412-990'],
      ['עומר דגן', 'omer@demo.co.il', '058-2210-664'],
      ['רונית שלום', 'ronit@demo.co.il', '052-8890-117']
    ].map(([name, email, phone]) => addUser('customer', name, email, phone));

    run(`INSERT INTO pros(user_id, trade, area, lat, lng, radius_m, price_min, price_max, callout, years, verified,
          rating, reviews_count, jobs_count, resp_min, avail, balance_nis, status, bio)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      proUserId, 'plumbing', 'פלורנטין, תל אביב', 32.0561, 34.7698, 9000, 350, 750, 180, 9, 1,
      4.8, 214, 640, 12, 'now', 500, 'active', 'אינסטלציה ותיקוני נזילות. זמין היום, מגיע עם ציוד מלא.');

    const pros = [
      ['איתי פרידמן', 'hvac', 'רמת אביב, תל אביב', 32.1122, 34.8010, 12000, 400, 900, 200, 7, 1, 4.9, 168, 410, 18, 'now', 300],
      ['אלכס גורביץ', 'electrical', 'הצפון הישן, תל אביב', 32.0921, 34.7742, 10000, 300, 800, 150, 12, 1, 4.7, 302, 880, 25, 'soon', 800],
      ['מוחמד חסן', 'handyman', 'נווה צדק, תל אביב', 32.0605, 34.7650, 7000, 200, 500, 120, 5, 1, 4.8, 96, 240, 20, 'now', 200],
      ['נועם בן דוד', 'painting', 'רמת גן', 32.0700, 34.8240, 15000, 2500, 9000, 0, 14, 1, 4.6, 74, 190, 90, 'later', 0],
      ['שרה מזרחי', 'locksmith', 'פלורנטין, תל אביב', 32.0558, 34.7702, 20000, 250, 600, 200, 6, 1, 4.9, 411, 1200, 9, 'now', 600],
      ['וליד אבו סאלח', 'cleaning', 'יפו', 32.0500, 34.7500, 9000, 180, 450, 0, 4, 0, 4.5, 38, 120, 45, 'soon', 100],
      ['דני קופרמן', 'moving', 'תל אביב והמרכז', 32.0853, 34.7818, 25000, 600, 2400, 0, 11, 1, 4.7, 129, 380, 60, 'later', 0]
    ];
    for (const p of pros) {
      const uid = addUser('pro', p[0], `${p[1]}${Math.floor(Math.random() * 900 + 100)}@demo.co.il`, '050-000-0000');
      run(`INSERT INTO pros(user_id, trade, area, lat, lng, radius_m, price_min, price_max, callout, years, verified,
            rating, reviews_count, jobs_count, resp_min, avail, balance_nis, status)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        uid, p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11], p[12], p[13], p[14], p[15], p[16], 'active');
    }

    const bizId = run(`INSERT INTO businesses(owner_user_id, name, slug, trade, tagline, about, phone, area, lat, lng,
        radius_m, rating, reviews_count, capacity, slot_min, auto_confirm, balance_nis, verified)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      bizUserId, 'ברק שירותי בית בע״מ', 'bark-home', 'plumbing',
      'אינסטלציה, מיזוג ותיקוני בית — צוות אחד, אחריות אחת.',
      'עסק משפחתי מ-2011. ארבעה אנשי מקצוע בשטח, מחסן חלקים בתל אביב, אחריות שנה על עבודה.',
      '03-555-0190', 'תל אביב והמרכז', 32.0853, 34.7818, 12000, 4.8, 326, 2, 60, 1, 2400, 1).lastInsertRowid;

    const team = [
      ['מיכאל ברק', 'plumbing', '052-3301-889', 1, 6],
      ['איתי פרידמן', 'hvac', '058-4410-993', 1, 5],
      ['אלכס גורביץ', 'electrical', '052-7712-660', 1, 5],
      ['מוחמד חסן', 'handyman', '053-4402-118', 1, 6],
      ['נועם בן דוד', 'plumbing', '054-8890-331', 0, 4]
    ].map(([name, trade, phone, active, capacity]) =>
      run('INSERT INTO team_members(business_id, name, trade, phone, active, capacity) VALUES(?,?,?,?,?,?)',
        bizId, name, trade, phone, active, capacity).lastInsertRowid);

    const services = [
      ['תיקון נזילה', 450, 60, 'plumbing'],
      ['פתיחת סתימה', 380, 45, 'plumbing'],
      ['החלפת דוד שמש', 1200, 180, 'plumbing'],
      ['טיפול במזגן', 550, 90, 'hvac'],
      ['בדיקת לוח חשמל', 400, 60, 'electrical'],
      ['תיקוני בית כלליים', 300, 60, 'handyman']
    ].map(([name, price, dur, trade]) =>
      run('INSERT INTO services(business_id, name, price_nis, duration_min, trade) VALUES(?,?,?,?,?)',
        bizId, name, price, dur, trade).lastInsertRowid);

    run(`INSERT INTO ledger(owner_type, owner_id, delta_nis, reason, note, balance_after, created_at)
         VALUES('business', ?, 2400, 'topup', 'טעינת יתרה — 24 פניות', 2400, datetime('now','-18 days'))`, bizId);
    run(`INSERT INTO ledger(owner_type, owner_id, delta_nis, reason, note, balance_after, created_at)
         VALUES('pro', ?, 500, 'topup', 'טעינת יתרה — 5 פניות', 500, datetime('now','-9 days'))`, proUserId);

    const reqs = [
      [customerId, 'plumbing', 'פלורנטין 12, תל אביב', 32.0561, 34.7698, 'emergency', 'נזילה מתחת לכיור במטבח, מים מטפטפים מהצינור כבר מאתמול.', 600, 'open'],
      [extraCustomers[0], 'hvac', 'רמת אביב ג׳ 8, תל אביב', 32.1122, 34.8010, 'today', 'מזגן בסלון לא מקרר ועושה רעש חזק.', 900, 'open'],
      [extraCustomers[1], 'handyman', 'נווה צדק 21, תל אביב', 32.0605, 34.7650, 'this_week', 'תליית 4 מדפים ומראה גדולה, צריך מקדחה טובה.', 400, 'open'],
      [extraCustomers[2], 'electrical', 'בן יהודה 44, תל אביב', 32.0921, 34.7742, 'today', 'שקע במטבח מפסיק לעבוד, יש ריח חריכה קל.', 500, 'open'],
      [extraCustomers[3], 'plumbing', 'הרצל 90, רמת גן', 32.0680, 34.8210, 'this_week', 'אסלה סתומה בשירותי האורחים, פומפה לא עזרה.', 350, 'open'],
      [extraCustomers[0], 'plumbing', 'רמת אביב ג׳ 8, תל אביב', 32.1100, 34.8000, 'flexible', 'דוד שמש מטפטף על הגג, יש שלולית ליד המעקה.', 700, 'open'],
      [customerId, 'locksmith', 'פלורנטין 12, תל אביב', 32.0558, 34.7702, 'emergency', 'ננעלנו בחוץ, המפתח נשבר במנעול.', 450, 'completed']
    ];
    const reqIds = reqs.map(r => run(`INSERT INTO requests(customer_id, trade, address, lat, lng, urgency, description, budget_nis, status, created_at)
        VALUES(?,?,?,?,?,?,?,?,?, datetime('now', ?))`,
      r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], `-${Math.floor(Math.random() * 40) + 2} minutes`).lastInsertRowid);

    run(`INSERT INTO offers(request_id, pro_user_id, price_nis, eta_min, note, status)
         VALUES(?,?,?,?,?, 'sent')`, reqIds[0], proUserId, 520, 45, 'מגיע עם ציוד, מחיר כולל חלקים בסיסיים.');

    const appts = [
      [team[0], services[0], customerId, 'דנה כהן', '052-3341-887', 'פלורנטין 12, תל אביב', dayOffset(0), '09:00', 60, 450, 'confirmed', 'page'],
      [team[1], services[3], extraCustomers[0], 'אורי מזרחי', '054-9910-223', 'רמת אביב ג׳ 8', dayOffset(0), '09:00', 90, 550, 'confirmed', 'page'],
      [team[2], services[4], extraCustomers[2], 'עומר דגן', '058-2210-664', 'בן יהודה 44, תל אביב', dayOffset(0), '11:00', 60, 450, 'pending', 'lead'],
      [team[3], services[5], extraCustomers[1], 'יעל בן עמי', '050-4412-990', 'נווה צדק 21', dayOffset(0), '13:00', 60, 320, 'confirmed', 'page'],
      [team[0], services[1], extraCustomers[3], 'רונית שלום', '052-8890-117', 'הרצל 90, רמת גן', dayOffset(0), '16:00', 45, 350, 'confirmed', 'phone'],
      [team[0], services[2], extraCustomers[0], 'אורי מזרחי', '054-9910-223', 'רמת אביב ג׳ 8', dayOffset(1), '08:00', 180, 1200, 'confirmed', 'page'],
      [team[1], services[3], customerId, 'דנה כהן', '052-3341-887', 'פלורנטין 12, תל אביב', dayOffset(1), '10:00', 90, 550, 'pending', 'page'],
      [team[3], services[5], extraCustomers[2], 'עומר דגן', '058-2210-664', 'בן יהודה 44, תל אביב', dayOffset(2), '14:00', 60, 300, 'confirmed', 'lead'],
      [team[2], services[4], extraCustomers[3], 'רונית שלום', '052-8890-117', 'הרצל 90, רמת גן', dayOffset(2), '09:00', 60, 400, 'confirmed', 'page'],
      [team[0], services[0], extraCustomers[1], 'יעל בן עמי', '050-4412-990', 'נווה צדק 21', dayOffset(3), '11:00', 60, 450, 'pending', 'page']
    ];
    for (const a of appts) {
      run(`INSERT INTO appointments(business_id, team_id, service_id, customer_id, customer_name, phone, address,
            day, start, duration_min, price_nis, status, source)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, bizId, ...a);
    }

    run(`INSERT INTO reviews(subject_type, subject_id, author, rating, text) VALUES
      ('business', ?, 'דנה כהן', 5, 'הגיעו בזמן, תיקנו נזילה שהציקה שבועות.'),
      ('business', ?, 'אורי מזרחי', 5, 'מחיר הוגן ואחריות אמיתית.'),
      ('business', ?, 'יעל בן עמי', 4, 'עבודה טובה, קצת איחור אבל עדכנו מראש.')`, bizId, bizId, bizId);

    setSetting('lead_price_nis', 100);
    setSetting('min_offers', 3);
    setSetting('platform_name', 'HANDIMANS');
  });
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const force = process.argv.includes('--force');
  const created = seed({ force });
  console.log(created ? 'seed: done' : 'seed: skipped (already seeded)');
  console.log('demo login: customer@demo.co.il / pro@demo.co.il / biz@demo.co.il / admin@demo.co.il — password', PASSWORD);
}
