/* ============================================================
   HANDIMANS — Contractor (business) mock data
   ============================================================ */
window.HM = window.HM || {};

HM.BUSINESS = {
  id:'b1', name:'ברק שירותי בית בע״מ', owner:'מיכאל ברק', trade:'plumbing',
  slug:'bark-home', tagline:'אינסטלציה, מיזוג ותיקוני בית — צוות אחד, אחריות אחת.',
  about:'עסק משפחתי מ-2011. ארבעה אנשי מקצוע בשטח, מחסן חלקים בתל אביב, אחריות שנה על עבודה.',
  rating:4.8, reviews:326, jobs:1840, since:'2011-05-01',
  phone:'03-555-0190', whatsapp:'052-3301-889', email:'office@bark-home.co.il',
  area:'תל אביב והמרכז', radius:12000, lat:32.0853, lng:34.7818,
  balance:2400, verified:true, insurance:'ביטוח אחריות מקצועית — בתוקף עד 03/2027',
  hours:{ sun:['08:00','18:00'], mon:['08:00','18:00'], tue:['08:00','18:00'], wed:['08:00','18:00'], thu:['08:00','18:00'], fri:['08:00','13:00'], sat:[] },
  slot:60, capacity:2, autoConfirm:true, deposit:0,
  pageViews:1840, pageCalls:96, pageBookings:41
};

HM.SERVICES = [
  { id:'s1', name:'תיקון נזילה',        price:450, duration:60,  trade:'plumbing' },
  { id:'s2', name:'פתיחת סתימה',        price:380, duration:45,  trade:'plumbing' },
  { id:'s3', name:'החלפת דוד שמש',      price:1200, duration:180, trade:'plumbing' },
  { id:'s4', name:'טיפול במזגן',         price:550, duration:90,  trade:'hvac' },
  { id:'s5', name:'בדיקת לוח חשמל',     price:400, duration:60,  trade:'electrical' },
  { id:'s6', name:'תיקוני בית כלליים',  price:300, duration:60,  trade:'handyman' }
];

HM.TEAM = [
  { id:'t1', name:'מיכאל ברק',   role:'בעלים · אינסטלציה', trade:'plumbing',   phone:'052-3301-889', active:true,  rating:4.9, jobs:640, capacity:6, color:'#f97316' },
  { id:'t2', name:'איתי פרידמן', role:'טכנאי מיזוג',       trade:'hvac',       phone:'058-4410-993', active:true,  rating:4.8, jobs:310, capacity:5, color:'#06b6d4' },
  { id:'t3', name:'אלכס גורביץ', role:'חשמלאי מוסמך',      trade:'electrical', phone:'052-7712-660', active:true,  rating:4.7, jobs:430, capacity:5, color:'#f59e0b' },
  { id:'t4', name:'מוחמד חסן',   role:'תיקוני בית',         trade:'handyman',   phone:'053-4402-118', active:true,  rating:4.8, jobs:380, capacity:6, color:'#7c3aed' },
  { id:'t5', name:'נועם בן דוד', role:'עוזר טכנאי',         trade:'plumbing',   phone:'054-8890-331', active:false, rating:4.5, jobs:140, capacity:4, color:'#64748b' }
];

HM.APPOINTMENTS = [
  { id:'ap1',  day:'2026-11-15', start:'09:00', teamId:'t1', customer:'דנה כהן',    phone:'052-3341-887', address:'פלורנטין 12, תל אביב',  serviceId:'s1', price:450, status:'done',      source:'page',  requestId:'r1' },
  { id:'ap2',  day:'2026-11-15', start:'11:00', teamId:'t3', customer:'עומר דגן',   phone:'058-2210-664', address:'בן יהודה 44, תל אביב',  serviceId:'s5', price:400, status:'done',      source:'lead',  requestId:'r4' },
  { id:'ap3',  day:'2026-11-16', start:'08:00', teamId:'t2', customer:'אורי מזרחי', phone:'054-9910-223', address:'רמת אביב ג׳ 8',        serviceId:'s4', price:550, status:'done',      source:'page',  requestId:'r2' },
  { id:'ap4',  day:'2026-11-16', start:'13:00', teamId:'t4', customer:'יעל בן עמי', phone:'050-4412-990', address:'נווה צדק 21',           serviceId:'s6', price:300, status:'done',      source:'phone', requestId:'r3' },
  { id:'ap5',  day:'2026-11-17', start:'10:00', teamId:'t1', customer:'רונית שלום', phone:'052-8890-117', address:'רמת גן, הרצל 90',       serviceId:'s2', price:380, status:'done',      source:'page',  requestId:'r8' },
  { id:'ap6',  day:'2026-11-17', start:'15:00', teamId:'t3', customer:'דנה כהן',    phone:'052-3341-887', address:'פלורנטין 12, תל אביב',  serviceId:'s5', price:400, status:'no_show',   source:'lead',  requestId:'r9' },
  { id:'ap7',  day:'2026-11-18', start:'09:00', teamId:'t1', customer:'דנה כהן',    phone:'052-3341-887', address:'פלורנטין 12, תל אביב',  serviceId:'s1', price:480, status:'in_progress', source:'lead', requestId:'r1' },
  { id:'ap8',  day:'2026-11-18', start:'09:00', teamId:'t2', customer:'אורי מזרחי', phone:'054-9910-223', address:'רמת אביב ג׳ 8',        serviceId:'s4', price:550, status:'confirmed', source:'page',  requestId:'r10' },
  { id:'ap9',  day:'2026-11-18', start:'11:00', teamId:'t3', customer:'עומר דגן',   phone:'058-2210-664', address:'בן יהודה 44, תל אביב',  serviceId:'s5', price:450, status:'confirmed', source:'lead',  requestId:'r4' },
  { id:'ap10', day:'2026-11-18', start:'13:00', teamId:'t4', customer:'יעל בן עמי', phone:'050-4412-990', address:'נווה צדק 21',           serviceId:'s6', price:320, status:'pending',   source:'page',  requestId:'r3' },
  { id:'ap11', day:'2026-11-18', start:'16:00', teamId:'t1', customer:'רונית שלום', phone:'052-8890-117', address:'רמת גן, הרצל 90',       serviceId:'s2', price:350, status:'confirmed', source:'phone', requestId:'r8' },
  { id:'ap12', day:'2026-11-19', start:'08:00', teamId:'t1', customer:'אורי מזרחי', phone:'054-9910-223', address:'רמת אביב ג׳ 8',        serviceId:'s3', price:1200, status:'confirmed', source:'page', requestId:'r7' },
  { id:'ap13', day:'2026-11-19', start:'10:00', teamId:'t2', customer:'דנה כהן',    phone:'052-3341-887', address:'פלורנטין 12, תל אביב',  serviceId:'s4', price:550, status:'pending',   source:'page',  requestId:'r10' },
  { id:'ap14', day:'2026-11-19', start:'14:00', teamId:'t4', customer:'עומר דגן',   phone:'058-2210-664', address:'בן יהודה 44, תל אביב',  serviceId:'s6', price:300, status:'confirmed', source:'lead',  requestId:'r12' },
  { id:'ap15', day:'2026-11-20', start:'09:00', teamId:'t3', customer:'רונית שלום', phone:'052-8890-117', address:'רמת גן, הרצל 90',       serviceId:'s5', price:400, status:'confirmed', source:'page',  requestId:'r9' },
  { id:'ap16', day:'2026-11-20', start:'11:00', teamId:'t1', customer:'יעל בן עמי', phone:'050-4412-990', address:'נווה צדק 21',           serviceId:'s1', price:450, status:'pending',   source:'page',  requestId:'r12' },
  { id:'ap17', day:'2026-11-21', start:'09:00', teamId:'t4', customer:'דנה כהן',    phone:'052-3341-887', address:'פלורנטין 12, תל אביב',  serviceId:'s6', price:300, status:'confirmed', source:'phone', requestId:'r3' }
];

HM.WAITLIST = [
  { id:'w1', customer:'רונית שלום', phone:'052-8890-117', serviceId:'s2', urgency:'היום',   since:'2026-11-18T06:40:00', note:'אסלה סתומה, ניסו פומפה', requestId:'r8' },
  { id:'w2', customer:'עומר דגן',   phone:'058-2210-664', serviceId:'s4', urgency:'היום',   since:'2026-11-18T07:55:00', note:'מזגן מטפטף לסלון', requestId:'r10' },
  { id:'w3', customer:'אורי מזרחי', phone:'054-9910-223', serviceId:'s3', urgency:'השבוע',  since:'2026-11-17T18:20:00', note:'דוד שמש מטפטף על הגג', requestId:'r7' },
  { id:'w4', customer:'יעל בן עמי', phone:'050-4412-990', serviceId:'s6', urgency:'השבוע',  since:'2026-11-18T06:40:00', note:'החלפת ציר לדלת כניסה', requestId:'r12' }
];

HM.BIZ_LEDGER = [
  { id:'bl1', delta:2400, reason:'purchase',    note:'טעינת יתרה — 24 פניות', createdAt:'2026-11-01T09:00:00', balance:2400 },
  { id:'bl2', delta:-100, reason:'lead_charge', note:'פנייה — נזילה בפלורנטין', createdAt:'2026-11-18T07:52:00', balance:2400 }
];
