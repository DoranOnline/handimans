/* ============================================================
   HANDIMANS — Pro (supplier) experience
   ============================================================ */
(function(){
  const S = HM.state;
  let map = null;

  const NAV = [
    { id:'dashboard', label:'סקירה',        icon:'chart' },
    { id:'leads',     label:'פניות חדשות',  icon:'target', count:() => matchingLeads().length },
    { id:'offers',    label:'ההצעות שלי',   icon:'file',   count:() => myOffers().filter(o => o.status === 'sent').length },
    { id:'jobs',      label:'עבודות ויומן', icon:'calendar' },
    { id:'profile',   label:'פרופיל ואזור', icon:'user' },
    { id:'credits',   label:'יתרה וחיובים', icon:'wallet' },
    { id:'reviews',   label:'דירוגים',      icon:'star' }
  ];

  function me(){ return HM.pro(S.proId) || HM.db.pros[0]; }

  function matchingLeads(){
    const p = me();
    return HM.db.requests
      .filter(r => r.status === 'open' && r.trade === p.trade)
      .map(r => ({ ...r, dist: HM.haversine({ lat:p.lat, lng:p.lng }, r) }))
      .filter(r => r.dist <= 14000)
      .sort((a,b) => a.dist - b.dist);
  }

  function myOffers(){
    return HM.db.offers.filter(o => o.proId === me().id);
  }

  function myJobs(){
    return HM.db.jobs.filter(j => j.proId === me().id);
  }

  function rail(active){
    return `<nav class="rail">
      <div class="rail-label">ניהול עסק</div>
      ${NAV.map(n => {
        const c = n.count ? n.count() : 0;
        return `<button class="rail-item" data-nav="${n.id}" ${active===n.id?'aria-current="page"':''}>
          ${HM.icon(n.icon, 16)}<span>${n.label}</span>${c ? `<span class="count">${c}</span>` : ''}
        </button>`;
      }).join('')}
      <div class="rail-foot">
        <div class="rail-card">
          <h4>${HM.esc(me().name)}</h4>
          <p>יתרה ${HM.fmt.money(me().balance)} · דירוג ${me().rating} · ${me().jobs} עבודות</p>
          <button class="btn" data-nav="credits">טעינת יתרה</button>
        </div>
      </div>
    </nav>`;
  }

  function shell(root, active, content){
    root.innerHTML = rail(active) + `<div class="content">${content}</div>`;
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => HM.go('pro/' + b.dataset.nav)));
  }

  function head(title, sub, actions){
    return `<div class="page-head">
      <div><div class="page-title">${title}</div><div class="page-sub">${sub}</div></div>
      <div class="page-actions">${actions || ''}</div>
    </div>`;
  }

  /* ---------------- Dashboard ---------------- */
  function dashboard(root){
    const p = me();
    const leads = matchingLeads();
    const offers = myOffers();
    const jobs = myJobs();
    const upcoming = jobs.filter(j => j.status === 'scheduled' || j.status === 'in_progress')
      .sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const conv = offers.length ? offers.filter(o => o.status === 'accepted').length / offers.length : 0;

    const content = `
      ${head('סקירה', `שלום ${HM.esc(p.name.split(' ')[0])}, ${leads.length} פניות חדשות מחכות באזור שלך`,
        `<button class="btn btn-ghost" data-nav="profile">${HM.icon('sliders', 14)} אזור שירות</button>
         <button class="btn btn-primary" data-nav="leads">${HM.icon('target', 14)} לפניות</button>`)}

      <div class="grid g4 mb">
        ${HM.kpi('פניות החודש', HM.fmt.num(42), '+18% מול חודש קודם', 'up', HM.spark(HM.SERIES.requests, '#c2ff3d'))}
        ${HM.kpi('שיעור המרה', HM.fmt.pct(conv || 0.28), '+4 נק׳', 'up', HM.spark([.18,.21,.19,.24,.26,.25,.28], '#1d4ed8'))}
        ${HM.kpi('הכנסה משוערת', HM.fmt.money(p.earnings), '+12%', 'up', HM.spark(HM.SERIES.gmv, '#15803d'))}
        ${HM.kpi('דירוג', p.rating.toFixed(1) + ' <small>/ 5</small>', p.reviews + ' ביקורות', 'flat', HM.spark([4.6,4.7,4.7,4.8,4.8,4.9,4.9], '#f59e0b'))}
      </div>

      <div class="grid g-2-1 mb">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">${HM.icon('target', 15)} פניות מתאימות באזור</div>
            ${HM.badge(leads.length + ' פתוחות', 'orange', true)}
          </div>
          <div class="panel-body flush">
            ${leads.length ? leads.slice(0,4).map(r => leadRow(r)).join('') : HM.empty('check', 'אין פניות חדשות', 'כשתפתח בקשה באזור שלך — תופיע כאן מיד.')}
          </div>
          <div class="panel-foot"><button class="btn btn-ghost btn-sm btn-block" data-nav="leads">לכל הפניות</button></div>
        </div>

        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('calendar', 15)} העבודות הקרובות</div></div>
            <div class="panel-body flush">
              ${upcoming.length ? upcoming.slice(0,3).map(j => `
                <div class="lrow" data-job="${j.id}">
                  <div class="avatar sm" style="background:${HM.trade(j.trade).color}">${HM.icon(HM.trade(j.trade).icon, 14)}</div>
                  <div class="lrow-main">
                    <div class="lrow-title">${HM.esc(j.customer)}</div>
                    <div class="lrow-sub">${HM.fmt.dateLong(j.scheduledAt)} · ${HM.fmt.time(j.scheduledAt)} · ${HM.esc(j.address)}</div>
                  </div>
                  ${HM.badge(j.status === 'in_progress' ? 'בביצוע' : 'מתוזמן', j.status === 'in_progress' ? 'orange' : 'violet')}
                </div>`).join('') : HM.empty('calendar', 'אין עבודות מתוזמנות', 'אישור הצעה יוצר עבודה אוטומטית.')}
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('wallet', 15)} ארנק לפניות</div></div>
            <div class="panel-body">
              <div class="row" style="justify-content:space-between;align-items:flex-end">
                <div>
                  <div style="font-size:28px;font-weight:900;letter-spacing:-1px;line-height:1">${HM.fmt.money(p.balance)}</div>
                  <div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px">יתרה זמינה · פנייה = ${HM.fmt.money(HM.db.settings.leadPrice)}</div>
                </div>
                <button class="btn btn-primary btn-sm" data-nav="credits">טעינה</button>
              </div>
              <div class="divider"></div>
              <div class="kv"><dt>פניות שנשלחו החודש</dt><dd>${offers.length}</dd></div>
              <div class="kv"><dt>שולם על פניות</dt><dd>${HM.fmt.money(offers.length * HM.db.settings.leadPrice)}</dd></div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid g3">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('trending', 15)} פניות ב-12 חודשים</div></div>
          <div class="panel-body">${HM.bars(HM.SERIES.requests, ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'], '#c2ff3d', 130)}</div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('percent', 15)} משפך המרה</div></div>
          <div class="panel-body">
            ${[['פניות שנשלחו', offers.length, 1], ['הצעות שנשלחו', offers.length, 1], ['אושרו', offers.filter(o=>o.status==='accepted').length, conv], ['הושלמו', jobs.filter(j=>j.status==='completed').length, jobs.length?jobs.filter(j=>j.status==='completed').length/jobs.length:0]].map(([l,v,r]) => `
              <div style="margin-bottom:11px">
                <div class="row" style="justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:4px"><span>${l}</span><span>${v}</span></div>
                ${HM.progress(r, 'blue')}
              </div>`).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('shieldCheck', 15)} מצב החשבון</div></div>
          <div class="panel-body">
            <div class="row" style="gap:9px;margin-bottom:12px">
              <div style="width:38px;height:38px;border-radius:10px;background:var(--green-soft);color:var(--green);display:grid;place-items:center">${HM.icon('shieldCheck', 19)}</div>
              <div><div style="font-size:12.5px;font-weight:800">מאומת ומאושר</div><div style="font-size:10.5px;color:var(--muted)">ת״ז · עוסק · ביטוח בתוקף</div></div>
            </div>
            <div class="kv"><dt>שיעור קבלה</dt><dd>${HM.fmt.pct(p.acceptance)}</dd></div>
            <div class="kv"><dt>שיעור השלמה</dt><dd>${HM.fmt.pct(p.completion)}</dd></div>
            <div class="kv"><dt>זמן תגובה ממוצע</dt><dd>${p.resp} דק׳</dd></div>
            <div class="kv"><dt>חבר מאז</dt><dd>${HM.fmt.date(p.joined)}</dd></div>
          </div>
        </div>
      </div>`;

    shell(root, 'dashboard', content);
  }

  function leadRow(r){
    const urg = { emergency:['דחוף','red'], today:['היום','amber'], this_week:['השבוע','blue'], flexible:['גמיש','gray'] }[r.urgency];
    return `<div class="lrow" data-lead="${r.id}">
      <div class="avatar sm" style="background:${HM.trade(r.trade).color}">${HM.icon(HM.trade(r.trade).icon, 14)}</div>
      <div class="lrow-main">
        <div class="lrow-title">${HM.esc(r.desc.slice(0, 46))}${r.desc.length > 46 ? '…' : ''}</div>
        <div class="lrow-sub">${HM.esc(r.address)} · ${HM.fmt.dist(r.dist)} · ${HM.fmt.rel(r.createdAt)}</div>
      </div>
      <div class="lrow-end">
        ${HM.badge(urg[0], urg[1])}
        ${r.budget ? `<span style="font-size:11.5px;font-weight:800">${HM.fmt.money(r.budget)}</span>` : ''}
      </div>
    </div>`;
  }

  /* ---------------- Leads ---------------- */
  function leads(root){
    const list = matchingLeads();
    const content = `
      ${head('פניות חדשות', `${list.length} בקשות פתוחות בתוך אזור השירות שלך`, `<button class="btn btn-ghost" data-nav="profile">${HM.icon('sliders', 14)} עדכון רדיוס</button>`)}
      <div class="panel mb">
        <div class="panel-head">
          <div class="panel-title">${HM.icon('target', 15)} פניות בטווח</div>
          <div class="row" style="gap:6px">${HM.badge('פנייה = ' + HM.fmt.money(HM.db.settings.leadPrice), 'orange')}${HM.badge('יתרה ' + HM.fmt.money(me().balance), 'gray')}</div>
        </div>
        <div class="panel-body flush">
          ${list.length ? list.map(r => {
            const urg = { emergency:['דחוף','red'], today:['היום','amber'], this_week:['השבוע','blue'], flexible:['גמיש','gray'] }[r.urgency];
            const already = HM.db.offers.find(o => o.requestId === r.id && o.proId === me().id);
            return `<div style="padding:13px 16px;border-bottom:1px solid var(--line-2)">
              <div class="row" style="align-items:flex-start;gap:11px">
                <div class="avatar md" style="background:${HM.trade(r.trade).color}">${HM.icon(HM.trade(r.trade).icon, 17)}</div>
                <div style="flex:1;min-width:0">
                  <div class="row wrap" style="gap:6px">
                    <span style="font-size:13px;font-weight:800">${HM.trade(r.trade).name}</span>
                    ${HM.badge(urg[0], urg[1])}
                    ${HM.badge(HM.fmt.dist(r.dist), 'gray')}
                    ${r.budget ? HM.badge('תקציב ' + HM.fmt.money(r.budget), 'gray') : ''}
                  </div>
                  <div style="font-size:12px;color:var(--ink-2);margin-top:6px;line-height:1.55">${HM.esc(r.desc)}</div>
                  <div style="font-size:10.5px;color:var(--faint);margin-top:5px">${HM.esc(r.address)} · ${HM.fmt.rel(r.createdAt)} · ${r.photos} תמונות</div>
                </div>
                <div style="flex-shrink:0">
                  ${already
                    ? HM.badge(already.status === 'accepted' ? 'נבחרה' : 'הצעה נשלחה', already.status === 'accepted' ? 'green' : 'blue')
                    : `<button class="btn btn-primary btn-sm" data-offer="${r.id}">שלח הצעה</button>`}
                </div>
              </div>
            </div>`;
          }).join('') : HM.empty('check', 'אין פניות פתוחות', 'כל הפניות באזור שלך טופלו. נעדכן אותך כשתיפתח בקשה חדשה.')}
        </div>
      </div>
      <div class="panel">
        <div class="panel-body" style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;flex-shrink:0">${HM.icon('info', 17)}</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.6">
            <b style="color:var(--ink-2)">איך מחויבים?</b> 100 ₪ לפנייה, ורק כשאתם שולחים הצעה בפועל. אין חיוב על צפייה בפניות ואין עמלה על העבודה שתסגרו. פרסום העסק מחוץ לאפליקציה הוא הוצאה שלכם — אנחנו לא מוכרים פרסום.
          </div>
        </div>
      </div>`;

    shell(root, 'leads', content);
    root.querySelectorAll('[data-offer]').forEach(b => b.addEventListener('click', () => openComposer(b.dataset.offer)));
  }

  function openComposer(requestId){
    const r = HM.request(requestId);
    const p = me();
    if (p.balance < HM.db.settings.leadPrice){
      HM.modal({
        title:'אין מספיק יתרה', size:'narrow',
        body:`<div class="empty" style="padding:10px 0">
          <div class="empty-icon" style="background:var(--amber-soft);color:var(--amber)">${HM.icon('wallet', 24)}</div>
          <h3>צריך ${HM.fmt.money(HM.db.settings.leadPrice)} לפנייה</h3>
          <p>יתרתך ${HM.fmt.money(p.balance)}. טענו יתרה כדי לשלוח הצעה לפניות.</p>
        </div>`,
        foot:`<button class="btn btn-primary" id="goCredits">לטעינת יתרה</button><button class="btn btn-ghost" data-close>סגירה</button>`,
        onMount(box){
          box.querySelector('#goCredits').addEventListener('click', () => { HM.closeModal(); HM.go('pro/credits'); });
        }
      });
      return;
    }
    HM.modal({
      title:'שליחת הצעה',
      sub:`${HM.trade(r.trade).name} · ${HM.esc(r.address)} · ${HM.fmt.dist(HM.haversine({lat:p.lat,lng:p.lng}, r))} ממך`,
      body:`
        <div style="background:var(--surface-2);border:1px solid var(--line);border-radius:11px;padding:11px;font-size:12px;line-height:1.55;color:var(--ink-2);margin-bottom:14px">${HM.esc(r.desc)}</div>
        <div class="row3 field">
          <div><label class="label" for="oPrice">מחיר (₪)</label><input class="input" id="oPrice" type="number" min="0" value="${r.budget || p.price[0]}"></div>
          <div><label class="label" for="oEta">הגעה (דק׳)</label><input class="input" id="oEta" type="number" min="0" value="60"></div>
          <div><label class="label" for="oWar">אחריות (חודשים)</label><input class="input" id="oWar" type="number" min="0" max="60" value="12"></div>
        </div>
        <div class="field">
          <label class="label" for="oMsg">הודעה ללקוח</label>
          <textarea class="input" id="oMsg" placeholder="מה כולל המחיר, מתי תגיע, ומה קורה אם צריך חלקים.">מגיע היום, מחיר כולל חלקים ואחריות.</textarea>
        </div>
        <div class="row" style="justify-content:space-between;padding:10px 12px;background:var(--accent-soft);border-radius:10px;font-size:11.5px;font-weight:700;color:var(--accent-2)">
          <span>עלות הפנייה</span><span>${HM.fmt.money(HM.db.settings.leadPrice)} · יתרה ${HM.fmt.money(p.balance)}</span>
        </div>`,
      foot:`<button class="btn btn-primary" id="sendOffer">${HM.icon('send', 14)} שלח הצעה</button><button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        box.querySelector('#sendOffer').addEventListener('click', () => {
          const price = Number(box.querySelector('#oPrice').value);
          if (!price || price <= 0){ box.querySelector('#oPrice').focus(); HM.toast('הזינו מחיר', 'warn'); return; }
          if (!HM.chargeLead(p.id, HM.db.settings.leadPrice, 'פנייה — ' + HM.trade(r.trade).name + ' ב' + r.address)){
            HM.toast('אין מספיק יתרה', 'warn'); return;
          }
          HM.db.offers.unshift({
            id:HM.uid('o'), requestId, proId:p.id, price,
            eta:Number(box.querySelector('#oEta').value) || 60,
            warranty:Number(box.querySelector('#oWar').value) || 0,
            message:box.querySelector('#oMsg').value.trim(),
            status:'sent', createdAt:new Date().toISOString()
          });
          r.offers = (r.offers || 0) + 1;
          HM.addAudit(p.name, 'שלח הצעת מחיר ' + HM.fmt.money(price), r.id, 'offer');
          HM.addAudit('מערכת', 'חיוב ' + HM.fmt.money(HM.db.settings.leadPrice) + ' לפנייה', p.name, 'credit');
          HM.closeModal();
          HM.toast('ההצעה נשלחה · ' + HM.fmt.money(HM.db.settings.leadPrice) + ' ירדו מהיתרה');
          HM.render();
        });
      }
    });
  }

  /* ---------------- Offers ---------------- */
  function offers(root){
    const list = myOffers().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const content = `
      ${head('ההצעות שלי', `${list.length} הצעות · ${list.filter(o=>o.status==='accepted').length} אושרו`, '')}
      <div class="panel">
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>בקשה</th><th>לקוח</th><th>מחיר</th><th>הגעה</th><th>אחריות</th><th>נשלחה</th><th>סטטוס</th></tr></thead>
            <tbody>
              ${list.length ? list.map(o => {
                const r = HM.request(o.requestId);
                const st = { sent:['ממתינה','amber'], accepted:['אושרה','green'], declined:['לא נבחרה','gray'], expired:['פגה','gray'], withdrawn:['בוטלה','gray'] }[o.status];
                return `<tr>
                  <td><div class="cell-main">${HM.trade(r.trade).name}</div><div class="cell-sub">${HM.esc(r.address)}</div></td>
                  <td>${HM.esc(r.customer)}</td>
                  <td class="num">${HM.fmt.money(o.price)}</td>
                  <td>${o.eta} דק׳</td>
                  <td>${o.warranty} ח׳</td>
                  <td style="color:var(--muted)">${HM.fmt.rel(o.createdAt)}</td>
                  <td>${HM.badge(st[0], st[1])}</td>
                </tr>`;
              }).join('') : `<tr><td colspan="7">${HM.empty('file', 'אין הצעות עדיין', 'שלחו הצעה ראשונה מפניות חדשות.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    shell(root, 'offers', content);
  }

  /* ---------------- Jobs ---------------- */
  function jobs(root){
    const list = myJobs().sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const base = new Date();
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    const days = Array.from({ length:7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
    const dayNames = ['א','ב','ג','ד','ה','ו','ש'];

    const content = `
      ${head('עבודות ויומן', `${list.filter(j=>j.status!=='completed').length} עבודות פתוחות · ${list.filter(j=>j.status==='completed').length} הושלמו`, '')}
      <div class="grid g-2-1 mb">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('calendar', 15)} השבוע</div><span style="font-size:11px;color:var(--muted)">${HM.fmt.dateLong(days[0].toISOString())} – ${HM.fmt.dateLong(days[6].toISOString())}</span></div>
          <div class="panel-body">
            <div class="cal">
              ${dayNames.map(d => `<div class="cal-head">${d}</div>`).join('')}
              ${days.map(d => {
                const evs = list.filter(j => new Date(j.scheduledAt).toDateString() === d.toDateString());
                const today = d.toDateString() === base.toDateString();
                return `<div class="cal-day ${today?'today':''}">
                  <div class="d">${d.getDate()}</div>
                  ${evs.map(j => `<div class="cal-ev ${j.status==='completed'?'green':'orange'}" title="${HM.esc(j.customer)}">${HM.fmt.time(j.scheduledAt)} ${HM.esc(j.customer.split(' ')[0])}</div>`).join('')}
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('clock', 15)} הבא בתור</div></div>
          <div class="panel-body">
            ${list.filter(j => j.status !== 'completed').slice(0,3).map(j => `
              <div style="padding:10px 0;border-bottom:1px dashed var(--line-2)">
                <div class="row" style="justify-content:space-between"><span style="font-size:12.5px;font-weight:800">${HM.esc(j.customer)}</span>${HM.badge(j.status==='in_progress'?'בביצוע':'מתוזמן', j.status==='in_progress'?'orange':'violet')}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:3px">${HM.fmt.dateLong(j.scheduledAt)} · ${HM.fmt.time(j.scheduledAt)}</div>
                <div style="font-size:11px;color:var(--muted)">${HM.esc(j.address)}</div>
                <div class="row" style="margin-top:7px;gap:6px">
                  <button class="btn btn-ghost btn-sm" data-start="${j.id}">${j.status==='in_progress'?'סיום עבודה':'התחל'}</button>
                  <span style="font-size:11.5px;font-weight:800">${HM.fmt.money(j.finalPrice)}</span>
                </div>
              </div>`).join('') || HM.empty('calendar', 'אין עבודות', 'אישור הצעה יוצר עבודה.')}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('briefcase', 15)} כל העבודות</div></div>
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>לקוח</th><th>מקצוע</th><th>כתובת</th><th>מועד</th><th>מחיר</th><th>סטטוס</th><th></th></tr></thead>
            <tbody>${list.map(j => {
              const st = { scheduled:['מתוזמן','violet'], in_progress:['בביצוע','orange'], completed:['הושלם','green'], disputed:['במחלוקת','red'], cancelled:['בוטל','gray'] }[j.status];
              return `<tr>
                <td class="cell-main">${HM.esc(j.customer)}</td>
                <td>${HM.trade(j.trade).name}</td>
                <td style="color:var(--muted)">${HM.esc(j.address)}</td>
                <td>${HM.fmt.dt(j.scheduledAt)}</td>
                <td class="num">${HM.fmt.money(j.finalPrice)}</td>
                <td>${HM.badge(st[0], st[1])}</td>
                <td><button class="btn btn-ghost btn-sm" data-start="${j.id}">${j.status==='completed'?'פרטים':j.status==='in_progress'?'סיום':'התחל'}</button></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;

    shell(root, 'jobs', content);
    root.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => {
      const j = HM.job(b.dataset.start);
      if (!j) return;
      if (j.status === 'scheduled'){ j.status = 'in_progress'; HM.toast('העבודה סומנה כבביצוע'); }
      else if (j.status === 'in_progress'){ j.status = 'completed'; j.paid = true; HM.toast('העבודה הושלמה · נשלח ללקוח לדירוג'); }
      else { HM.toast('העבודה כבר הושלמה'); return; }
      HM.render();
    }));
  }

  /* ---------------- Profile ---------------- */
  function profile(root){
    const p = me();
    const content = `
      ${head('פרופיל ואזור שירות', 'מה שרואים לקוחות, ואיפה אתם מוכנים לעבוד', `<button class="btn btn-primary" id="saveProfile">${HM.icon('check', 14)} שמירה</button>`)}
      <div class="grid g-1-2">
        <div class="stack">
          <div class="panel">
            <div class="panel-body" style="text-align:center">
              ${HM.avatar(p.name, HM.trade(p.trade).color, 'xl')}
              <div style="font-size:16px;font-weight:900;margin-top:9px">${HM.esc(p.name)}</div>
              <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${HM.trade(p.trade).name} · ${p.years} שנות ניסיון</div>
              <div class="row" style="justify-content:center;gap:6px;margin-top:9px">
                ${p.verified ? HM.badge('מאומת','blue') : HM.badge('ממתין לאימות','amber')}
                ${HM.badge('★ ' + p.rating, 'gray')}
              </div>
              <div class="divider"></div>
              <div class="kv"><dt>שיעור קבלה</dt><dd>${HM.fmt.pct(p.acceptance)}</dd></div>
              <div class="kv"><dt>שיעור השלמה</dt><dd>${HM.fmt.pct(p.completion)}</dd></div>
              <div class="kv"><dt>עבודות שהושלמו</dt><dd>${p.jobs}</dd></div>
              <div class="kv"><dt>חבר מאז</dt><dd>${HM.fmt.date(p.joined)}</dd></div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('shieldCheck', 15)} אימות ומסמכים</div></div>
            <div class="panel-body">
              ${[['תעודת זהות','id_card',true],['עוסק מורשה','business',true],['ביטוח אחריות מקצועית','insurance',p.insurance],['תעודת מקצוע','certificate',true]].map(([label,kind,ok]) => `
                <div class="doc" style="margin-bottom:7px">
                  <div class="doc-ico">${HM.icon('file', 15)}</div>
                  <div style="flex:1"><div style="font-weight:700">${label}</div><div style="font-size:10px;color:var(--muted)">${ok?'בתוקף · אושר':'חסר · חוסם קטגוריות מסוכנות'}</div></div>
                  ${ok ? HM.badge('מאושר','green') : HM.badge('חסר','red')}
                </div>`).join('')}
              <button class="btn btn-ghost btn-sm btn-block" style="margin-top:6px">${HM.icon('plus', 13)} העלאת מסמך</button>
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">${HM.icon('map', 15)} אזור השירות</div>
              <span style="font-size:11px;font-weight:800;color:var(--accent-2)" id="proRadiusVal">10 ק״מ</span>
            </div>
            <div class="panel-body">
              <input type="range" id="proRadius" min="2" max="30" step="1" value="10" aria-label="רדיוס שירות">
              <div class="range-scale"><span>2 ק״מ</span><span>30 ק״מ</span></div>
              <div id="proMap" style="height:220px;border-radius:12px;margin-top:12px;overflow:hidden;border:1px solid var(--line)"></div>
              <div class="hint">הרדיוס קובע אילו פניות יופיעו אצלך. רדיוס גדול = יותר פניות אבל יותר נסיעות.</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('sliders', 15)} תמחור וזמינות</div></div>
            <div class="panel-body">
              <div class="row2 field">
                <div><label class="label">מחיר החל מ־</label><input class="input" type="number" value="${p.price[0]}"></div>
                <div><label class="label">עד</label><input class="input" type="number" value="${p.price[1]}"></div>
              </div>
              <div class="row2 field">
                <div><label class="label">מחיר קריאה</label><input class="input" type="number" value="${p.callout}"></div>
                <div><label class="label">זמן תגובה (דק׳)</label><input class="input" type="number" value="${p.resp}"></div>
              </div>
              <div class="field" style="margin-bottom:0">
                <label class="label">זמינות</label>
                <div class="segmented block">
                  <button aria-pressed="${p.avail==='now'}">עכשיו</button>
                  <button aria-pressed="${p.avail==='soon'}">מחר</button>
                  <button aria-pressed="${p.avail==='later'}">השבוע</button>
                  <button aria-pressed="false">לא זמין</button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('bell', 15)} התראות</div></div>
            <div class="panel-body stack" style="gap:11px">
              <label class="switch"><input type="checkbox" checked><span class="track"></span> התראת push על פנייה חדשה</label>
              <label class="switch"><input type="checkbox" checked><span class="track"></span> SMS לפנייה דחופה בלבד</label>
              <label class="switch"><input type="checkbox"><span class="track"></span> וואטסאפ (בקרוב)</label>
            </div>
          </div>
        </div>
      </div>`;

    shell(root, 'profile', content);
    initProMap();
    const r = root.querySelector('#proRadius');
    r.addEventListener('input', () => {
      root.querySelector('#proRadiusVal').textContent = r.value + ' ק״מ';
      r.style.setProperty('--pct', ((r.value - 2) / 28 * 100) + '%');
      if (map && map._circle) map._circle.setRadius(Number(r.value) * 1000);
    });
    r.style.setProperty('--pct', ((10 - 2) / 28 * 100) + '%');
    root.querySelector('#saveProfile').addEventListener('click', () => HM.toast('הפרופיל נשמר'));
  }

  function initProMap(){
    const el = document.getElementById('proMap');
    if (!el) return;
    const p = me();
    map = L.map('proMap', { zoomControl:false, attributionControl:false }).setView([p.lat, p.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);
    map._circle = L.circle([p.lat, p.lng], {
      radius:10000, color:'#c2ff3d', weight:1.5, fillColor:'#c2ff3d', fillOpacity:.08, dashArray:'5 6'
    }).addTo(map);
    L.marker([p.lat, p.lng], {
      icon:L.divIcon({ className:'', html:'<div class="job-pin"></div>', iconSize:[20,20], iconAnchor:[10,10] })
    }).addTo(map);
    setTimeout(() => map && map.invalidateSize(), 120);
  }

  /* ---------------- Balance ---------------- */
  function credits(root){
    const p = me();
    const ledger = HM.db.ledger.filter(l => l.proId === p.id);
    const packs = [
      { amount:500,  leads:5,  bonus:0, label:'התחלה' },
      { amount:1000, leads:10, bonus:1, label:'פופולרי', hot:true },
      { amount:2500, leads:25, bonus:3, label:'עסקי' }
    ];
    const content = `
      ${head('יתרה וחיובים', 'פנייה = ' + HM.fmt.money(HM.db.settings.leadPrice) + ' · אין עמלה על העבודות שתסגרו', '')}
      <div class="grid g-1-2 mb">
        <div class="panel" style="background:linear-gradient(150deg,#151b26,#1e2a3b);border:0;color:#fff">
          <div class="panel-body">
            <div style="font-size:11px;font-weight:700;color:#b9c7d8">יתרה זמינה</div>
            <div style="font-size:44px;font-weight:900;letter-spacing:-2px;line-height:1.1;margin-top:4px">${HM.fmt.money(p.balance)}</div>
            <div style="font-size:11.5px;color:#b9c7d8;margin-top:4px">≈ ${Math.floor(p.balance / HM.db.settings.leadPrice)} פניות</div>
            <div class="divider" style="background:rgba(255,255,255,.14)"></div>
            <div class="kv" style="color:#dbe4ee"><dt style="color:#b9c7d8">נטען החודש</dt><dd>${HM.fmt.money(ledger.filter(l=>l.delta>0).reduce((s,l)=>s+l.delta,0))}</dd></div>
            <div class="kv" style="color:#dbe4ee"><dt style="color:#b9c7d8">פניות שנשלחו</dt><dd>${ledger.filter(l=>l.delta<0).length}</dd></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">${HM.icon('package', 15)} טעינת יתרה</div></div>
          <div class="panel-body grid g3" style="gap:9px">
            ${packs.map(pk => `
              <div style="border:1.5px solid ${pk.hot?'var(--accent)':'var(--line)'};border-radius:12px;padding:12px;text-align:center;position:relative;background:${pk.hot?'var(--accent-soft)':'var(--surface)'}">
                ${pk.hot ? `<span style="position:absolute;top:-8px;right:50%;transform:translateX(50%);background:var(--accent);color:var(--accent-ink);font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px">${pk.label}</span>` : ''}
                <div style="font-size:22px;font-weight:900;letter-spacing:-.8px">${HM.fmt.money(pk.amount)}</div>
                <div style="font-size:10px;color:var(--muted);font-weight:600">${pk.leads} פניות${pk.bonus?` +${pk.bonus} בונוס`:''}</div>
                <div style="font-size:13px;font-weight:800;margin:7px 0 9px">${HM.fmt.money(pk.amount)}</div>
                <button class="btn ${pk.hot?'btn-primary':'btn-ghost'} btn-sm btn-block" data-pack="${pk.amount + pk.bonus * HM.db.settings.leadPrice}">רכישה</button>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="panel mb">
        <div class="panel-body" style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;flex-shrink:0">${HM.icon('info', 17)}</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.6">
            <b style="color:var(--ink-2)">מה כלול ומה לא.</b> ${HM.fmt.money(HM.db.settings.leadPrice)} לפנייה — נגבים רק על פנייה שנשלחה אליה הצעה. אין עמלה על העבודה שתסגרו. פרסום העסק מחוץ לאפליקציה הוא הוצאה שלכם; אנחנו לא מוכרים פרסום ולא גובים עליו.
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('history', 15)} תנועות</div></div>
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>שינוי</th><th>יתרה</th></tr></thead>
            <tbody>${ledger.map(l => {
              const kind = { purchase:['טעינה','green'], lead_charge:['חיוב פנייה','orange'], refund:['החזר','blue'], bonus:['בונוס','violet'], adjustment:['התאמה','gray'] }[l.reason];
              return `<tr>
                <td style="color:var(--muted)">${HM.fmt.dt(l.createdAt)}</td>
                <td>${HM.badge(kind[0], kind[1])}</td>
                <td>${HM.esc(l.note)}</td>
                <td class="num" style="color:${l.delta>0?'var(--green)':'var(--red)'}">${l.delta>0?'+':'−'}${HM.fmt.money(Math.abs(l.delta))}</td>
                <td class="num">${HM.fmt.money(l.balance)}</td>
              </tr>`;
            }).join('') || `<tr><td colspan="5">${HM.empty('wallet','אין תנועות','טענו יתרה כדי להתחיל.')}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;

    shell(root, 'credits', content);
    root.querySelectorAll('[data-pack]').forEach(b => b.addEventListener('click', () => {
      const amount = Number(b.dataset.pack);
      HM.topUp(p.id, amount, 'טעינת יתרה — ' + Math.floor(amount / HM.db.settings.leadPrice) + ' פניות');
      HM.addAudit(p.name, 'טען יתרה ' + HM.fmt.money(amount), p.name, 'credit');
      HM.toast(HM.fmt.money(amount) + ' נוספו ליתרה');
      HM.render();
    }));
  }

  /* ---------------- Reviews ---------------- */
  function reviews(root){
    const p = me();
    const list = HM.db.reviews.filter(r => r.proId === p.id);
    const dist = [5,4,3,2,1].map(n => ({ n, c:list.filter(r => r.rating === n).length }));
    const content = `
      ${head('דירוגים', `${list.length} ביקורות · ממוצע ${p.rating}`, '')}
      <div class="grid g-1-2">
        <div class="panel">
          <div class="panel-body" style="text-align:center">
            <div style="font-size:44px;font-weight:900;letter-spacing:-2px;line-height:1">${p.rating}</div>
            <div style="color:#f59e0b;font-size:16px;letter-spacing:2px;margin:4px 0">★★★★★</div>
            <div style="font-size:11px;color:var(--muted)">${p.reviews} ביקורות</div>
            <div class="divider"></div>
            ${dist.map(d => `
              <div class="row" style="gap:8px;margin-bottom:6px">
                <span style="font-size:10.5px;font-weight:700;width:10px">${d.n}</span>
                <div style="flex:1">${HM.progress(d.c / Math.max(1,list.length), '')}</div>
                <span style="font-size:10px;color:var(--muted);width:14px;text-align:left">${d.c}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="stack">
          ${list.map(r => `
            <div class="panel">
              <div class="panel-body">
                <div class="row" style="justify-content:space-between">
                  <div class="row" style="gap:8px">${HM.avatar(r.author, '#64748b', 'sm')}<div><div style="font-size:12.5px;font-weight:800">${HM.esc(r.author)}</div><div style="font-size:10px;color:var(--muted)">${HM.fmt.rel(r.createdAt)}</div></div></div>
                  <span style="color:#f59e0b;font-weight:800;font-size:12px">${'★'.repeat(r.rating)}<span style="color:#e2e8f0">${'★'.repeat(5-r.rating)}</span></span>
                </div>
                <div style="font-size:12px;line-height:1.6;color:var(--ink-2);margin-top:9px">${HM.esc(r.text)}</div>
                ${r.photos ? `<div class="row" style="gap:5px;margin-top:8px">${Array.from({length:r.photos}).map(() => `<div style="width:44px;height:44px;border-radius:8px;background:var(--bg);display:grid;place-items:center;color:var(--faint)">${HM.icon('image', 16)}</div>`).join('')}</div>` : ''}
              </div>
            </div>`).join('') || HM.empty('star', 'אין ביקורות עדיין', 'ביקורות נכתבות רק אחרי עבודה שהושלמה.')}
        </div>
      </div>`;
    shell(root, 'reviews', content);
  }

  /* ---------------- Entry ---------------- */
  HM.views.pro = function(root, view){
    if (map){ map.remove(); map = null; }
    const mapView = { dashboard, leads, offers, jobs, profile, credits, reviews };
    (mapView[view] || dashboard)(root);
  };
})();
