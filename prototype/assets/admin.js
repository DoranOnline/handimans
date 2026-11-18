/* ============================================================
   HANDIMANS — Admin (operations) experience
   ============================================================ */
(function(){
  const S = HM.state;

  const NAV = [
    { id:'overview', label:'סקירה',          icon:'chart' },
    { id:'verify',   label:'אימות בעלי מקצוע', icon:'shieldCheck', count:() => pendingPros().length },
    { id:'disputes', label:'מחלוקות',        icon:'alert', count:() => openDisputes().length },
    { id:'users',    label:'משתמשים',        icon:'users' },
    { id:'catalog',  label:'קטגוריות',       icon:'layers' },
    { id:'credits',  label:'יתרות ותשלומים', icon:'wallet' },
    { id:'audit',    label:'יומן פעילות',    icon:'history' },
    { id:'settings', label:'הגדרות',         icon:'settings' }
  ];

  function pendingPros(){ return HM.db.pros.filter(p => p.docs === 'pending' || p.docs === 'review'); }
  function openDisputes(){ return HM.db.disputes.filter(d => d.status === 'open'); }

  function rail(active){
    return `<nav class="rail">
      <div class="rail-label">תפעול</div>
      ${NAV.map(n => {
        const c = n.count ? n.count() : 0;
        return `<button class="rail-item" data-nav="${n.id}" ${active===n.id?'aria-current="page"':''}>
          ${HM.icon(n.icon, 16)}<span>${n.label}</span>${c ? `<span class="count">${c}</span>` : ''}
        </button>`;
      }).join('')}
      <div class="rail-foot">
        <div class="rail-card">
          <h4>השקה רכה</h4>
          <p>${HM.db.settings.launchZones.join(' · ')}</p>
          <button class="btn" data-nav="settings">ניהול אזורים</button>
        </div>
      </div>
    </nav>`;
  }

  function shell(root, active, content){
    root.innerHTML = rail(active) + `<div class="content">${content}</div>`;
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => HM.go('admin/' + b.dataset.nav)));
  }

  function head(title, sub, actions){
    return `<div class="page-head">
      <div><div class="page-title">${title}</div><div class="page-sub">${sub}</div></div>
      <div class="page-actions">${actions || ''}</div>
    </div>`;
  }

  /* ---------------- Overview ---------------- */
  function overview(root){
    const pros = HM.db.pros.filter(p => p.status === 'active');
    const reqs = HM.db.requests;
    const offers = HM.db.offers;
    const gmv = HM.db.jobs.reduce((s,j) => s + (j.finalPrice || 0), 0);
    const fill = reqs.filter(r => r.offers >= 3).length / Math.max(1, reqs.length);
    const content = `
      ${head('סקירה תפעולית', 'כל מה שקורה בפלטפורמה עכשיו — בקשות, היצע, אימות ומחלוקות',
        `<button class="btn btn-ghost" id="exportBtn">${HM.icon('download', 14)} ייצוא CSV</button>
         <button class="btn btn-primary" data-nav="verify">${HM.icon('shieldCheck', 14)} תור אימות (${pendingPros().length})</button>`)}

      <div class="grid g5 mb">
        ${HM.kpi('GMV החודש', HM.fmt.money(gmv), '+14%', 'up', HM.spark(HM.SERIES.gmv, '#15803d'))}
        ${HM.kpi('בקשות פתוחות', HM.fmt.num(reqs.filter(r=>r.status==='open').length), '+6 היום', 'up', HM.spark(HM.SERIES.requests, '#f97316'))}
        ${HM.kpi('שיעור מילוי', HM.fmt.pct(fill), 'יעד 80%', fill >= .8 ? 'up' : 'down', HM.spark(HM.SERIES.fill, '#1d4ed8'))}
        ${HM.kpi('בעלי מקצוע פעילים', HM.fmt.num(pros.length), '+3 השבוע', 'up', HM.spark(HM.SERIES.pros, '#6d28d9'))}
        ${HM.kpi('מחלוקות פתוחות', HM.fmt.num(openDisputes().length), openDisputes().length ? 'דורש טיפול' : 'הכול נקי', openDisputes().length ? 'down' : 'up', '')}
      </div>

      <div class="grid g-2-1 mb">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('trending', 15)} בקשות ו-GMV ב-12 חודשים</div>
            <div class="legend"><span><i style="background:#f97316"></i>בקשות</span><span><i style="background:#15803d"></i>GMV (אלף ₪)</span></div>
          </div>
          <div class="panel-body">
            ${HM.bars(HM.SERIES.requests, ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'], '#f97316', 150)}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('percent', 15)} התפלגות סטטוסים</div></div>
          <div class="panel-body" style="display:flex;align-items:center;gap:16px">
            ${HM.donut([
              { value:reqs.filter(r=>r.status==='open').length, color:'#f97316' },
              { value:reqs.filter(r=>r.status==='scheduled').length, color:'#6d28d9' },
              { value:reqs.filter(r=>r.status==='completed').length, color:'#15803d' },
              { value:reqs.filter(r=>r.status==='matched').length, color:'#1d4ed8' }
            ], 116, 15)}
            <div style="flex:1">
              ${[['פתוחות','#f97316',reqs.filter(r=>r.status==='open').length],['מתוזמנות','#6d28d9',reqs.filter(r=>r.status==='scheduled').length],['הושלמו','#15803d',reqs.filter(r=>r.status==='completed').length],['נמצאה התאמה','#1d4ed8',reqs.filter(r=>r.status==='matched').length]].map(([l,c,v]) => `
                <div class="row" style="justify-content:space-between;font-size:11.5px;margin-bottom:7px">
                  <span style="color:var(--muted);font-weight:600"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-inline-end:6px"></i>${l}</span>
                  <b>${v}</b>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="grid g3">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('shieldCheck', 15)} תור אימות</div>${HM.badge(pendingPros().length + ' ממתינים','amber')}</div>
          <div class="panel-body flush">
            ${pendingPros().length ? pendingPros().map(p => `
              <div class="lrow" data-verify="${p.id}">
                ${HM.avatar(p.name, HM.trade(p.trade).color, 'sm')}
                <div class="lrow-main"><div class="lrow-title">${HM.esc(p.name)}</div><div class="lrow-sub">${HM.trade(p.trade).name} · הוגש ${HM.fmt.rel(p.joined)}</div></div>
                ${HM.badge('SLA 24ש׳','amber')}
              </div>`).join('') : HM.empty('check','אין ממתינים','כל המסמכים טופלו.')}
          </div>
          <div class="panel-foot"><button class="btn btn-ghost btn-sm btn-block" data-nav="verify">לתור המלא</button></div>
        </div>

        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('alert', 15)} מחלוקות</div>${HM.badge(openDisputes().length + ' פתוחות','red')}</div>
          <div class="panel-body flush">
            ${openDisputes().length ? openDisputes().map(d => `
              <div class="lrow" data-dispute="${d.id}">
                <div class="avatar sm" style="background:var(--red-soft);color:var(--red)">${HM.icon('alert', 15)}</div>
                <div class="lrow-main"><div class="lrow-title">${HM.esc(d.reason)}</div><div class="lrow-sub">${HM.esc(d.customer)} · ${HM.fmt.money(d.amount)}</div></div>
                ${HM.badge('SLA','red')}
              </div>`).join('') : HM.empty('check','אין מחלוקות','הכול נקי.')}
          </div>
          <div class="panel-foot"><button class="btn btn-ghost btn-sm btn-block" data-nav="disputes">לניהול מחלוקות</button></div>
        </div>

        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('history', 15)} פעילות אחרונה</div></div>
          <div class="panel-body">
            ${HM.db.audit.slice(0,5).map(a => `
              <div class="audit">
                <div class="audit-dot" style="background:${a.kind==='risk'?'var(--red)':a.kind==='credit'?'var(--green)':'var(--accent)'}"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600">${HM.esc(a.action)}</div>
                  <div class="audit-time">${HM.esc(a.actor)} · ${HM.fmt.rel(a.at)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    shell(root, 'overview', content);
    root.querySelectorAll('[data-verify]').forEach(el => el.addEventListener('click', () => openVerify(Number(el.dataset.verify))));
    root.querySelectorAll('[data-dispute]').forEach(el => el.addEventListener('click', () => openDispute(el.dataset.dispute)));
    const ex = root.querySelector('#exportBtn');
    if (ex) ex.addEventListener('click', () => HM.toast('הדוח הורד (הדגמה)'));
  }

  /* ---------------- Verify ---------------- */
  function verify(root){
    const list = HM.db.pros.filter(p => p.docs !== 'approved' || p.status === 'pending');
    const content = `
      ${head('אימות בעלי מקצוע', `${list.length} ממתינים · SLA ${HM.db.settings.slaVerifyHours} שעות · בדיקת ת״ז, עוסק וביטוח`, '')}
      <div class="panel mb">
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>בעל מקצוע</th><th>מקצוע</th><th>מסמכים</th><th>ביטוח</th><th>הוגש</th><th>סטטוס</th><th></th></tr></thead>
            <tbody>${list.map(p => `
              <tr>
                <td><div class="row" style="gap:8px">${HM.avatar(p.name, HM.trade(p.trade).color, 'sm')}<div><div class="cell-main">${HM.esc(p.name)}</div><div class="cell-sub">${HM.esc(p.area)}</div></div></div></td>
                <td>${HM.trade(p.trade).name}</td>
                <td>${p.docs === 'pending' ? HM.badge('ממתין','amber') : p.docs === 'review' ? HM.badge('בבדיקה','blue') : HM.badge('מאושר','green')}</td>
                <td>${p.insurance ? HM.badge('בתוקף','green') : HM.badge('חסר','red')}</td>
                <td style="color:var(--muted)">${HM.fmt.date(p.joined)}</td>
                <td>${HM.badge(p.status === 'pending' ? 'ממתין לאישור' : 'פעיל', p.status === 'pending' ? 'amber' : 'green')}</td>
                <td><button class="btn btn-ghost btn-sm" data-verify="${p.id}">בדיקה</button></td>
              </tr>`).join('') || `<tr><td colspan="7">${HM.empty('check','אין ממתינים','כל התור טופל.')}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="panel-body" style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--amber-soft);color:var(--amber);display:grid;place-items:center;flex-shrink:0">${HM.icon('alert', 17)}</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.6">
            <b style="color:var(--ink-2)">כלל ברזל:</b> ללא ביטוח אחריות מקצועית בתוקף — אין אישור לקטגוריות חשמל, גז ומיזוג. המערכת חוסמת אוטומטית ומסמנת לבדיקה ידנית.
          </div>
        </div>
      </div>`;
    shell(root, 'verify', content);
    root.querySelectorAll('[data-verify]').forEach(b => b.addEventListener('click', () => openVerify(Number(b.dataset.verify))));
  }

  function openVerify(proId){
    const p = HM.pro(proId);
    if (!p) return;
    HM.modal({
      title:'בדיקת מסמכים — ' + p.name,
      sub:HM.trade(p.trade).name + ' · ' + p.area + ' · הוגש ' + HM.fmt.date(p.joined),
      size:'wide',
      body:`
        <div class="grid g2" style="margin-bottom:14px">
          <div class="doc"><div class="doc-ico">${HM.icon('file', 15)}</div><div style="flex:1"><div style="font-weight:700">תעודת זהות</div><div style="font-size:10px;color:var(--muted)">צילום ברור · תוקף 2031</div></div>${HM.badge('תקין','green')}</div>
          <div class="doc"><div class="doc-ico">${HM.icon('file', 15)}</div><div style="flex:1"><div style="font-weight:700">עוסק מורשה</div><div style="font-size:10px;color:var(--muted)">מספר תואם לרישום</div></div>${HM.badge('תקין','green')}</div>
          <div class="doc"><div class="doc-ico">${HM.icon('shield', 15)}</div><div style="flex:1"><div style="font-weight:700">ביטוח אחריות מקצועית</div><div style="font-size:10px;color:var(--muted)">${p.insurance?'בתוקף עד 08/2027':'לא הוגש'}</div></div>${p.insurance?HM.badge('תקין','green'):HM.badge('חסר','red')}</div>
          <div class="doc"><div class="doc-ico">${HM.icon('award', 15)}</div><div style="flex:1"><div style="font-weight:700">תעודת מקצוע</div><div style="font-size:10px;color:var(--muted)">${p.years} שנות ניסיון</div></div>${HM.badge('תקין','green')}</div>
        </div>
        <div class="field">
          <label class="label" for="verifyNote">הערת בדיקה (נראית לבעל המקצוע)</label>
          <textarea class="input" id="verifyNote" placeholder="מה אושר, מה חסר, ומה נדרש להשלים."></textarea>
        </div>
        <label class="switch"><input type="checkbox" id="blockRisky" ${p.insurance?'':'checked'}><span class="track"></span> חסימת קטגוריות מסוכנות עד להשלמת ביטוח</label>`,
      foot:`<button class="btn btn-green" id="approve">${HM.icon('check', 14)} אישור</button>
            <button class="btn btn-danger" id="reject">${HM.icon('x', 14)} דחייה</button>
            <button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        box.querySelector('#approve').addEventListener('click', () => {
          p.docs = 'approved'; p.status = 'active'; p.verified = true;
          HM.addAudit('מנהל', 'אישר מסמכים', p.name, 'verify');
          HM.closeModal(); HM.toast(p.name + ' אושר ופעיל'); HM.render();
        });
        box.querySelector('#reject').addEventListener('click', () => {
          p.docs = 'review'; p.status = 'pending';
          HM.addAudit('מנהל', 'דחה מסמכים — נדרשת השלמה', p.name, 'verify');
          HM.closeModal(); HM.toast('הבקשה הוחזרה להשלמה', 'warn'); HM.render();
        });
      }
    });
  }

  /* ---------------- Disputes ---------------- */
  function disputes(root){
    const list = HM.db.disputes;
    const content = `
      ${head('מחלוקות', `${openDisputes().length} פתוחות · SLA 72 שעות · קיפאון תשלום אוטומטי`, '')}
      <div class="panel">
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>נפתחה</th><th>לקוח</th><th>בעל מקצוע</th><th>סיבה</th><th>סכום</th><th>SLA</th><th>סטטוס</th><th></th></tr></thead>
            <tbody>${list.map(d => {
              const p = HM.pro(d.proId);
              const late = new Date(d.sla) < new Date() && d.status === 'open';
              return `<tr>
                <td style="color:var(--muted)">${HM.fmt.date(d.openedAt)}</td>
                <td class="cell-main">${HM.esc(d.customer)}</td>
                <td>${HM.esc(p.name)}</td>
                <td style="max-width:220px">${HM.esc(d.reason)}</td>
                <td class="num">${HM.fmt.money(d.amount)}</td>
                <td>${late ? HM.badge('באיחור','red') : HM.badge(HM.fmt.date(d.sla),'gray')}</td>
                <td>${HM.badge(d.status==='open'?'פתוחה':'טופלה', d.status==='open'?'red':'green')}</td>
                <td>${d.status==='open'?`<button class="btn btn-ghost btn-sm" data-dispute="${d.id}">טיפול</button>`:''}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    shell(root, 'disputes', content);
    root.querySelectorAll('[data-dispute]').forEach(b => b.addEventListener('click', () => openDispute(b.dataset.dispute)));
  }

  function openDispute(id){
    const d = HM.db.disputes.find(x => x.id === id);
    if (!d) return;
    const p = HM.pro(d.proId);
    HM.modal({
      title:'טיפול במחלוקת',
      sub:d.customer + ' מול ' + p.name + ' · נפתחה ' + HM.fmt.dt(d.openedAt),
      body:`
        <div style="background:var(--red-soft);border:1px solid #fbd5d5;border-radius:11px;padding:12px;margin-bottom:14px">
          <div style="font-size:11px;font-weight:800;color:var(--red);margin-bottom:3px">התלונה</div>
          <div style="font-size:12.5px;line-height:1.55">${HM.esc(d.reason)}</div>
        </div>
        <div class="grid g2 mb">
          <div class="panel"><div class="panel-body"><div style="font-size:10.5px;color:var(--muted);font-weight:700">סכום במחלוקת</div><div style="font-size:20px;font-weight:900;margin-top:3px">${HM.fmt.money(d.amount)}</div></div></div>
          <div class="panel"><div class="panel-body"><div style="font-size:10.5px;color:var(--muted);font-weight:700">יתרת בעל המקצוע</div><div style="font-size:20px;font-weight:900;margin-top:3px">${HM.fmt.money(p.balance)}</div></div></div>
        </div>
        <div class="field">
          <label class="label" for="dispNote">החלטה והנמקה</label>
          <textarea class="input" id="dispNote" placeholder="מה נבדק, מה הוכרע, ומה יקרה הלאה."></textarea>
        </div>
        <div class="field" style="margin-bottom:0">
          <label class="label">פעולה</label>
          <div class="stack" style="gap:7px">
            <label class="switch"><input type="radio" name="act" value="refund" checked><span class="track"></span> החזר ללקוח + זיכוי יתרה לבעל המקצוע</label>
            <label class="switch"><input type="radio" name="act" value="credit"><span class="track"></span> זיכוי יתרה בלבד</label>
            <label class="switch"><input type="radio" name="act" value="reject"><span class="track"></span> דחיית התלונה — אין פיצוי</label>
          </div>
        </div>`,
      foot:`<button class="btn btn-primary" id="resolve">סגירת מחלוקת</button><button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        box.querySelector('#resolve').addEventListener('click', () => {
          d.status = 'resolved';
          HM.addAudit('מנהל', 'סגר מחלוקת — ' + d.reason, d.customer, 'dispute');
          HM.closeModal(); HM.toast('המחלוקת נסגרה והתשלום שוחרר'); HM.render();
        });
      }
    });
  }

  /* ---------------- Users ---------------- */
  function users(root){
    const pros = HM.db.pros;
    const customers = HM.db.customers;
    const content = `
      ${head('משתמשים', `${pros.length} בעלי מקצוע · ${customers.length} לקוחות`, `<button class="btn btn-ghost">${HM.icon('download', 14)} ייצוא</button>`)}
      <div class="panel mb">
        <div class="panel-head">
          <div class="panel-title">${HM.icon('briefcase', 15)} בעלי מקצוע</div>
          <input class="input" id="proSearch" placeholder="חיפוש לפי שם, מקצוע או אזור" style="width:240px;padding:6px 10px;font-size:12px">
        </div>
        <div class="panel-body flush table-wrap">
          <table class="table" id="proTable">
            <thead><tr><th>שם</th><th>מקצוע</th><th>אזור</th><th>דירוג</th><th>עבודות</th><th>יתרה</th><th>סטטוס</th><th></th></tr></thead>
            <tbody>${pros.map(p => `
              <tr data-row="${(p.name + ' ' + HM.trade(p.trade).name + ' ' + p.area).toLowerCase()}">
                <td><div class="row" style="gap:8px">${HM.avatar(p.name, HM.trade(p.trade).color, 'sm')}<div><div class="cell-main">${HM.esc(p.name)}</div><div class="cell-sub">${HM.esc(p.phone)}</div></div></div></td>
                <td>${HM.trade(p.trade).name}</td>
                <td style="color:var(--muted)">${HM.esc(p.area)}</td>
                <td>${HM.stars(p.rating, p.reviews)}</td>
                <td class="num">${p.jobs}</td>
                <td class="num">${HM.fmt.money(p.balance)}</td>
                <td>${HM.badge(p.status==='active'?'פעיל':p.status==='pending'?'ממתין':'מושהה', p.status==='active'?'green':p.status==='pending'?'amber':'gray')}</td>
                <td><button class="btn btn-ghost btn-sm" data-suspend="${p.id}">${p.status==='active'?'השעיה':'שחזור'}</button></td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('users', 15)} לקוחות</div></div>
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>שם</th><th>אזור</th><th>בקשות</th><th>עבודות</th><th>הוצאה</th><th>דירוג</th><th>חבר מאז</th></tr></thead>
            <tbody>${customers.map(c => `
              <tr>
                <td><div class="row" style="gap:8px">${HM.avatar(c.name, '#64748b', 'sm')}<div><div class="cell-main">${HM.esc(c.name)}</div><div class="cell-sub">${HM.esc(c.phone)}</div></div></div></td>
                <td style="color:var(--muted)">${HM.esc(c.area)}</td>
                <td class="num">${c.requests}</td>
                <td class="num">${c.jobs}</td>
                <td class="num">${HM.fmt.money(c.spend)}</td>
                <td>${c.rating ? HM.stars(c.rating) : '—'}</td>
                <td style="color:var(--muted)">${HM.fmt.date(c.since)}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    shell(root, 'users', content);
    const search = root.querySelector('#proSearch');
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      root.querySelectorAll('#proTable tbody tr').forEach(tr => {
        tr.style.display = tr.dataset.row.includes(q) ? '' : 'none';
      });
    });
    root.querySelectorAll('[data-suspend]').forEach(b => b.addEventListener('click', () => {
      const p = HM.pro(Number(b.dataset.suspend));
      p.status = p.status === 'active' ? 'suspended' : 'active';
      HM.addAudit('מנהל', p.status === 'active' ? 'שחזר משתמש' : 'השעה משתמש', p.name, 'risk');
      HM.toast(p.name + (p.status === 'active' ? ' שוחזר' : ' הושעה'), p.status === 'active' ? '' : 'warn');
      HM.render();
    }));
  }

  /* ---------------- Catalog ---------------- */
  function catalog(root){
    const content = `
      ${head('קטגוריות', 'מה אפשר לבקש, מי רשאי להגיש, וכמה עולה פנייה', `<button class="btn btn-primary">${HM.icon('plus', 14)} קטגוריה חדשה</button>`)}
      <div class="panel mb">
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>קטגוריה</th><th>Slug</th><th>בעלי מקצוע</th><th>בקשות</th><th>מחיר פנייה</th><th>נדרש ביטוח</th><th>פעיל</th></tr></thead>
            <tbody>${HM.TRADES.filter(t => t.id !== 'all').map(t => {
              const pros = HM.db.pros.filter(p => p.trade === t.id).length;
              const reqs = HM.db.requests.filter(r => r.trade === t.id).length;
              const risky = ['electrical','hvac','plumbing'].includes(t.id);
              return `<tr>
                <td><div class="row" style="gap:8px"><div class="avatar sm" style="background:${t.color}">${HM.icon(t.icon, 14)}</div><span class="cell-main">${t.name}</span></div></td>
                <td style="color:var(--muted);direction:ltr;text-align:right">${t.id}</td>
                <td class="num">${pros}</td>
                <td class="num">${reqs}</td>
                <td class="num">${HM.fmt.money(HM.db.settings.leadPrice)}</td>
                <td>${risky ? HM.badge('חובה','red') : HM.badge('לא','gray')}</td>
                <td><label class="switch"><input type="checkbox" checked><span class="track"></span></label></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
      <div class="grid g2">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('wallet', 15)} תמחור פניות</div></div>
          <div class="panel-body">
            <div class="field"><label class="label">מחיר פנייה בסיסי (₪)</label><input class="input" type="number" value="${HM.db.settings.leadPrice}"></div>
            <div class="field"><label class="label">מינימום הצעות לבקשה</label><input class="input" type="number" value="${HM.db.settings.minOffers}"></div>
            <div class="field" style="margin-bottom:0"><label class="label">מקסימום בקשות ללקוח ביום</label><input class="input" type="number" value="${HM.db.settings.maxRequestsPerDay}"></div>
            <div style="font-size:11px;color:var(--muted);line-height:1.55;margin-top:11px">פרסום אינו מקור הכנסה שלנו: קמפיינים של בעלי מקצוע הם הוצאה שלהם, ואנחנו לא מוכרים פרסום ולא גובים עליו.</div>
          </div>
          <div class="panel-foot"><button class="btn btn-primary btn-sm" id="savePricing">שמירה</button></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('alert', 15)} כללי סיכון</div></div>
          <div class="panel-body stack" style="gap:11px">
            <label class="switch"><input type="checkbox" checked><span class="track"></span> חסימת חשמל/גז ללא ביטוח בתוקף</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> חסימה אוטומטית אחרי 3 ביטולים</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> בדיקת ת״ז מול רשות האוכלוסין (API)</label>
            <label class="switch"><input type="checkbox"><span class="track"></span> אישור אוטומטי לביטוח בתוקף</label>
          </div>
        </div>
      </div>`;
    shell(root, 'catalog', content);
    const save = root.querySelector('#savePricing');
    if (save) save.addEventListener('click', () => HM.toast('התמחור עודכן'));
  }

  /* ---------------- Credits ---------------- */
  function credits(root){
    const ledger = HM.db.ledger.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = HM.db.pros.reduce((s,p) => s + p.balance, 0);
    const content = `
      ${head('יתרות ותשלומים', `${HM.fmt.money(total)} יתרות פתוחות · ${ledger.length} תנועות`, `<button class="btn btn-ghost">${HM.icon('download', 14)} ייצוא</button>`)}
      <div class="grid g4 mb">
        ${HM.kpi('יתרות פתוחות', HM.fmt.money(total), 'כסף שטרם נוצל', 'flat')}
        ${HM.kpi('נטען החודש', HM.fmt.money(18400), '+22%', 'up')}
        ${HM.kpi('פניות שחויבו', HM.fmt.num(412), 'החודש', 'flat')}
        ${HM.kpi('הכנסה לפניות', HM.fmt.money(41200), '+18%', 'up')}
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('history', 15)} כל התנועות</div>
          <button class="btn btn-ghost btn-sm" id="adjust">${HM.icon('sliders', 13)} התאמה ידנית</button>
        </div>
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>תאריך</th><th>בעל מקצוע</th><th>סוג</th><th>תיאור</th><th>שינוי</th><th>יתרה</th></tr></thead>
            <tbody>${ledger.map(l => {
              const p = HM.pro(l.proId);
              const kind = { purchase:['טעינה','green'], lead_charge:['חיוב פנייה','orange'], refund:['החזר','blue'], bonus:['בונוס','violet'], adjustment:['התאמה','gray'] }[l.reason];
              return `<tr>
                <td style="color:var(--muted)">${HM.fmt.dt(l.createdAt)}</td>
                <td class="cell-main">${HM.esc(p.name)}</td>
                <td>${HM.badge(kind[0], kind[1])}</td>
                <td>${HM.esc(l.note)}</td>
                <td class="num" style="color:${l.delta>0?'var(--green)':'var(--red)'}">${l.delta>0?'+':'−'}${HM.fmt.money(Math.abs(l.delta))}</td>
                <td class="num">${HM.fmt.money(l.balance)}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    shell(root, 'credits', content);
    root.querySelector('#adjust').addEventListener('click', () => {
      HM.modal({
        title:'התאמת יתרה', size:'narrow',
        body:`
          <div class="field"><label class="label">בעל מקצוע</label><select class="input" id="adjPro">${HM.db.pros.map(p => `<option value="${p.id}">${HM.esc(p.name)} (${HM.fmt.money(p.balance)})</option>`).join('')}</select></div>
          <div class="field"><label class="label">שינוי יתרה (₪, שלילי לניכוי)</label><input class="input" id="adjAmount" type="number" value="100"></div>
          <div class="field" style="margin-bottom:0"><label class="label">סיבה</label><input class="input" id="adjNote" placeholder="פיצוי על עיכוב, תיקון חיוב..."></div>`,
        foot:`<button class="btn btn-primary" id="adjSave">ביצוע</button><button class="btn btn-ghost" data-close>ביטול</button>`,
        onMount(box){
          box.querySelector('#adjSave').addEventListener('click', () => {
            const id = Number(box.querySelector('#adjPro').value);
            const amt = Number(box.querySelector('#adjAmount').value);
            const note = box.querySelector('#adjNote').value || 'התאמה ידנית';
            const p = HM.pro(id);
            p.balance += amt;
            HM.db.ledger.unshift({ id:HM.uid('l'), proId:id, delta:amt, reason:'adjustment', note, createdAt:new Date().toISOString(), balance:p.balance });
            HM.addAudit('מנהל', 'התאמת יתרה ' + HM.fmt.money(amt), p.name, 'credit');
            HM.closeModal(); HM.toast('היתרה עודכנה'); HM.render();
          });
        }
      });
    });
  }

  /* ---------------- Audit ---------------- */
  function audit(root){
    const content = `
      ${head('יומן פעילות', 'כל פעולה רגישה נשמרת — מי, מה, מתי ועל מי', `<button class="btn btn-ghost">${HM.icon('download', 14)} ייצוא</button>`)}
      <div class="panel">
        <div class="panel-body">
          ${HM.db.audit.map(a => `
            <div class="audit">
              <div class="audit-dot" style="background:${a.kind==='risk'?'var(--red)':a.kind==='credit'?'var(--green)':a.kind==='verify'?'var(--blue)':'var(--accent)'}"></div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600">${HM.esc(a.action)}</div>
                <div class="audit-time">${HM.esc(a.actor)} · ${HM.esc(a.target)} · ${HM.fmt.dt(a.at)}</div>
              </div>
              ${HM.badge(a.kind, a.kind==='risk'?'red':a.kind==='credit'?'green':a.kind==='verify'?'blue':'gray')}
            </div>`).join('')}
        </div>
      </div>`;
    shell(root, 'audit', content);
  }

  /* ---------------- Settings ---------------- */
  function settings(root){
    const s = HM.db.settings;
    const content = `
      ${head('הגדרות', 'אזורי השקה, SLA ומצב מערכת', `<button class="btn btn-primary" id="saveSettings">${HM.icon('check', 14)} שמירה</button>`)}
      <div class="grid g2">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('map', 15)} אזורי השקה</div></div>
          <div class="panel-body">
            <div class="row wrap" style="gap:6px;margin-bottom:12px">
              ${s.launchZones.map(z => `<span class="badge blue" style="padding:5px 9px">${HM.esc(z)}</span>`).join('')}
            </div>
            <div class="field" style="margin-bottom:0">
              <label class="label">הוספת שכונה</label>
              <div class="row" style="gap:6px"><input class="input" id="newZone" placeholder="שם השכונה"><button class="btn btn-ghost" id="addZone">הוספה</button></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('clock', 15)} SLA ומדיניות</div></div>
          <div class="panel-body">
            <div class="row2 field">
              <div><label class="label">אימות (שעות)</label><input class="input" type="number" value="${s.slaVerifyHours}"></div>
              <div><label class="label">מחלוקת (שעות)</label><input class="input" type="number" value="72"></div>
            </div>
            <div class="row2 field" style="margin-bottom:0">
              <div><label class="label">ביטול חינם (שעות לפני)</label><input class="input" type="number" value="12"></div>
              <div><label class="label">אחריות פלטפורמה (ימים)</label><input class="input" type="number" value="30"></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('settings', 15)} מצב מערכת</div></div>
          <div class="panel-body stack" style="gap:11px">
            <label class="switch"><input type="checkbox" ${s.maintenance?'checked':''}><span class="track"></span> מצב תחזוקה — חסימת בקשות חדשות</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> רישום בעלי מקצוע פתוח</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> שליחת SMS לפניות דחופות</label>
            <label class="switch"><input type="checkbox"><span class="track"></span> בטא — תשלום בתוך האפליקציה</label>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('shield', 15)} פרטיות ואבטחה</div></div>
          <div class="panel-body stack" style="gap:11px">
            <label class="switch"><input type="checkbox" checked><span class="track"></span> טשטוש מיקום מדויק עד אישור הצעה</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> הצפנת מסמכים ב-Storage</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> לוג גישה למסמכים רגישים</label>
            <label class="switch"><input type="checkbox" checked><span class="track"></span> מחיקת חשבון תוך 30 יום</label>
          </div>
        </div>
      </div>`;
    shell(root, 'settings', content);
    root.querySelector('#saveSettings').addEventListener('click', () => HM.toast('ההגדרות נשמרו'));
    root.querySelector('#addZone').addEventListener('click', () => {
      const v = root.querySelector('#newZone').value.trim();
      if (!v) return;
      s.launchZones.push(v);
      HM.toast('השכונה נוספה לאזורי ההשקה');
      HM.render();
    });
  }

  /* ---------------- Entry ---------------- */
  HM.views.admin = function(root, view){
    const map = { overview, verify, disputes, users, catalog, credits, audit, settings };
    (map[view] || overview)(root);
  };
})();
