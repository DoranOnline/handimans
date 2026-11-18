/* ============================================================
   HANDIMANS — Contractor (business) experience
   ============================================================ */
(function(){
  const S = HM.state;
  const B = () => HM.db.business;
  const svc = id => HM.db.services.find(s => s.id === id) || { name:'שירות', price:0, duration:60 };
  const member = id => HM.db.team.find(t => t.id === id) || { name:'—', color:'#64748b', role:'' };

  const WEEK = [
    { d:'2026-11-15', name:'ראשון' }, { d:'2026-11-16', name:'שני' },
    { d:'2026-11-17', name:'שלישי' }, { d:'2026-11-18', name:'רביעי' },
    { d:'2026-11-19', name:'חמישי' }, { d:'2026-11-20', name:'שישי' },
    { d:'2026-11-21', name:'שבת' }
  ];
  const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  const TODAY = '2026-11-18';

  const STATUS = {
    pending:     { label:'ממתין לאישור', tone:'amber' },
    confirmed:   { label:'מאושר',        tone:'blue' },
    in_progress: { label:'בביצוע',       tone:'orange' },
    done:        { label:'הושלם',        tone:'green' },
    no_show:     { label:'לא הגיע',      tone:'red' },
    cancelled:   { label:'בוטל',         tone:'gray' }
  };

  const NAV = [
    { id:'dashboard', label:'סקירה',          icon:'chart' },
    { id:'calendar',  label:'יומן ותורים',    icon:'calendar', count:() => dayAppts(TODAY).filter(a => a.status !== 'cancelled').length },
    { id:'queue',     label:'תור המתנה',      icon:'clock',    count:() => HM.db.waitlist.length },
    { id:'team',      label:'צוות',           icon:'users',    count:() => HM.db.team.filter(t => t.active).length },
    { id:'page',      label:'העמוד הציבורי',  icon:'external' },
    { id:'leads',     label:'פניות ולידים',   icon:'target' },
    { id:'settings',  label:'הגדרות העסק',    icon:'settings' }
  ];

  function dayAppts(d){
    return HM.db.appointments.filter(a => a.day === d).sort((a,b) => a.start.localeCompare(b.start));
  }
  function activeTeam(){ return HM.db.team.filter(t => t.active); }
  function loadOf(t){
    const n = dayAppts(TODAY).filter(a => a.teamId === t.id && a.status !== 'cancelled').length;
    return { n, pct: Math.min(1, n / Math.max(1, t.capacity)) };
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
          <h4>${HM.esc(B().name)}</h4>
          <p>יתרה ${HM.fmt.money(B().balance)} · ${activeTeam().length} אנשי צוות · דירוג ${B().rating}</p>
          <button class="btn" data-nav="page">לעמוד הציבורי</button>
        </div>
      </div>
    </nav>`;
  }

  function shell(root, active, content){
    root.innerHTML = rail(active) + `<div class="content">${content}</div>`;
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => HM.go('contractor/' + b.dataset.nav)));
  }

  function head(title, sub, actions){
    return `<div class="page-head">
      <div><div class="page-title">${title}</div><div class="page-sub">${sub}</div></div>
      <div class="page-actions">${actions || ''}</div>
    </div>`;
  }

  /* ---------------- Booking modal ---------------- */
  function bookModal(pre){
    pre = pre || {};
    const day = pre.day || S.contractorDay || TODAY;
    HM.modal({
      title: pre.waitId ? 'שיבוץ מהמתנה' : 'קביעת תור', size:'narrow',
      sub:'התור נכנס ליומן ונשלח אישור ללקוח',
      body:`
        <div class="grid g2" style="gap:10px">
          <div class="field" style="margin:0"><label class="label">שם לקוח</label><input class="input" id="apName" value="${HM.esc(pre.customer||'')}" placeholder="שם מלא"></div>
          <div class="field" style="margin:0"><label class="label">טלפון</label><input class="input" id="apPhone" value="${HM.esc(pre.phone||'')}" placeholder="050-0000000"></div>
        </div>
        <div class="field"><label class="label">שירות</label><select class="input" id="apService">${HM.db.services.map(s => `<option value="${s.id}" ${pre.serviceId===s.id?'selected':''}>${HM.esc(s.name)} · ${HM.fmt.money(s.price)} · ${s.duration} דק׳</option>`).join('')}</select></div>
        <div class="grid g2" style="gap:10px">
          <div class="field" style="margin:0"><label class="label">איש צוות</label><select class="input" id="apTeam">${activeTeam().map(t => `<option value="${t.id}" ${pre.teamId===t.id?'selected':''}>${HM.esc(t.name)}</option>`).join('')}</select></div>
          <div class="field" style="margin:0"><label class="label">מחיר (₪)</label><input class="input" id="apPrice" type="number" value="${pre.price || svc(pre.serviceId||'s1').price}"></div>
        </div>
        <div class="grid g2" style="gap:10px">
          <div class="field" style="margin:0"><label class="label">יום</label><select class="input" id="apDay">${WEEK.map(d => `<option value="${d.d}" ${day===d.d?'selected':''}>${d.name} · ${HM.fmt.date(d.d)}</option>`).join('')}</select></div>
          <div class="field" style="margin:0"><label class="label">שעה</label><select class="input" id="apStart">${HOURS.map(h => `<option value="${h}" ${pre.start===h?'selected':''}>${h}</option>`).join('')}</select></div>
        </div>
        <div class="field" style="margin-bottom:0"><label class="label">כתובת</label><input class="input" id="apAddr" value="${HM.esc(pre.address||'')}" placeholder="רחוב, מספר, עיר"></div>`,
      foot:`<button class="btn btn-primary" id="saveAppt">${HM.icon('check', 14)} שמור תור</button><button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        box.querySelector('#saveAppt').addEventListener('click', () => {
          const name = box.querySelector('#apName').value.trim();
          if (!name){ HM.toast('צריך שם לקוח', 'warn'); return; }
          const serviceId = box.querySelector('#apService').value;
          HM.db.appointments.push({
            id: HM.uid('ap'), day: box.querySelector('#apDay').value, start: box.querySelector('#apStart').value,
            teamId: box.querySelector('#apTeam').value, customer: name, phone: box.querySelector('#apPhone').value.trim(),
            address: box.querySelector('#apAddr').value.trim(), serviceId,
            price: Number(box.querySelector('#apPrice').value) || svc(serviceId).price,
            status: B().autoConfirm ? 'confirmed' : 'pending', source:'phone', requestId: pre.requestId || null
          });
          if (pre.waitId) HM.db.waitlist = HM.db.waitlist.filter(w => w.id !== pre.waitId);
          HM.closeModal();
          HM.toast('התור נקבע · ' + HM.fmt.date(box.querySelector('#apDay').value) + ' ' + box.querySelector('#apStart').value);
          HM.render();
        });
      }
    });
  }

  function apptModal(id){
    const a = HM.db.appointments.find(x => x.id === id);
    if (!a) return;
    const m = member(a.teamId), s = svc(a.serviceId), st = STATUS[a.status];
    const actions = [];
    if (a.status === 'pending') actions.push(`<button class="btn btn-primary" data-act="confirmed">אשר תור</button>`);
    if (a.status === 'confirmed') actions.push(`<button class="btn btn-primary" data-act="in_progress">התחל עבודה</button>`);
    if (a.status === 'in_progress') actions.push(`<button class="btn btn-green" data-act="done">סיים עבודה</button>`);
    if (a.status === 'confirmed' || a.status === 'pending') actions.push(`<button class="btn btn-ghost" data-act="no_show">לא הגיע</button>`);
    if (a.status !== 'done' && a.status !== 'cancelled') actions.push(`<button class="btn btn-danger" data-act="cancelled">בטל</button>`);
    HM.modal({
      title: s.name, size:'narrow', sub: `${HM.fmt.date(a.day)} · ${a.start} · ${HM.esc(m.name)}`,
      body:`
        <div class="row" style="justify-content:space-between;margin-bottom:12px">
          ${HM.badge(st.label, st.tone, true)}
          <span style="font-size:19px;font-weight:900">${HM.fmt.money(a.price)}</span>
        </div>
        <div class="kv"><dt>לקוח</dt><dd>${HM.esc(a.customer)}</dd></div>
        <div class="kv"><dt>טלפון</dt><dd>${HM.esc(a.phone || '—')}</dd></div>
        <div class="kv"><dt>כתובת</dt><dd>${HM.esc(a.address || '—')}</dd></div>
        <div class="kv"><dt>משך</dt><dd>${s.duration} דק׳</dd></div>
        <div class="kv"><dt>מקור</dt><dd>${{ page:'העמוד הציבורי', lead:'פנייה', phone:'טלפון' }[a.source] || a.source}</dd></div>`,
      foot: actions.join('') + `<button class="btn btn-ghost" data-close>סגירה</button>`,
      onMount(box){
        box.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
          a.status = b.dataset.act;
          HM.closeModal();
          HM.toast('התור עודכן — ' + STATUS[a.status].label);
          HM.render();
        }));
      }
    });
  }

  /* ---------------- Dashboard ---------------- */
  function dashboard(root){
    const today = dayAppts(TODAY).filter(a => a.status !== 'cancelled');
    const revenue = today.reduce((s,a) => s + a.price, 0);
    const load = activeTeam().reduce((s,t) => s + loadOf(t).pct, 0) / Math.max(1, activeTeam().length);
    const repeat = HM.db.appointments.reduce((acc,a) => { acc[a.customer] = (acc[a.customer]||0)+1; return acc; }, {});
    const repeatCount = Object.values(repeat).filter(v => v > 1).length;
    const byService = HM.db.services.map(s => ({ s, n: HM.db.appointments.filter(a => a.serviceId === s.id).length }))
      .sort((a,b) => b.n - a.n).slice(0,5);

    const content = `
      ${head('סקירה', `${HM.esc(B().name)} · ${today.length} תורים היום · ${HM.db.waitlist.length} ממתינים לשיבוץ`,
        `<button class="btn btn-ghost" data-nav="page">${HM.icon('external', 14)} העמוד הציבורי</button>
         <button class="btn btn-primary" id="newAppt">${HM.icon('plus', 14)} תור חדש</button>`)}

      <div class="grid g4 mb">
        ${HM.kpi('תורים היום', HM.fmt.num(today.length), `${today.filter(a=>a.status==='pending').length} ממתינים לאישור`, 'flat', HM.spark([3,5,4,6,5,7,today.length], '#f97316'))}
        ${HM.kpi('ניצולת צוות', HM.fmt.pct(load), `${activeTeam().length} פעילים`, load > .75 ? 'up' : 'flat', HM.spark([.42,.51,.48,.6,.58,.66,load], '#1d4ed8'))}
        ${HM.kpi('הכנסה מתוכננת היום', HM.fmt.money(revenue), 'לפי תורים מאושרים', 'up', HM.spark([900,1400,1200,1800,1600,2100,revenue], '#15803d'))}
        ${HM.kpi('לקוחות חוזרים', HM.fmt.num(repeatCount), 'מכלל הלקוחות', 'flat', HM.spark([2,3,3,4,4,5,repeatCount], '#6d28d9'))}
      </div>

      <div class="grid g-2-1 mb">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">${HM.icon('calendar', 15)} היומן של היום</div>
            ${HM.badge(HM.fmt.date(TODAY), 'gray')}
          </div>
          <div class="panel-body flush">
            ${today.length ? today.map(a => {
              const m = member(a.teamId), st = STATUS[a.status];
              return `<div class="lrow" data-appt="${a.id}">
                <div class="avatar sm" style="background:${m.color}">${HM.esc(HM.fmt.initials(m.name))}</div>
                <div class="lrow-main">
                  <div class="lrow-title">${a.start} · ${HM.esc(a.customer)}</div>
                  <div class="lrow-sub">${HM.esc(svc(a.serviceId).name)} · ${HM.esc(m.name)} · ${HM.esc(a.address || '')}</div>
                </div>
                <span style="font-size:11.5px;font-weight:800;margin-inline-end:8px">${HM.fmt.money(a.price)}</span>
                ${HM.badge(st.label, st.tone)}
              </div>`;
            }).join('') : HM.empty('calendar', 'אין תורים היום', 'קבעו תור חדש או שבצו מהמתנה.')}
          </div>
          <div class="panel-foot"><button class="btn btn-ghost btn-sm btn-block" data-nav="calendar">ליומן השבועי</button></div>
        </div>

        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('clock', 15)} תור המתנה</div>${HM.badge(HM.db.waitlist.length + ' ממתינים', 'amber', true)}</div>
            <div class="panel-body flush">
              ${HM.db.waitlist.slice(0,3).map(w => `
                <div class="lrow">
                  <div class="lrow-main">
                    <div class="lrow-title">${HM.esc(w.customer)}</div>
                    <div class="lrow-sub">${HM.esc(svc(w.serviceId).name)} · ${HM.esc(w.urgency)}</div>
                  </div>
                  <button class="btn btn-ghost btn-sm" data-slot="${w.id}">שבץ</button>
                </div>`).join('') || HM.empty('check', 'אין ממתינים', 'כל הפניות שובצו.')}
            </div>
            <div class="panel-foot"><button class="btn btn-ghost btn-sm btn-block" data-nav="queue">לכל התור</button></div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('chart', 15)} ביקוש לפי שירות</div></div>
            <div class="panel-body">
              ${byService.map(x => `
                <div class="row" style="gap:8px;margin-bottom:7px">
                  <span style="font-size:10.5px;font-weight:700;flex:1">${HM.esc(x.s.name)}</span>
                  <div style="width:70px">${HM.progress(x.n / Math.max(1, byService[0].n), '')}</div>
                  <span style="font-size:10px;color:var(--muted);width:14px;text-align:left">${x.n}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    shell(root, 'dashboard', content);
    root.querySelector('#newAppt').addEventListener('click', () => bookModal({ day: TODAY }));
    root.querySelectorAll('[data-appt]').forEach(el => el.addEventListener('click', () => apptModal(el.dataset.appt)));
    root.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => {
      const w = HM.db.waitlist.find(x => x.id === b.dataset.slot);
      bookModal({ customer:w.customer, phone:w.phone, serviceId:w.serviceId, waitId:w.id, requestId:w.requestId, day: TODAY });
    }));
  }

  /* ---------------- Calendar ---------------- */
  function calendar(root){
    const weekTotal = WEEK.reduce((s,d) => s + dayAppts(d.d).filter(a => a.status !== 'cancelled').length, 0);
    const cells = WEEK.map(d => {
      const list = dayAppts(d.d).filter(a => a.status !== 'cancelled');
      return `<div class="sched-h ${d.d===TODAY?'today':''}">${d.name}<b>${HM.fmt.date(d.d)}</b><span style="font-weight:600">${list.length} תורים</span></div>`;
    }).join('');

    const rows = HOURS.map(h => {
      const timeCell = `<div class="sched-t">${h}</div>`;
      const dayCells = WEEK.map(d => {
        const list = dayAppts(d.d).filter(a => a.start === h && a.status !== 'cancelled');
        const full = list.length >= B().capacity;
        return `<div class="sched-c ${full?'full':''}" data-day="${d.d}" data-hour="${h}">
          ${list.map(a => {
            const m = member(a.teamId);
            return `<button class="sched-ev" data-appt="${a.id}" style="border-color:${m.color};background:${m.color}14;color:${m.color}">
              <b>${HM.esc(a.customer.split(' ')[0])} · ${HM.fmt.money(a.price)}</b>${HM.esc(svc(a.serviceId).name)}
            </button>`;
          }).join('')}
        </div>`;
      }).join('');
      return timeCell + dayCells;
    }).join('');

    const content = `
      ${head('יומן ותורים', `שבוע 15–21 בנובמבר · ${weekTotal} תורים · קיבולת ${B().capacity} במקביל לכל שעה`,
        `<button class="btn btn-ghost" data-nav="queue">${HM.icon('clock', 14)} תור המתנה</button>
         <button class="btn btn-primary" id="newAppt">${HM.icon('plus', 14)} תור חדש</button>`)}

      <div class="panel mb">
        <div class="panel-body flush" style="padding:10px">
          <div class="sched">
            <div class="sched-h" style="background:var(--surface-2)"></div>${cells}
            ${rows}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-body row" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div class="legend">
            ${Object.entries(STATUS).map(([k,v]) => `<span><i style="background:${{ amber:'var(--amber)', blue:'var(--blue)', orange:'var(--accent)', green:'var(--green)', red:'var(--red)', gray:'#94a3b8' }[v.tone]}"></i>${v.label}</span>`).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--muted);font-weight:600">לחיצה על משבצת ריקה קובעת תור · לחיצה על תור פותחת עדכון סטטוס</div>
        </div>
      </div>`;

    shell(root, 'calendar', content);
    root.querySelector('#newAppt').addEventListener('click', () => bookModal({ day: TODAY }));
    root.querySelectorAll('[data-appt]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); apptModal(b.dataset.appt); }));
    root.querySelectorAll('.sched-c').forEach(c => c.addEventListener('click', () => bookModal({ day:c.dataset.day, start:c.dataset.hour })));
  }

  /* ---------------- Waitlist ---------------- */
  function queue(root){
    const rows = HM.db.waitlist.map(w => {
      const s = svc(w.serviceId);
      const urgent = w.urgency === 'היום';
      return `<tr>
        <td class="cell-main">${HM.esc(w.customer)}<div style="font-size:10px;color:var(--muted);font-weight:600">${HM.esc(w.phone)}</div></td>
        <td>${HM.esc(s.name)}<div style="font-size:10px;color:var(--muted);font-weight:600">${HM.fmt.money(s.price)} · ${s.duration} דק׳</div></td>
        <td>${HM.badge(w.urgency, urgent ? 'red' : 'amber', urgent)}</td>
        <td style="color:var(--muted)">${HM.fmt.rel(w.since)}</td>
        <td style="max-width:220px;font-size:11.5px;color:var(--ink-2)">${HM.esc(w.note)}</td>
        <td style="text-align:left"><button class="btn btn-primary btn-sm" data-slot="${w.id}">שבץ תור</button></td>
      </tr>`;
    }).join('');

    const content = `
      ${head('תור המתנה', `${HM.db.waitlist.length} לקוחות ממתינים · הכי ותיק ממתין ${HM.fmt.rel(HM.db.waitlist[0] ? HM.db.waitlist[0].since : new Date().toISOString())}`,
        `<button class="btn btn-ghost" data-nav="calendar">${HM.icon('calendar', 14)} ליומן</button>`)}

      <div class="grid g3 mb">
        ${HM.kpi('ממתינים', HM.fmt.num(HM.db.waitlist.length), 'מכל המקורות', 'flat')}
        ${HM.kpi('דחופים היום', HM.fmt.num(HM.db.waitlist.filter(w => w.urgency === 'היום').length), 'SLA 4 שעות', 'down')}
        ${HM.kpi('זמן המתנה ממוצע', '3.4 <small>שעות</small>', 'יעד מתחת ל-4', 'up')}
      </div>

      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('clock', 15)} לקוחות ללא תור</div>${HM.badge('לפי דחיפות', 'gray')}</div>
        <div class="panel-body flush table-wrap">
          <table class="table">
            <thead><tr><th>לקוח</th><th>שירות</th><th>דחיפות</th><th>ממתין</th><th>הערה</th><th></th></tr></thead>
            <tbody>${rows || `<tr><td colspan="6">${HM.empty('check', 'אין ממתינים', 'כל הפניות שובצו ליומן.')}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;

    shell(root, 'queue', content);
    root.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => {
      const w = HM.db.waitlist.find(x => x.id === b.dataset.slot);
      bookModal({ customer:w.customer, phone:w.phone, serviceId:w.serviceId, waitId:w.id, requestId:w.requestId, day: TODAY });
    }));
  }

  /* ---------------- Team ---------------- */
  function team(root){
    const cards = HM.db.team.map(t => {
      const l = loadOf(t);
      return `<div class="panel">
        <div class="panel-body">
          <div class="row" style="justify-content:space-between;align-items:flex-start">
            <div class="row" style="gap:9px">
              ${HM.avatar(t.name, t.color, 'md')}
              <div>
                <div style="font-size:13px;font-weight:800">${HM.esc(t.name)}</div>
                <div style="font-size:10.5px;color:var(--muted);font-weight:600">${HM.esc(t.role)}</div>
              </div>
            </div>
            <label class="switch" title="${t.active?'פעיל':'מושבת'}"><input type="checkbox" data-team="${t.id}" ${t.active?'checked':''}><span class="track"></span></label>
          </div>
          <div class="divider"></div>
          <div class="kv"><dt>דירוג</dt><dd>★ ${t.rating} · ${HM.fmt.num(t.jobs)} עבודות</dd></div>
          <div class="kv"><dt>תורים היום</dt><dd>${l.n} / ${t.capacity}</dd></div>
          <div style="margin-top:7px">${HM.progress(l.pct, l.pct > .85 ? 'green' : '')}</div>
          <div class="row" style="gap:6px;margin-top:11px">
            <button class="btn btn-ghost btn-sm" style="flex:1" data-book="${t.id}">${HM.icon('plus', 13)} תור</button>
            <button class="btn btn-ghost btn-sm" style="flex:1" data-call="${t.id}">${HM.icon('phone', 13)} התקשר</button>
          </div>
        </div>
      </div>`;
    }).join('');

    const content = `
      ${head('צוות', `${activeTeam().length} פעילים מתוך ${HM.db.team.length} · קיבולת יומית ${HM.db.team.reduce((s,t)=>s+t.capacity,0)} תורים`,
        `<button class="btn btn-primary" id="addMember">${HM.icon('plus', 14)} איש צוות</button>`)}

      <div class="grid g3 mb">${cards}</div>

      <div class="panel">
        <div class="panel-body" style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:34px;height:34px;border-radius:9px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;flex-shrink:0">${HM.icon('info', 17)}</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.6">
            <b style="color:var(--ink-2)">איך זה עובד.</b> כל איש צוות מקבל תורים משלו, והקיבולת לשעה נקבעת בהגדרות העסק. השבתת איש צוות מסתירה אותו משיבוץ חדש אבל לא מוחקת תורים קיימים.
          </div>
        </div>
      </div>`;

    shell(root, 'team', content);
    root.querySelectorAll('[data-team]').forEach(cb => cb.addEventListener('change', () => {
      const t = HM.db.team.find(x => x.id === cb.dataset.team);
      t.active = cb.checked;
      HM.toast(t.name + (t.active ? ' הופעל' : ' הושבת'));
      HM.render();
    }));
    root.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => bookModal({ teamId:b.dataset.book, day: TODAY })));
    root.querySelectorAll('[data-call]').forEach(b => b.addEventListener('click', () => {
      const t = HM.db.team.find(x => x.id === b.dataset.call);
      HM.toast('מחייג ל' + t.name + ' · ' + t.phone);
    }));
    root.querySelector('#addMember').addEventListener('click', () => {
      HM.modal({
        title:'איש צוות חדש', size:'narrow', sub:'הוא יופיע בשיבוץ מיד לאחר השמירה',
        body:`
          <div class="field"><label class="label">שם</label><input class="input" id="tmName" placeholder="שם מלא"></div>
          <div class="field"><label class="label">תפקיד</label><input class="input" id="tmRole" placeholder="טכנאי מיזוג"></div>
          <div class="grid g2" style="gap:10px">
            <div class="field" style="margin:0"><label class="label">מקצוע</label><select class="input" id="tmTrade">${HM.TRADES.filter(t=>t.id!=='all').map(t => `<option value="${t.id}">${HM.esc(t.name)}</option>`).join('')}</select></div>
            <div class="field" style="margin:0"><label class="label">קיבולת יומית</label><input class="input" id="tmCap" type="number" value="5"></div>
          </div>
          <div class="field" style="margin-bottom:0"><label class="label">טלפון</label><input class="input" id="tmPhone" placeholder="050-0000000"></div>`,
        foot:`<button class="btn btn-primary" id="saveMember">הוסף</button><button class="btn btn-ghost" data-close>ביטול</button>`,
        onMount(box){
          box.querySelector('#saveMember').addEventListener('click', () => {
            const name = box.querySelector('#tmName').value.trim();
            if (!name){ HM.toast('צריך שם', 'warn'); return; }
            HM.db.team.push({
              id: HM.uid('t'), name, role: box.querySelector('#tmRole').value.trim() || 'איש צוות',
              trade: box.querySelector('#tmTrade').value, phone: box.querySelector('#tmPhone').value.trim(),
              active:true, rating:0, jobs:0, capacity: Number(box.querySelector('#tmCap').value) || 5, color:'#0d9488'
            });
            HM.closeModal(); HM.toast(name + ' נוסף לצוות'); HM.render();
          });
        }
      });
    });
  }

  /* ---------------- Public page ---------------- */
  const DAY_NAMES = [['sun','ראשון'],['mon','שני'],['tue','שלישי'],['wed','רביעי'],['thu','חמישי'],['fri','שישי'],['sat','שבת']];

  function publicMarkup(){
    const b = B();
    return `<div style="border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface)">
      <div style="background:linear-gradient(150deg,var(--navy),#1b3a5e);color:#fff;padding:24px 22px">
        <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <div class="row" style="gap:7px;margin-bottom:7px">
              ${HM.badge('מאומת', 'blue')}${HM.badge('ביטוח בתוקף', 'green')}
            </div>
            <div style="font-size:24px;font-weight:900;letter-spacing:-.8px;line-height:1.15">${HM.esc(b.name)}</div>
            <div style="font-size:12.5px;color:#c7d3e2;margin-top:6px;max-width:420px;line-height:1.55">${HM.esc(b.tagline)}</div>
            <div class="row" style="gap:12px;margin-top:12px;font-size:11.5px;color:#dbe4ee;font-weight:600">
              <span>★ ${b.rating} (${b.reviews})</span><span>${HM.fmt.num(b.jobs)} עבודות</span><span>${HM.esc(b.area)}</span>
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div class="avatar lg" style="background:${HM.trade(b.trade).color};margin:0 auto 8px">${HM.esc(HM.fmt.initials(b.name))}</div>
            <div style="font-size:10px;color:#b9c7d8;font-weight:700">מאז ${b.since.slice(0,4)}</div>
          </div>
        </div>
        <div class="row" style="gap:8px;margin-top:16px">
          <button class="btn btn-primary" data-book-page>${HM.icon('calendar', 14)} קבע תור</button>
          <button class="btn" style="background:rgba(255,255,255,.14);color:#fff" data-call-page>${HM.icon('phone', 14)} ${HM.esc(b.phone)}</button>
        </div>
      </div>
      <div style="padding:18px 22px">
        <div style="font-size:12px;font-weight:800;margin-bottom:9px">שירותים ומחירים</div>
        <div class="grid g2" style="gap:8px">
          ${HM.db.services.map(s => `<div class="row" style="justify-content:space-between;border:1px solid var(--line);border-radius:9px;padding:9px 11px">
            <span style="font-size:11.5px;font-weight:700">${HM.esc(s.name)}</span>
            <span style="font-size:11.5px;font-weight:800;color:var(--accent-2)">${HM.fmt.money(s.price)}</span>
          </div>`).join('')}
        </div>
        <div class="divider"></div>
        <div class="grid g2" style="gap:16px">
          <div>
            <div style="font-size:12px;font-weight:800;margin-bottom:7px">שעות פעילות</div>
            ${DAY_NAMES.map(([k,n]) => {
              const h = b.hours[k] || [];
              return `<div class="kv" style="padding:4px 0"><dt>${n}</dt><dd style="font-size:11px">${h.length ? h[0] + '–' + h[1] : 'סגור'}</dd></div>`;
            }).join('')}
          </div>
          <div>
            <div style="font-size:12px;font-weight:800;margin-bottom:7px">אזור שירות</div>
            <div style="font-size:11.5px;color:var(--muted);line-height:1.6">${HM.esc(b.area)} · עד ${HM.fmt.dist(b.radius)} מהמחסן בתל אביב.</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.6;margin-top:8px">${HM.esc(b.insurance)}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function page(root){
    const b = B();
    const conv = b.pageViews ? b.pageBookings / b.pageViews : 0;
    const content = `
      ${head('העמוד הציבורי', `handimans.co.il/b/${b.slug} · ${HM.fmt.num(b.pageViews)} צפיות בחודש`,
        `<button class="btn btn-ghost" id="copyLink">${HM.icon('copy', 14)} העתק קישור</button>
         <button class="btn btn-ghost" id="preview">${HM.icon('eye', 14)} תצוגת לקוח</button>
         <button class="btn btn-primary" data-nav="settings">${HM.icon('edit', 14)} עריכה</button>`)}

      <div class="grid g4 mb">
        ${HM.kpi('צפיות בעמוד', HM.fmt.num(b.pageViews), '+14% החודש', 'up', HM.spark([820,940,1010,1180,1320,1610,b.pageViews], '#1d4ed8'))}
        ${HM.kpi('שיחות מהעמוד', HM.fmt.num(b.pageCalls), 'לחיצה על טלפון', 'flat')}
        ${HM.kpi('תורים מהעמוד', HM.fmt.num(b.pageBookings), 'החודש', 'up')}
        ${HM.kpi('המרה לצפייה', HM.fmt.pct(conv, 1), 'צפייה → תור', 'flat')}
      </div>

      <div class="grid g-2-1">
        <div>${publicMarkup()}</div>
        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('target', 15)} מה מביא תורים</div></div>
            <div class="panel-body">
              <div class="kv"><dt>חיפוש באזור</dt><dd>${HM.fmt.pct(.46)}</dd></div>
              <div class="kv"><dt>קישור ישיר</dt><dd>${HM.fmt.pct(.31)}</dd></div>
              <div class="kv"><dt>המלצות לקוחות</dt><dd>${HM.fmt.pct(.23)}</dd></div>
              <div class="divider"></div>
              <div style="font-size:11px;color:var(--muted);line-height:1.6">פרסום בתשלום (Google, Meta) הוא הוצאה שלכם — הפלטפורמה לא מוכרת פרסום. העמוד כאן הוא מה שאנחנו נותנים בחינם.</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('star', 15)} ביקורות אחרונות</div></div>
            <div class="panel-body flush">
              ${HM.REVIEWS.slice(0,3).map(r => `<div class="lrow">
                <div class="lrow-main"><div class="lrow-title">${HM.esc(r.author)}</div><div class="lrow-sub">${HM.esc(r.text.slice(0,46))}…</div></div>
                <span style="color:#f59e0b;font-weight:800;font-size:11px">★ ${r.rating}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    shell(root, 'page', content);
    root.querySelector('#copyLink').addEventListener('click', () => {
      const url = 'https://handimans.co.il/b/' + B().slug;
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
      HM.toast('הקישור הועתק — ' + url);
    });
    root.querySelector('#preview').addEventListener('click', () => {
      HM.modal({ title:'תצוגת לקוח', sub:'כך העמוד נראה למי שמגיע מהחיפוש', size:'wide', body: publicMarkup(),
        foot:`<button class="btn btn-primary" data-close>סגירה</button>` });
    });
    root.querySelectorAll('[data-book-page]').forEach(b => b.addEventListener('click', () => bookModal({ day: TODAY })));
    root.querySelectorAll('[data-call-page]').forEach(b => b.addEventListener('click', () => HM.toast('מחייג ל' + B().phone)));
  }

  /* ---------------- Leads ---------------- */
  function bizLeads(){
    const trades = [...new Set(HM.db.services.map(s => s.trade))];
    return HM.db.requests
      .filter(r => r.status === 'open' && trades.includes(r.trade))
      .map(r => ({ ...r, dist: HM.haversine({ lat:B().lat, lng:B().lng }, r) }))
      .filter(r => r.dist <= B().radius)
      .sort((a,b) => a.dist - b.dist);
  }

  function leads(root){
    const list = bizLeads();
    const taken = HM.db.takenLeads || (HM.db.takenLeads = []);
    const fee = HM.db.settings.leadPrice;

    const content = `
      ${head('פניות ולידים', `${list.length} פניות באזור · פנייה = ${HM.fmt.money(fee)} · יתרה ${HM.fmt.money(B().balance)}`,
        `<button class="btn btn-ghost" data-nav="settings">${HM.icon('sliders', 14)} אזור שירות</button>`)}

      <div class="grid g4 mb">
        ${HM.kpi('פניות באזור', HM.fmt.num(list.length), 'פתוחות עכשיו', 'flat')}
        ${HM.kpi('נלקחו החודש', HM.fmt.num(taken.length), 'שולמו ' + HM.fmt.money(taken.length * fee), 'up')}
        ${HM.kpi('יתרה', HM.fmt.money(B().balance), Math.floor(B().balance / fee) + ' פניות', 'flat')}
        ${HM.kpi('עלות לפנייה', HM.fmt.money(fee), 'ללא עמלה על עבודה', 'flat')}
      </div>

      <div class="panel">
        <div class="panel-head"><div class="panel-title">${HM.icon('target', 15)} פניות מתאימות</div>${HM.badge('רדיוס ' + HM.fmt.dist(B().radius), 'gray')}</div>
        <div class="panel-body flush">
          ${list.map(r => {
            const isTaken = taken.includes(r.id);
            return `<div class="lrow">
              <div class="avatar sm" style="background:${HM.trade(r.trade).color}">${HM.icon(HM.trade(r.trade).icon, 14)}</div>
              <div class="lrow-main">
                <div class="lrow-title">${HM.esc(r.desc.slice(0, 58))}${r.desc.length > 58 ? '…' : ''}</div>
                <div class="lrow-sub">${HM.esc(r.address)} · ${HM.fmt.dist(r.dist)} · ${HM.esc(r.customer)} · ${HM.fmt.rel(r.createdAt)}</div>
              </div>
              <span style="font-size:11px;font-weight:800;margin-inline-end:8px">${HM.fmt.money(r.budget)}</span>
              ${isTaken
                ? `<button class="btn btn-green btn-sm" data-book-lead="${r.id}">${HM.icon('calendar', 13)} קבע תור</button>`
                : `<button class="btn btn-primary btn-sm" data-take="${r.id}">קח פנייה · ${HM.fmt.money(fee)}</button>`}
            </div>`;
          }).join('') || HM.empty('check', 'אין פניות באזור', 'כשתפתח בקשה חדשה בטווח הרדיוס — היא תופיע כאן.')}
        </div>
      </div>`;

    shell(root, 'leads', content);
    root.querySelectorAll('[data-take]').forEach(b => b.addEventListener('click', () => {
      const r = HM.request(b.dataset.take);
      if (B().balance < fee){ HM.toast('אין מספיק יתרה — טענו ' + HM.fmt.money(fee), 'warn'); return; }
      B().balance -= fee;
      HM.db.bizLedger.unshift({ id:HM.uid('bl'), delta:-fee, reason:'lead_charge', note:'פנייה — ' + HM.trade(r.trade).name + ' ב' + r.address, createdAt:new Date().toISOString(), balance:B().balance });
      taken.push(r.id);
      HM.toast('הפנייה נלקחה · ' + HM.fmt.money(fee) + ' ירדו מהיתרה');
      HM.render();
    }));
    root.querySelectorAll('[data-book-lead]').forEach(b => b.addEventListener('click', () => {
      const r = HM.request(b.dataset.bookLead);
      bookModal({ customer:r.customer, serviceId:(HM.db.services.find(s => s.trade === r.trade) || {}).id, requestId:r.id, address:r.address, price:r.budget, day:TODAY });
    }));
  }

  /* ---------------- Settings ---------------- */
  function settings(root){
    const b = B();
    const content = `
      ${head('הגדרות העסק', 'שעות, קיבולת, אזור שירות ואישור אוטומטי', `<button class="btn btn-primary" id="saveBiz">${HM.icon('check', 14)} שמירה</button>`)}

      <div class="grid g-2-1">
        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('building', 15)} פרטי העסק</div></div>
            <div class="panel-body">
              <div class="grid g2" style="gap:10px">
                <div class="field" style="margin:0"><label class="label">שם העסק</label><input class="input" id="bzName" value="${HM.esc(b.name)}"></div>
                <div class="field" style="margin:0"><label class="label">טלפון</label><input class="input" id="bzPhone" value="${HM.esc(b.phone)}"></div>
              </div>
              <div class="field"><label class="label">סלוגן</label><input class="input" id="bzTag" value="${HM.esc(b.tagline)}"></div>
              <div class="grid g2" style="gap:10px">
                <div class="field" style="margin:0"><label class="label">אזור שירות</label><input class="input" id="bzArea" value="${HM.esc(b.area)}"></div>
                <div class="field" style="margin:0"><label class="label">רדיוס (ק״מ)</label><input class="input" id="bzRadius" type="number" value="${Math.round(b.radius/1000)}"></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('clock', 15)} שעות פעילות</div></div>
            <div class="panel-body">
              ${DAY_NAMES.map(([k,n]) => {
                const h = b.hours[k] || [];
                return `<div class="row" style="gap:8px;margin-bottom:7px">
                  <span style="font-size:11.5px;font-weight:700;width:52px">${n}</span>
                  <input class="input" type="time" data-open="${k}" value="${h[0]||''}" style="max-width:120px">
                  <span style="color:var(--faint)">—</span>
                  <input class="input" type="time" data-close="${k}" value="${h[1]||''}" style="max-width:120px">
                  <span style="font-size:10px;color:var(--muted);font-weight:600">${h.length ? '' : 'סגור'}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('sliders', 15)} קיבולת ותורים</div></div>
            <div class="panel-body">
              <div class="field"><label class="label">משך תור</label><select class="input" id="bzSlot">
                ${[30,45,60,90].map(m => `<option value="${m}" ${b.slot===m?'selected':''}>${m} דקות</option>`).join('')}
              </select></div>
              <div class="field"><label class="label">תורים במקביל לכל שעה</label><input class="input" id="bzCap" type="number" value="${b.capacity}"></div>
              <div class="field" style="margin-bottom:0"><label class="label">פיקדון לקביעת תור (₪)</label><input class="input" id="bzDep" type="number" value="${b.deposit}"></div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="panel-title">${HM.icon('check', 15)} אישור תורים</div></div>
            <div class="panel-body">
              <label class="switch" style="margin-bottom:10px"><input type="checkbox" id="bzAuto" ${b.autoConfirm?'checked':''}><span class="track"></span> אישור אוטומטי של תור מהעמוד</label>
              <div style="font-size:11px;color:var(--muted);line-height:1.6">כשהאישור האוטומטי כבוי, כל תור מהעמוד נכנס כ"ממתין לאישור" ומחכה לכם ביומן.</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-body" style="display:flex;gap:11px;align-items:flex-start">
              <div style="width:32px;height:32px;border-radius:9px;background:var(--accent-soft);color:var(--accent-2);display:grid;place-items:center;flex-shrink:0">${HM.icon('wallet', 16)}</div>
              <div style="font-size:11px;color:var(--muted);line-height:1.6">יתרה לפניות: <b style="color:var(--ink-2)">${HM.fmt.money(b.balance)}</b> · פנייה ${HM.fmt.money(HM.db.settings.leadPrice)}. פרסום הוא הוצאה שלכם ולא נגבה כאן.</div>
            </div>
          </div>
        </div>
      </div>`;

    shell(root, 'settings', content);
    root.querySelector('#saveBiz').addEventListener('click', () => {
      b.name = root.querySelector('#bzName').value.trim() || b.name;
      b.phone = root.querySelector('#bzPhone').value.trim();
      b.tagline = root.querySelector('#bzTag').value.trim();
      b.area = root.querySelector('#bzArea').value.trim();
      b.radius = (Number(root.querySelector('#bzRadius').value) || 12) * 1000;
      b.slot = Number(root.querySelector('#bzSlot').value);
      b.capacity = Number(root.querySelector('#bzCap').value) || 2;
      b.deposit = Number(root.querySelector('#bzDep').value) || 0;
      b.autoConfirm = root.querySelector('#bzAuto').checked;
      DAY_NAMES.forEach(([k]) => {
        const o = root.querySelector(`[data-open="${k}"]`).value;
        const c = root.querySelector(`[data-close="${k}"]`).value;
        b.hours[k] = o && c ? [o, c] : [];
      });
      HM.toast('ההגדרות נשמרו');
      HM.render();
    });
  }

  HM.views.contractor = function(root, view){
    const map = { dashboard, calendar, queue, team, page, leads, settings };
    (map[view] || dashboard)(root);
  };
})();
