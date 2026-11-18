/* ============================================================
   HANDIMANS — Mock data layer
   ============================================================ */
window.HM = window.HM || {};

HM.TRADES = [
  { id:'all',        name:'הכול',        color:'#0b1b33', icon:'grid' },
  { id:'plumbing',   name:'אינסטלציה',   color:'#2563eb', icon:'wrench' },
  { id:'electrical', name:'חשמל',        color:'#f59e0b', icon:'zap' },
  { id:'hvac',       name:'מיזוג',       color:'#06b6d4', icon:'wind' },
  { id:'carpentry',  name:'נגרות',       color:'#a16207', icon:'hammer' },
  { id:'painting',   name:'צביעה',       color:'#db2777', icon:'brush' },
  { id:'handyman',   name:'תיקוני בית',  color:'#7c3aed', icon:'tool' },
  { id:'locksmith',  name:'מנעולנות',    color:'#475569', icon:'key' },
  { id:'cleaning',   name:'ניקיון',      color:'#0d9488', icon:'sparkles' },
  { id:'gardening',  name:'גינון',       color:'#16a34a', icon:'leaf' }
];

HM.AVAIL = {
  now:   { label:'פנוי עכשיו', cls:'green' },
  soon:  { label:'פנוי מחר',   cls:'blue' },
  later: { label:'פנוי השבוע', cls:'gray' }
};

HM.PROS = [
  { id:1,  name:'יוסי לוי',     trade:'plumbing',   rating:4.9, reviews:214, price:[350,900],  callout:150, lat:32.0735, lng:34.7790, avail:'now',   resp:9,   jobs:640,  verified:true,  years:18, area:'פלורנטין',      phone:'052-4412-881', status:'active',  insurance:true,  balance:1100, acceptance:.82, completion:.97, earnings:48200, joined:'2024-03-11', docs:'approved' },
  { id:2,  name:'אבי כהן',      trade:'electrical', rating:4.8, reviews:167, price:[280,750],  callout:120, lat:32.0853, lng:34.7818, avail:'now',   resp:12,  jobs:520,  verified:true,  years:22, area:'לב תל אביב',    phone:'054-7781-204', status:'active',  insurance:true,  balance:600,  acceptance:.76, completion:.95, earnings:39600, joined:'2024-05-02', docs:'approved' },
  { id:3,  name:'מיכאל ברק',    trade:'hvac',       rating:4.7, reviews:98,  price:[400,1200], callout:200, lat:32.1093, lng:34.8055, avail:'soon',  resp:25,  jobs:310,  verified:true,  years:11, area:'רמת אביב',      phone:'050-3320-119', status:'active',  insurance:true,  balance:400,  acceptance:.71, completion:.93, earnings:31400, joined:'2024-07-19', docs:'approved' },
  { id:4,  name:'שרון אזולאי',  trade:'handyman',   rating:4.9, reviews:301, price:[200,600],  callout:100, lat:32.0550, lng:34.7620, avail:'now',   resp:7,   jobs:890,  verified:true,  years:9,  area:'נווה צדק',      phone:'053-9910-447', status:'active',  insurance:true,  balance:2100, acceptance:.88, completion:.98, earnings:52700, joined:'2024-02-04', docs:'approved' },
  { id:5,  name:'דוד מזרחי',    trade:'carpentry',  rating:4.6, reviews:74,  price:[500,2500], callout:250, lat:32.0410, lng:34.7740, avail:'later', resp:48,  jobs:180,  verified:true,  years:25, area:'יפו',           phone:'052-6640-882', status:'active',  insurance:true,  balance:100,  acceptance:.62, completion:.91, earnings:26800, joined:'2024-09-08', docs:'approved' },
  { id:6,  name:'איתי פרידמן',  trade:'painting',   rating:4.8, reviews:132, price:[450,1800], callout:0,   lat:32.0950, lng:34.7750, avail:'soon',  resp:31,  jobs:260,  verified:true,  years:14, area:'הצפון הישן',   phone:'058-4410-993', status:'active',  insurance:true,  balance:500,  acceptance:.74, completion:.94, earnings:28900, joined:'2024-06-21', docs:'approved' },
  { id:7,  name:'רועי שפירא',   trade:'locksmith',  rating:4.9, reviews:412, price:[250,700],  callout:180, lat:32.0670, lng:34.8240, avail:'now',   resp:5,   jobs:1200, verified:true,  years:16, area:'הדר יוסף',      phone:'050-2211-774', status:'active',  insurance:true,  balance:3400, acceptance:.91, completion:.99, earnings:71400, joined:'2024-01-15', docs:'approved' },
  { id:8,  name:'נועם בן דוד',  trade:'plumbing',   rating:4.5, reviews:56,  price:[300,800],  callout:130, lat:32.1240, lng:34.7880, avail:'later', resp:55,  jobs:140,  verified:false, years:6,  area:'רמת גן',        phone:'054-8890-331', status:'pending', insurance:false, balance:0,   acceptance:.55, completion:.88, earnings:9400,  joined:'2025-01-09', docs:'pending' },
  { id:9,  name:'אלכס גורביץ',  trade:'electrical', rating:4.7, reviews:189, price:[320,950],  callout:140, lat:32.0480, lng:34.8100, avail:'soon',  resp:22,  jobs:430,  verified:true,  years:19, area:'קריית שלום',    phone:'052-7712-660', status:'active',  insurance:true,  balance:900,  acceptance:.79, completion:.96, earnings:41200, joined:'2024-04-27', docs:'approved' },
  { id:10, name:'מוחמד חסן',    trade:'handyman',   rating:4.8, reviews:143, price:[180,550],  callout:90,  lat:32.0330, lng:34.7550, avail:'now',   resp:11,  jobs:380,  verified:true,  years:8,  area:'עג׳מי',         phone:'053-4402-118', status:'active',  insurance:true,  balance:1000,  acceptance:.84, completion:.97, earnings:33100, joined:'2024-08-13', docs:'approved' },
  { id:11, name:'תומר רגב',     trade:'hvac',       rating:4.6, reviews:87,  price:[380,1100], callout:190, lat:32.1380, lng:34.8300, avail:'later', resp:40,  jobs:210,  verified:true,  years:12, area:'רמת השרון',     phone:'050-9911-220', status:'active',  insurance:true,  balance:200,  acceptance:.66, completion:.92, earnings:24700, joined:'2024-10-01', docs:'approved' },
  { id:12, name:'עידן כץ',      trade:'painting',   rating:4.4, reviews:41,  price:[400,1500], callout:0,   lat:32.0790, lng:34.7350, avail:'soon',  resp:35,  jobs:95,   verified:false, years:5,  area:'יפו ג׳',        phone:'058-2210-774', status:'pending', insurance:false, balance:0,   acceptance:.51, completion:.86, earnings:6100,  joined:'2025-02-02', docs:'review' },
  { id:13, name:'שחר אבידן',    trade:'carpentry',  rating:4.9, reviews:118, price:[600,3000], callout:300, lat:32.1010, lng:34.7620, avail:'later', resp:60,  jobs:150,  verified:true,  years:21, area:'כיכר המדינה',   phone:'054-3301-889', status:'active',  insurance:true,  balance:200,  acceptance:.58, completion:.95, earnings:38900, joined:'2024-11-11', docs:'approved' },
  { id:14, name:'בן אלמוג',     trade:'locksmith',  rating:4.7, reviews:203, price:[220,650],  callout:160, lat:32.0620, lng:34.7710, avail:'now',   resp:8,   jobs:760,  verified:true,  years:13, area:'מונטיפיורי',    phone:'052-1188-440', status:'active',  insurance:true,  balance:1500, acceptance:.86, completion:.98, earnings:45300, joined:'2024-03-30', docs:'approved' },
  { id:15, name:'גיא רוזן',     trade:'plumbing',   rating:4.8, reviews:95,  price:[330,850],  callout:140, lat:32.1150, lng:34.7420, avail:'soon',  resp:27,  jobs:240,  verified:true,  years:10, area:'רמת גן — צפון', phone:'050-6620-117', status:'active',  insurance:true,  balance:400,  acceptance:.73, completion:.94, earnings:27600, joined:'2024-12-05', docs:'approved' },
  { id:16, name:'ליאור נחום',   trade:'electrical', rating:4.5, reviews:63,  price:[260,700],  callout:110, lat:32.0250, lng:34.7900, avail:'now',   resp:14,  jobs:190,  verified:true,  years:7,  area:'חולון',         phone:'053-7710-229', status:'active',  insurance:true,  balance:300,  acceptance:.69, completion:.93, earnings:19800, joined:'2025-01-22', docs:'approved' }
];

HM.CUSTOMERS = [
  { id:'c1', name:'דנה כהן',    phone:'052-3341-887', area:'פלורנטין',     since:'2024-06-02', requests:7, jobs:5, spend:4820, rating:4.9 },
  { id:'c2', name:'אורי מזרחי', phone:'054-9910-223', area:'רמת אביב',     since:'2024-09-14', requests:4, jobs:3, spend:3110, rating:4.7 },
  { id:'c3', name:'יעל בן עמי', phone:'050-4412-990', area:'נווה צדק',     since:'2025-01-08', requests:2, jobs:1, spend:640,  rating:5.0 },
  { id:'c4', name:'עומר דגן',   phone:'058-2210-664', area:'הצפון הישן',   since:'2024-11-21', requests:5, jobs:4, spend:5240, rating:4.6 },
  { id:'c5', name:'רונית שלום', phone:'052-8890-117', area:'רמת גן',       since:'2025-02-17', requests:1, jobs:0, spend:0,    rating:null }
];

HM.REQUESTS = [
  { id:'r1', customerId:'c1', customer:'דנה כהן', trade:'plumbing', address:'פלורנטין, תל אביב', lat:32.0561, lng:34.7698, urgency:'emergency', desc:'נזילה מתחת לכיור במטבח, מים מטפטפים מהצינור כבר מאתמול. יש תמונה.', budget:600, status:'open', createdAt:'2026-11-18T07:40:00', offers:3, photos:2 },
  { id:'r2', customerId:'c2', customer:'אורי מזרחי', trade:'hvac', address:'רמת אביב, תל אביב', lat:32.1122, lng:34.8010, urgency:'today', desc:'מזגן בסלון לא מקרר, עושה רעש חזק. צריך בדיקה דחופה.', budget:900, status:'open', createdAt:'2026-11-18T06:15:00', offers:2, photos:1 },
  { id:'r3', customerId:'c3', customer:'יעל בן עמי', trade:'handyman', address:'נווה צדק, תל אביב', lat:32.0605, lng:34.7650, urgency:'this_week', desc:'תליית 4 מדפים ומראה גדולה, צריך מישהו עם מקדחה טובה.', budget:400, status:'matched', createdAt:'2026-11-17T15:20:00', offers:5, photos:0 },
  { id:'r4', customerId:'c4', customer:'עומר דגן', trade:'electrical', address:'הצפון הישן, תל אביב', lat:32.0921, lng:34.7742, urgency:'today', desc:'שקע במטבח מפסיק לעבוד, יש ריח חריכה קל. דחוף.', budget:500, status:'scheduled', createdAt:'2026-11-17T09:05:00', offers:4, photos:1 },
  { id:'r5', customerId:'c5', customer:'רונית שלום', trade:'painting', address:'רמת גן', lat:32.0700, lng:34.8240, urgency:'flexible', desc:'צביעת דירת 3 חדרים, 78 מ״ר, לפני כניסה. כולל תיקוני טיח קטנים.', budget:6000, status:'open', createdAt:'2026-11-16T18:30:00', offers:1, photos:3 },
  { id:'r6', customerId:'c1', customer:'דנה כהן', trade:'locksmith', address:'פלורנטין, תל אביב', lat:32.0558, lng:34.7702, urgency:'emergency', desc:'ננעלנו בחוץ, המפתח נשבר במנעול. צריך מנעולן עכשיו.', budget:450, status:'completed', createdAt:'2026-11-12T21:10:00', offers:3, photos:0 },
  { id:'r7', customerId:'c4', customer:'עומר דגן', trade:'plumbing', address:'הצפון הישן, תל אביב', lat:32.0905, lng:34.7770, urgency:'today', desc:'דוד שמש מטפטף על הגג, יש שלולית קטנה ליד המעקה. צריך בדיקה ואטימה.', budget:700, status:'open', createdAt:'2026-11-18T08:05:00', offers:0, photos:2 },
  { id:'r8', customerId:'c5', customer:'רונית שלום', trade:'plumbing', address:'רמת גן', lat:32.0680, lng:34.8210, urgency:'this_week', desc:'אסלה סתומה בשירותי האורחים, ניסינו פומפה בלי הצלחה.', budget:350, status:'open', createdAt:'2026-11-18T07:10:00', offers:1, photos:0 },
  { id:'r9', customerId:'c1', customer:'דנה כהן', trade:'electrical', address:'פלורנטין, תל אביב', lat:32.0570, lng:34.7715, urgency:'emergency', desc:'לוח החשמל מקפיץ מפסק ראשי כשמדליקים מייבש. צריך בדיקת עומסים דחופה.', budget:800, status:'open', createdAt:'2026-11-18T08:20:00', offers:1, photos:1 },
  { id:'r10', customerId:'c4', customer:'עומר דגן', trade:'hvac', address:'הצפון הישן, תל אביב', lat:32.0930, lng:34.7760, urgency:'today', desc:'מזגן עומד מטפטף מים לסלון, כנראה ניקוז סתום.', budget:450, status:'open', createdAt:'2026-11-18T07:55:00', offers:0, photos:2 },
  { id:'r11', customerId:'c2', customer:'אורי מזרחי', trade:'painting', address:'רמת אביב, תל אביב', lat:32.1100, lng:34.8000, urgency:'flexible', desc:'צביעת שני חדרים + מסדרון, 42 מ״ר. צבע לבן, כולל תיקוני טיח קטנים.', budget:3200, status:'open', createdAt:'2026-11-17T20:10:00', offers:1, photos:2 },
  { id:'r12', customerId:'c3', customer:'יעל בן עמי', trade:'handyman', address:'נווה צדק, תל אביב', lat:32.0600, lng:34.7660, urgency:'this_week', desc:'החלפת ציר לדלת כניסה + התקנת מנעול נוסף. הדלת מעץ.', budget:500, status:'open', createdAt:'2026-11-18T06:40:00', offers:0, photos:1 },
  { id:'r13', customerId:'c5', customer:'רונית שלום', trade:'locksmith', address:'רמת גן', lat:32.0700, lng:34.8230, urgency:'today', desc:'מפתח נתקע במנעול הכניסה, צריך חילוץ בלי לשבור את הדלת.', budget:400, status:'open', createdAt:'2026-11-18T08:35:00', offers:0, photos:0 }
];

HM.OFFERS = [
  { id:'o1', requestId:'r1', proId:1,  price:480, eta:45,  warranty:12, message:'מגיע היום עד 14:00. מחליף אטם ומהדק, כולל אחריות שנה.', status:'sent', createdAt:'2026-11-18T07:52:00' },
  { id:'o2', requestId:'r1', proId:15, price:420, eta:90,  warranty:6,  message:'פנוי ב-15:30. אבחן ואתקן במקום, מחיר סופי אחרי בדיקה.', status:'sent', createdAt:'2026-11-18T08:04:00' },
  { id:'o3', requestId:'r1', proId:8,  price:390, eta:120, warranty:3,  message:'יכול להגיע בשעה 16:00. מחיר כולל חלקים בסיסיים.', status:'sent', createdAt:'2026-11-18T08:21:00' },
  { id:'o4', requestId:'r2', proId:3,  price:850, eta:180, warranty:12, message:'בדיקת גז ולחץ, כולל ניקוי פילטרים. אם חסר גז — תוספת לפי מד.', status:'sent', createdAt:'2026-11-18T06:44:00' },
  { id:'o5', requestId:'r2', proId:11, price:790, eta:240, warranty:6,  message:'מגיע מחר בבוקר. אבחון חינם אם מאשרים תיקון.', status:'sent', createdAt:'2026-11-18T07:02:00' },
  { id:'o6', requestId:'r3', proId:4,  price:320, eta:60,  warranty:0,  message:'שעתיים עבודה, מביא דיבלים ומדפים? מדפים שלך.', status:'accepted', createdAt:'2026-11-17T16:02:00' },
  { id:'o7', requestId:'r4', proId:2,  price:450, eta:30,  warranty:24, message:'מחליף שקע ומפסק, בודק עומס בקו. מגיע עד 11:00.', status:'accepted', createdAt:'2026-11-17T09:31:00' },
  { id:'o8', requestId:'r6', proId:14, price:380, eta:25,  warranty:6,  message:'פותח במקום, מחליף צילינדר אם צריך.', status:'accepted', createdAt:'2026-11-12T21:22:00' }
];

HM.JOBS = [
  { id:'j1', requestId:'r4', offerId:'o7', proId:2,  customer:'עומר דגן', trade:'electrical', address:'הצפון הישן, תל אביב', scheduledAt:'2026-11-18T11:00:00', status:'scheduled',  finalPrice:450,  paid:false },
  { id:'j2', requestId:'r3', offerId:'o6', proId:4,  customer:'יעל בן עמי', trade:'handyman', address:'נווה צדק, תל אביב', scheduledAt:'2026-11-19T09:30:00', status:'scheduled',  finalPrice:320,  paid:false },
  { id:'j3', requestId:'r6', offerId:'o8', proId:14, customer:'דנה כהן', trade:'locksmith', address:'פלורנטין, תל אביב', scheduledAt:'2026-11-12T21:45:00', status:'completed', finalPrice:380, paid:true },
  { id:'j4', requestId:'r1', offerId:'o1', proId:1,  customer:'דנה כהן', trade:'plumbing', address:'פלורנטין, תל אביב', scheduledAt:'2026-11-18T13:30:00', status:'in_progress', finalPrice:480, paid:false }
];

HM.REVIEWS = [
  { id:'v1', jobId:'j3', proId:14, author:'דנה כהן', rating:5, text:'הגיע תוך 20 דקות בלילה, פתח בלי נזק והסביר מה קרה. מחיר הוגן.', createdAt:'2026-11-13T08:12:00', photos:1 },
  { id:'v2', jobId:'j0', proId:1,  author:'אורי מזרחי', rating:5, text:'יוסי תיקן נזילה שקודם שניים לא הצליחו. מקצועי, מסודר, ניקה אחריו.', createdAt:'2026-11-05T17:40:00', photos:2 },
  { id:'v3', jobId:'j0', proId:1,  author:'רונית שלום', rating:4, text:'עבודה טובה, איחר ב-20 דקות אבל עדכן מראש.', createdAt:'2026-10-28T12:05:00', photos:0 },
  { id:'v4', jobId:'j0', proId:4,  author:'עומר דגן', rating:5, text:'שרון עשה עבודה של 5 אנשים ביום אחד. ממליץ בחום.', createdAt:'2026-10-19T19:22:00', photos:3 },
  { id:'v5', jobId:'j0', proId:2,  author:'יעל בן עמי', rating:4, text:'תיקן שקע בעייתי, הסביר על עומסים. היה אפשר להיות זול יותר.', createdAt:'2026-10-11T10:15:00', photos:0 }
];

HM.DISPUTES = [
  { id:'d1', jobId:'j3', proId:14, customer:'דנה כהן', reason:'מחיר סופי גבוה ב-80 ₪ מההצעה', amount:80,  status:'open',     openedAt:'2026-11-14T09:00:00', sla:'2026-11-17T09:00:00' },
  { id:'d2', jobId:'j0', proId:5,  customer:'אורי מזרחי', reason:'עבודה לא הושלמה — חסר פאנל אחד', amount:600, status:'open',     openedAt:'2026-11-15T16:30:00', sla:'2026-11-18T16:30:00' },
  { id:'d3', jobId:'j0', proId:11, customer:'רונית שלום', reason:'בעל המקצוע לא הגיע במועד', amount:0,   status:'resolved', openedAt:'2026-11-08T11:00:00', sla:'2026-11-11T11:00:00' }
];

HM.LEDGER = [
  { id:'l1', proId:1,  delta:1200, reason:'purchase',    note:'טעינת יתרה — 12 פניות',  createdAt:'2026-11-10T10:00:00', balance:1200 },
  { id:'l5', proId:1,  delta:-100, reason:'lead_charge', note:'פנייה — דוד מטפטף',      createdAt:'2026-11-12T18:40:00', balance:1100 },
  { id:'l4', proId:1,  delta:200,  reason:'bonus',       note:'בונוס 10 עבודות ברצף',   createdAt:'2026-11-14T09:00:00', balance:1300 },
  { id:'l3', proId:1,  delta:-100, reason:'lead_charge', note:'פנייה — כיור סתום',      createdAt:'2026-11-16T14:20:00', balance:1200 },
  { id:'l2', proId:1,  delta:-100, reason:'lead_charge', note:'פנייה — נזילה בפלורנטין', createdAt:'2026-11-18T07:52:00', balance:1100 },
  { id:'l6', proId:2,  delta:600,  reason:'purchase',    note:'טעינת יתרה — 6 פניות',   createdAt:'2026-11-08T12:00:00', balance:600 }
];

HM.AUDIT = [
  { id:'a1', actor:'מערכת', action:'אישור אוטומטי — ביטוח בתוקף', target:'יוסי לוי', at:'2026-11-18T08:02:00', kind:'verify' },
  { id:'a2', actor:'דנה כהן', action:'פתחה בקשת שירות — אינסטלציה', target:'r1', at:'2026-11-18T07:40:00', kind:'request' },
  { id:'a3', actor:'יוסי לוי', action:'שלח הצעת מחיר 480 ₪', target:'r1', at:'2026-11-18T07:52:00', kind:'offer' },
  { id:'a4', actor:'מערכת', action:'חיוב 100 ₪ — פנייה חדשה', target:'יוסי לוי', at:'2026-11-18T07:52:00', kind:'credit' },
  { id:'a5', actor:'אבי כהן', action:'סימן עבודה כהושלמה', target:'j1', at:'2026-11-17T18:10:00', kind:'job' },
  { id:'a6', actor:'מנהל', action:'דחה מסמך — ת״ז לא קריאה', target:'עידן כץ', at:'2026-11-17T11:25:00', kind:'verify' },
  { id:'a7', actor:'מערכת', action:'חסימת קטגוריית חשמל — אין ביטוח', target:'נועם בן דוד', at:'2026-11-16T09:44:00', kind:'risk' }
];

HM.THREADS = [
  { id:'t1', requestId:'r1', proId:1, customer:'דנה כהן', unread:2, lastAt:'2026-11-18T08:30:00' },
  { id:'t2', requestId:'r4', proId:2, customer:'עומר דגן', unread:0, lastAt:'2026-11-17T19:12:00' },
  { id:'t3', requestId:'r3', proId:4, customer:'יעל בן עמי', unread:1, lastAt:'2026-11-17T16:40:00' }
];

HM.MESSAGES = {
  t1:[
    { id:'m1', from:'them', body:'היי דנה, ראיתי את התמונה. זה אטם של הסיפון, חלק זול.', at:'2026-11-18T08:05:00' },
    { id:'m2', from:'me',   body:'מעולה. אתה יכול להגיע היום?', at:'2026-11-18T08:12:00' },
    { id:'m3', from:'them', body:'כן, בין 13:00 ל-14:00. אקח איתי אטם וחיבור גמיש.', at:'2026-11-18T08:20:00' },
    { id:'m4', from:'them', body:'המחיר הסופי 480 ₪ כולל חלקים ואחריות שנה.', at:'2026-11-18T08:30:00' }
  ],
  t2:[
    { id:'m5', from:'me',   body:'אבי, השקע במטבח מפסיק לעבוד. יש ריח חריכה.', at:'2026-11-17T09:35:00' },
    { id:'m6', from:'them', body:'אל תשתמשו בשקע עד שאגיע. זה יכול להיות מגע רופף.', at:'2026-11-17T09:40:00' },
    { id:'m7', from:'them', body:'מגיע מחר ב-11:00 בדיוק.', at:'2026-11-17T19:12:00' }
  ],
  t3:[
    { id:'m8', from:'them', body:'יעל, מביא דיבלים לקיר גבס. המדפים שלך?', at:'2026-11-17T16:40:00' }
  ]
};

HM.SETTINGS = {
  launchZones:['פלורנטין','נווה צדק','הצפון הישן'],
  slaVerifyHours:24,
  leadPrice:100,
  minOffers:3,
  maxRequestsPerDay:3,
  autoApproveInsurance:true,
  maintenance:false
};

HM.SERIES = {
  requests:[12,18,15,22,19,26,24,31,28,35,33,41],
  gmv:[8.2,9.1,8.8,10.4,11.2,10.9,12.6,13.4,12.8,14.9,15.6,17.2],
  pros:[42,45,44,48,51,50,54,57,56,61,64,68],
  fill:[.52,.58,.55,.62,.66,.63,.69,.72,.70,.75,.78,.81]
};
