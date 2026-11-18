/* ============================================================
   HANDIMANS — Customer experience
   ============================================================ */
(function(){
  const S = HM.state;
  let map = null, markers = new Map(), circle = null, jobMarker = null;

  function destroyMap(){
    if (map){ map.remove(); map = null; }
    markers = new Map(); circle = null; jobMarker = null;
  }

  function visiblePros(){
    const list = HM.db.pros
      .filter(p => p.status === 'active')
      .map(p => ({ ...p, dist: HM.haversine(S.job, p) }))
      .filter(p => p.dist <= S.radius * 1000)
      .filter(p => S.trade === 'all' || p.trade === S.trade)
      .map(p => ({ ...p, score: scoreOf(p, p.dist) }));
    const sorters = {
      score:(a,b) => b.score - a.score,
      distance:(a,b) => a.dist - b.dist,
      rating:(a,b) => b.rating - a.rating || b.reviews - a.reviews,
      price:(a,b) => a.price[0] - b.price[0]
    };
    return list.sort(sorters[S.sort]);
  }

  function scoreOf(p, dist){
    const proximity = 1 - Math.min(dist / (S.radius * 1000), 1);
    const rating = Math.max(p.rating - 3, 0) / 2;
    const avail = p.avail === 'now' ? 1 : p.avail === 'soon' ? 0.65 : 0.3;
    const reliability = Math.min(p.jobs / 800, 1);
    const resp = 1 - Math.min(p.resp / 120, 1);
    return 0.35*proximity + 0.25*rating + 0.15*avail + 0.15*reliability + 0.10*resp;
  }

  /* ---------------- Shell ---------------- */
  function shell(root, view, sideHtml, mapVisible){
    root.innerHTML = `
      <div class="split">
        <aside class="side">${sideHtml}</aside>
        ${mapVisible ? `<section class="mapwrap">
          <div id="map"></div>
          <div class="map-badge"><span class="dot"></span><span id="badgeText">${S.radius} ק״מ вокруг הנקודה</span></div>
          <div class="map-hint">${HM.icon('target', 13)} לחצו על המפה כדי להזיז את מקום העבודה</div>
        </section>` : ''}
      </div>`;
    if (mapVisible) initMap();
  }

  function tabsHtml(active){
    const mine = HM.db.requests.filter(r => r.customerId === S.customerId);
    const open = mine.filter(r => r.status === 'open' || r.status === 'matched').length;
    const unread = HM.db.threads.reduce((s,t) => s + (t.unread||0), 0);
    return `<div class="tabs" style="margin:-16px -16px 12px;padding:0 8px">
      <button class="tab" data-tab="search" aria-selected="${active==='search'}">חיפוש</button>
      <button class="tab" data-tab="requests" aria-selected="${active==='requests'}">בקשות שלי${open?`<span class="count">${open}</span>`:''}</button>
      <button class="tab" data-tab="chat" aria-selected="${active==='chat'}">צ׳אט${unread?`<span class="count">${unread}</span>`:''}</button>
    </div>`;
  }

  function bindTabs(root){
    root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      HM.go('customer/' + b.dataset.tab);
    }));
  }

  /* ---------------- Search ---------------- */
  function renderSearch(root){
    const side = `
      <div class="side-head">
        ${tabsHtml('search')}
        <h1 style="font-size:18px;font-weight:900;letter-spacing:-.5px">מי מגיע אליי?</h1>
        <p style="font-size:11.5px;color:var(--muted);margin-top:3px;line-height:1.5">סמנו מקום, בחרו רדיוס — ותראו רק מי שבאמת משרת את האזור.</p>
        <div class="chips" id="chips" style="margin-top:12px"></div>
        <div class="field" style="margin-top:13px">
          <div class="field-head" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px">
            <span class="label" style="margin:0">רדיוס שירות</span>
            <span style="font-size:12.5px;font-weight:800;color:var(--accent-2)" id="radiusVal">${S.radius} ק״מ</span>
          </div>
          <input type="range" id="radius" min="1" max="30" step="1" value="${S.radius}" aria-label="רדיוס שירות">
          <div class="range-scale"><span>1 ק״מ</span><span>30 ק״מ</span></div>
        </div>
        <div class="field" style="margin-top:12px;margin-bottom:0">
          <span class="label">דחיפות</span>
          <div class="segmented block" id="urgency">
            <button data-u="emergency" aria-pressed="${S.urgency==='emergency'}">דחוף</button>
            <button data-u="today" aria-pressed="${S.urgency==='today'}">היום</button>
            <button data-u="this_week" aria-pressed="${S.urgency==='this_week'}">השבוע</button>
            <button data-u="flexible" aria-pressed="${S.urgency==='flexible'}">גמיש</button>
          </div>
        </div>
      </div>
      <div class="side-head" style="padding:10px 16px;background:var(--surface-2)">
        <div class="row" style="justify-content:space-between">
          <div style="font-size:11.5px;font-weight:700;color:var(--ink-2)"><b id="count" style="color:var(--accent-2);font-size:13px">0</b> בעלי מקצוע בטווח</div>
          <select class="input" id="sort" style="width:auto;padding:5px 26px 5px 9px;font-size:11px;font-weight:700">
            <option value="score" ${S.sort==='score'?'selected':''}>התאמה</option>
            <option value="distance" ${S.sort==='distance'?'selected':''}>מרחק</option>
            <option value="rating" ${S.sort==='rating'?'selected':''}>דירוג</option>
            <option value="price" ${S.sort==='price'?'selected':''}>מחיר</option>
          </select>
        </div>
      </div>
      <div class="side-body" id="cards"></div>
      <div class="side-foot">
        <button class="btn btn-primary btn-block" id="quickReq">${HM.icon('plus', 15)} פתיחת בקשה כללית</button>
      </div>`;

    shell(root, 'search', side, true);
    bindTabs(root);
    renderChips(root);
    bindFilters(root);
    render();
  }

  function renderChips(root){
    const wrap = root.querySelector('#chips');
    wrap.innerHTML = HM.TRADES.map(t =>
      `<button class="chip" data-trade="${t.id}" aria-pressed="${S.trade===t.id}">${t.name}</button>`
    ).join('');
    wrap.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
      S.trade = b.dataset.trade; S.selected = null;
      renderChips(root); render();
    }));
  }

  function bindFilters(root){
    const r = root.querySelector('#radius');
    r.addEventListener('input', e => {
      S.radius = Number(e.target.value);
      render();
    });
    root.querySelectorAll('#urgency button').forEach(b => b.addEventListener('click', () => {
      S.urgency = b.dataset.u;
      root.querySelectorAll('#urgency button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
    root.querySelector('#sort').addEventListener('change', e => { S.sort = e.target.value; render(); });
    root.querySelector('#quickReq').addEventListener('click', () => {
      const list = visiblePros();
      openBooking(list.length ? list[0].id : 1);
    });
  }

  function initMap(){
    map = L.map('map', { zoomControl:false }).setView([S.job.lat, S.job.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position:'bottomleft' }).addTo(map);

    circle = L.circle([S.job.lat, S.job.lng], {
      radius:S.radius*1000, color:'#f97316', weight:1.5, opacity:.75,
      fillColor:'#f97316', fillOpacity:.07, dashArray:'5 6'
    }).addTo(map);

    jobMarker = L.marker([S.job.lat, S.job.lng], {
      draggable:true,
      icon:L.divIcon({ className:'', html:'<div class="job-pin"></div>', iconSize:[20,20], iconAnchor:[10,10] })
    }).addTo(map);

    jobMarker.on('dragend', e => {
      const ll = e.target.getLatLng();
      setJob(ll.lat, ll.lng, true);
    });
    map.on('click', e => setJob(e.latlng.lat, e.latlng.lng, true));
  }

  function pinIcon(p, active){
    const color = HM.trade(p.trade).color;
    return L.divIcon({
      className:'',
      html:`<div class="pin ${active?'is-active':''}" style="--c:${color}"><i>${HM.esc(p.name.charAt(0))}</i></div>`,
      iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-28]
    });
  }

  function renderMarkers(list){
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers.clear();
    list.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon:pinIcon(p, S.selected === p.id) })
        .addTo(map)
        .bindPopup(`<div class="pop-name">${HM.esc(p.name)}</div><div class="pop-sub">${HM.trade(p.trade).name} · ${HM.fmt.dist(p.dist)} · ★ ${p.rating}</div>`);
      m.on('click', () => selectPro(p.id, false));
      markers.set(p.id, m);
    });
  }

  function setJob(lat, lng, fromMap){
    S.job = { lat, lng };
    if (jobMarker) jobMarker.setLatLng([lat, lng]);
    if (circle) circle.setLatLng([lat, lng]);
    if (fromMap && map){
      map.panTo([lat, lng], { animate:true, duration:.4 });
      HM.toast('מקום העבודה עודכן');
    }
    render();
  }

  function render(){
    const list = visiblePros();
    const countEl = document.getElementById('count');
    if (countEl) countEl.textContent = list.length;
    const rv = document.getElementById('radiusVal');
    if (rv) rv.textContent = S.radius + ' ק״מ';
    const badge = document.getElementById('badgeText');
    if (badge) badge.textContent = S.radius + ' ק״מ вокруг הנקודה';
    const range = document.getElementById('radius');
    if (range) range.style.setProperty('--pct', ((S.radius - 1) / 29 * 100) + '%');
    if (circle) circle.setRadius(S.radius * 1000);
    renderMarkers(list);
    renderCards(list);
  }

  function renderCards(list){
    const wrap = document.getElementById('cards');
    if (!wrap) return;
    if (!list.length){
      wrap.innerHTML = HM.empty('search', 'אין בעלי מקצוע בטווח הזה',
        'נסו להגדיל את הרדיוס, לשנות קטגוריה, או להזיז את הנקודה לאזור אחר.',
        `<button class="btn btn-ghost" id="widen">הגדל רדיוס ל-${Math.min(S.radius+7,30)} ק״מ</button>`);
      const w = wrap.querySelector('#widen');
      if (w) w.addEventListener('click', () => {
        S.radius = Math.min(S.radius + 7, 30);
        const r = document.getElementById('radius');
        if (r) r.value = S.radius;
        render();
      });
      return;
    }
    wrap.innerHTML = list.map(p => {
      const a = HM.AVAIL[p.avail];
      const fit = Math.round(60 + p.score * 40);
      return `<article class="pcard ${S.selected===p.id?'is-active':''}" data-id="${p.id}" tabindex="0" role="button" aria-label="${HM.esc(p.name)}, ${HM.trade(p.trade).name}, ${HM.fmt.dist(p.dist)}">
        <span class="fit">${fit}% התאמה</span>
        <div class="pcard-top">
          ${HM.avatar(p.name, HM.trade(p.trade).color, 'md')}
          <div class="pcard-id">
            <div class="pcard-name">${HM.esc(p.name)}${p.verified ? `<svg class="verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 2.1 3.2-.4 1.1 3 2.9 1.4-1 3.1 1 3.1-2.9 1.4-1.1 3-3.2-.4L12 22l-2.4-2.1-3.2.4-1.1-3-2.9-1.4 1-3.1-1-3.1 2.9-1.4 1.1-3 3.2.4L12 2z"/><path d="M9 12.2l2 2 4-4.2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</div>
            <div class="pcard-trade">${HM.trade(p.trade).name} · ${p.years} שנות ניסיון · ${HM.esc(p.area)}</div>
          </div>
        </div>
        <div class="pcard-meta">
          ${HM.stars(p.rating, p.reviews)}
          <span class="meta-item">${HM.icon('pin', 11)} ${HM.fmt.dist(p.dist)}</span>
          <span class="meta-item">${HM.icon('clock', 11)} ${p.resp} דק׳</span>
        </div>
        <div class="pcard-foot">
          <div class="price"><b>${HM.fmt.money(p.price[0])}–${HM.fmt.money(p.price[1])}</b> · קריאה ${HM.fmt.money(p.callout)}</div>
          <div class="row" style="gap:6px">
            ${HM.badge(a.label, a.cls)}
            <button class="btn btn-soft btn-sm" data-book="${p.id}">בקש הצעה</button>
          </div>
        </div>
      </article>`;
    }).join('');

    wrap.querySelectorAll('.pcard').forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener('click', e => { if (!e.target.closest('[data-book]')) selectPro(id, true); });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selectPro(id, true); }
      });
    });
    wrap.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      openBooking(Number(b.dataset.book));
    }));
  }

  function selectPro(id, fly){
    S.selected = id;
    const p = HM.pro(id);
    if (!p || !map) return;
    markers.forEach((m, key) => m.setIcon(pinIcon(HM.pro(key), key === id)));
    if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration:.6 });
    const m = markers.get(id);
    if (m) m.openPopup();
    renderCards(visiblePros());
    const el = document.querySelector(`.pcard[data-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  /* ---------------- Booking ---------------- */
  function openBooking(proId){
    const p = HM.pro(proId);
    if (!p) return;
    const dist = HM.haversine(S.job, p);
    HM.modal({
      title:'בקשת הצעת מחיר',
      sub:'הבקשה נשלחת לבעלי המקצוע המתאימים בטווח. עד 3 הצעות תוך 30 דקות.',
      body:`
        <div class="row" style="padding:11px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);margin-bottom:15px">
          ${HM.avatar(p.name, HM.trade(p.trade).color, 'md')}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:800">${HM.esc(p.name)} ${p.verified ? '· מאומת' : ''}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${HM.trade(p.trade).name} · ${HM.fmt.dist(dist)} ממך · ★ ${p.rating} (${p.reviews})</div>
          </div>
        </div>
        <div class="field">
          <label class="label" for="reqDesc">מה צריך לעשות?</label>
          <textarea class="input" id="reqDesc" placeholder="לדוגמה: נזילה מתחת לכיור במטבח, מים מטפטפים מהצינור. יש תמונה."></textarea>
          <div class="err" id="descErr" style="display:none">כתבו לפחות 10 תווים</div>
        </div>
        <div class="row2 field">
          <div>
            <label class="label" for="reqWhen">מתי נוח?</label>
            <select class="input" id="reqWhen">
              <option value="emergency" ${S.urgency==='emergency'?'selected':''}>דחוף — היום</option>
              <option value="today" ${S.urgency==='today'?'selected':''}>היום</option>
              <option value="this_week" ${S.urgency==='this_week'?'selected':''}>השבוע</option>
              <option value="flexible" ${S.urgency==='flexible'?'selected':''}>גמיש</option>
            </select>
          </div>
          <div>
            <label class="label" for="reqBudget">תקציב משוער</label>
            <input class="input" id="reqBudget" type="number" min="0" placeholder="₪ אופציונלי">
          </div>
        </div>
        <div class="field" style="margin-bottom:0">
          <label class="label">תמונה <span style="color:var(--green);font-weight:700">· מזרזת הצעות ב-40%</span></label>
          <div class="upload" id="upload">${HM.icon('camera', 22)} לחצו להוספת תמונה</div>
        </div>`,
      foot:`<button class="btn btn-primary" id="sendReq">${HM.icon('send', 14)} שלח בקשה</button>
            <button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        let photos = 0;
        box.querySelector('#upload').addEventListener('click', () => {
          photos++;
          box.querySelector('#upload').innerHTML = `<span style="color:var(--green);font-weight:700">✓ ${photos} תמונות צורפו (הדגמה)</span>`;
        });
        box.querySelector('#sendReq').addEventListener('click', () => {
          const desc = box.querySelector('#reqDesc').value.trim();
          if (desc.length < 10){
            box.querySelector('#descErr').style.display = 'block';
            box.querySelector('#reqDesc').focus();
            return;
          }
          const when = box.querySelector('#reqWhen').value;
          const budget = Number(box.querySelector('#reqBudget').value) || null;
          const req = {
            id:HM.uid('r'), customerId:S.customerId, customer:'דנה כהן',
            trade:p.trade, address:'פלורנטין, תל אביב', lat:S.job.lat, lng:S.job.lng,
            urgency:when, desc, budget, status:'open', createdAt:new Date().toISOString(),
            offers:0, photos
          };
          HM.db.requests.unshift(req);
          HM.addAudit('דנה כהן', 'פתחה בקשת שירות — ' + HM.trade(p.trade).name, req.id, 'request');
          const n = Math.min(6, Math.max(3, visiblePros().length));
          HM.modal({
            title:'', size:'narrow',
            body:`<div class="success">
              <div class="success-icon">${HM.icon('check', 28)}</div>
              <h3>הבקשה נשלחה</h3>
              <p>${n} בעלי מקצוע בטווח ${S.radius} ק״מ קיבלו את הבקשה.<br>ההצעה הראשונה מגיעה בדרך כלל תוך 12 דקות.</p>
              <div class="success-stats">
                <div><b>${n}</b><span>נשלחו</span></div>
                <div><b>~12</b><span>דק׳ להצעה</span></div>
                <div><b>3</b><span>הצעות צפויות</span></div>
              </div>
              <button class="btn btn-dark btn-block" id="goReq">לצפייה בבקשה שלי</button>
            </div>`,
            onMount(b){
              b.querySelector('#goReq').addEventListener('click', () => {
                HM.closeModal();
                HM.go('customer/requests');
              });
            }
          });
        });
      }
    });
  }

  /* ---------------- My requests ---------------- */
  function renderRequests(root){
    const mine = HM.db.requests.filter(r => r.customerId === S.customerId);
    const side = `
      <div class="side-head">
        ${tabsHtml('requests')}
        <div class="row" style="justify-content:space-between">
          <div>
            <h1 style="font-size:17px;font-weight:900;letter-spacing:-.4px">הבקשות שלי</h1>
            <p style="font-size:11.5px;color:var(--muted);margin-top:3px">${mine.length} בקשות · ${mine.filter(r=>r.status==='open').length} פתוחות</p>
          </div>
          <button class="btn btn-primary btn-sm" id="newReq">${HM.icon('plus', 13)} חדשה</button>
        </div>
      </div>
      <div class="side-body" id="reqList"></div>`;

    shell(root, 'requests', side, true);
    bindTabs(root);
    root.querySelector('#newReq').addEventListener('click', () => {
      const list = visiblePros();
      openBooking(list.length ? list[0].id : 1);
    });

    const wrap = root.querySelector('#reqList');
    if (!mine.length){
      wrap.innerHTML = HM.empty('file', 'אין בקשות עדיין', 'פתחו בקשה ראשונה ותקבלו הצעות תוך דקות.',
        `<button class="btn btn-primary" id="firstReq">פתיחת בקשה</button>`);
      wrap.querySelector('#firstReq').addEventListener('click', () => openBooking(1));
      return;
    }
    const statusMap = {
      open:['פתוחה','amber'], matched:['נמצאה התאמה','blue'], scheduled:['מתוזמנת','violet'],
      in_progress:['בביצוע','orange'], completed:['הושלמה','green'], cancelled:['בוטלה','gray'], expired:['פגה','gray']
    };
    wrap.innerHTML = mine.map(r => {
      const st = statusMap[r.status] || ['—','gray'];
      const offers = HM.db.offers.filter(o => o.requestId === r.id);
      return `<div class="lrow" data-req="${r.id}" style="border:1px solid var(--line);border-radius:12px;margin-bottom:9px;background:var(--surface)">
        <div class="avatar sm" style="background:${HM.trade(r.trade).color}">${HM.icon(HM.trade(r.trade).icon, 15)}</div>
        <div class="lrow-main">
          <div class="lrow-title">${HM.trade(r.trade).name} ${HM.badge(st[0], st[1])}</div>
          <div class="lrow-sub">${HM.esc(r.desc)}</div>
          <div class="lrow-sub" style="color:var(--faint);margin-top:3px">${HM.fmt.rel(r.createdAt)} · ${offers.length} הצעות</div>
        </div>
        <div class="lrow-end">${HM.icon('chevron', 15)}</div>
      </div>`;
    }).join('');
    wrap.querySelectorAll('[data-req]').forEach(el => el.addEventListener('click', () => openRequestDetail(el.dataset.req)));
  }

  function openRequestDetail(reqId){
    const r = HM.request(reqId);
    if (!r) return;
    const offers = HM.db.offers.filter(o => o.requestId === r.id);
    const job = HM.db.jobs.find(j => j.requestId === r.id);
    const statusMap = {
      open:['פתוחה','amber'], matched:['נמצאה התאמה','blue'], scheduled:['מתוזמנת','violet'],
      in_progress:['בביצוע','orange'], completed:['הושלמה','green'], cancelled:['בוטלה','gray']
    };
    const st = statusMap[r.status] || ['—','gray'];

    const offersHtml = offers.length ? offers.map(o => {
      const p = HM.pro(o.proId);
      const accepted = o.status === 'accepted';
      return `<div style="border:1px solid ${accepted?'var(--green)':'var(--line)'};border-radius:12px;padding:11px;margin-bottom:8px;background:${accepted?'var(--green-soft)':'var(--surface)'}">
        <div class="row" style="align-items:flex-start">
          ${HM.avatar(p.name, HM.trade(p.trade).color, 'sm')}
          <div style="flex:1;min-width:0">
            <div class="row" style="gap:5px">
              <span style="font-size:12.5px;font-weight:800">${HM.esc(p.name)}</span>
              ${p.verified ? `<span style="color:var(--blue)">${HM.icon('shieldCheck', 13)}</span>` : ''}
              ${HM.stars(p.rating, p.reviews)}
            </div>
            <div style="font-size:10.5px;color:var(--muted);margin-top:2px">${HM.fmt.dist(HM.haversine(S.job, p))} · הגעה ${o.eta} דק׳ · אחריות ${o.warranty} חודשים</div>
            <div style="font-size:11.5px;color:var(--ink-2);margin-top:6px;line-height:1.5">${HM.esc(o.message)}</div>
          </div>
          <div style="text-align:left;flex-shrink:0">
            <div style="font-size:17px;font-weight:900;letter-spacing:-.5px">${HM.fmt.money(o.price)}</div>
            ${accepted
              ? HM.badge('נבחרה','green')
              : `<button class="btn btn-primary btn-sm" data-accept="${o.id}" style="margin-top:5px">אשר</button>`}
          </div>
        </div>
      </div>`;
    }).join('') : HM.empty('clock', 'ממתינים להצעות', 'בעלי המקצוע קיבלו את הבקשה. הצעה ראשונה בדרך כלל תוך 12 דקות.');

    HM.modal({
      title: HM.trade(r.trade).name + ' · ' + HM.fmt.date(r.createdAt),
      sub: HM.esc(r.address) + ' · ' + HM.fmt.rel(r.createdAt),
      size:'wide',
      body:`
        <div class="row wrap" style="gap:6px;margin-bottom:12px">
          ${HM.badge(st[0], st[1], true)}
          ${HM.badge(r.urgency === 'emergency' ? 'דחוף' : r.urgency === 'today' ? 'היום' : r.urgency === 'this_week' ? 'השבוע' : 'גמיש', 'gray')}
          ${r.budget ? HM.badge('תקציב ' + HM.fmt.money(r.budget), 'gray') : ''}
          ${r.photos ? HM.badge(r.photos + ' תמונות', 'gray') : ''}
        </div>
        <div style="font-size:12.5px;line-height:1.6;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);border-radius:11px;padding:11px;margin-bottom:16px">${HM.esc(r.desc)}</div>
        ${job ? `<div class="panel" style="margin-bottom:16px">
          <div class="panel-head"><div class="panel-title">${HM.icon('calendar', 14)} העבודה</div>${HM.badge(job.status === 'completed' ? 'הושלמה' : job.status === 'in_progress' ? 'בביצוע' : 'מתוזמנת', job.status === 'completed' ? 'green' : job.status === 'in_progress' ? 'orange' : 'violet')}</div>
          <div class="panel-body">
            <div class="timeline">
              <div class="tl-item done"><div class="tl-title">הצעה אושרה</div><div class="tl-sub">${HM.fmt.dt(job.scheduledAt)}</div></div>
              <div class="tl-item ${job.status !== 'scheduled' ? 'done' : 'active'}"><div class="tl-title">התחלת עבודה</div><div class="tl-sub">${job.status === 'scheduled' ? 'ממתין למועד' : 'בעל המקצוע בדרך'}</div></div>
              <div class="tl-item ${job.status === 'completed' ? 'done' : ''}"><div class="tl-title">סיום ותשלום</div><div class="tl-sub">${job.status === 'completed' ? HM.fmt.money(job.finalPrice) + ' שולם' : 'יתעדכן בסיום'}</div></div>
            </div>
            <div class="row" style="margin-top:12px;gap:8px">
              <button class="btn btn-ghost btn-sm" data-chat="${job.id}">${HM.icon('message', 13)} צ׳אט</button>
              ${job.status === 'completed' ? `<button class="btn btn-soft btn-sm" data-review="${job.id}">${HM.icon('star', 13)} דרג</button>` : ''}
            </div>
          </div>
        </div>` : ''}
        <div class="panel-title" style="margin-bottom:9px">${HM.icon('file', 14)} הצעות (${offers.length})</div>
        ${offersHtml}`,
      foot:`<button class="btn btn-ghost" data-close>סגירה</button>`,
      onMount(box){
        box.querySelectorAll('[data-accept]').forEach(btn => btn.addEventListener('click', () => {
          acceptOffer(btn.dataset.accept, r.id);
        }));
        box.querySelectorAll('[data-chat]').forEach(btn => btn.addEventListener('click', () => {
          HM.closeModal();
          const j = HM.job(btn.dataset.chat);
          const t = HM.db.threads.find(x => x.requestId === j.requestId);
          if (t) S.activeThread = t.id;
          HM.go('customer/chat');
        }));
        box.querySelectorAll('[data-review]').forEach(btn => btn.addEventListener('click', () => {
          openReview(btn.dataset.review);
        }));
      }
    });
  }

  function acceptOffer(offerId, requestId){
    const o = HM.db.offers.find(x => x.id === offerId);
    if (!o) return;
    o.status = 'accepted';
    HM.db.offers.filter(x => x.requestId === requestId && x.id !== offerId).forEach(x => x.status = 'declined');
    const r = HM.request(requestId);
    r.status = 'scheduled';
    const p = HM.pro(o.proId);
    const job = {
      id:HM.uid('j'), requestId, offerId, proId:o.proId, customer:r.customer,
      trade:r.trade, address:r.address,
      scheduledAt:new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      status:'scheduled', finalPrice:o.price, paid:false
    };
    HM.db.jobs.unshift(job);
    let t = HM.db.threads.find(x => x.requestId === requestId);
    if (!t){
      t = { id:HM.uid('t'), requestId, proId:o.proId, customer:r.customer, unread:0, lastAt:new Date().toISOString() };
      HM.db.threads.unshift(t);
      HM.db.messages[t.id] = [{
        id:HM.uid('m'), from:'them',
        body:'קיבלתי, תודה. אני מגיע בזמן שסיכמנו — אם משהו משתנה אעדכן כאן.',
        at:new Date().toISOString()
      }];
    }
    HM.addAudit(r.customer, 'אישרה הצעה של ' + p.name + ' — ' + HM.fmt.money(o.price), job.id, 'job');
    HM.closeModal();
    HM.toast('ההצעה אושרה · העבודה נקבעה');
    S.activeThread = t.id;
    setTimeout(() => HM.go('customer/chat'), 350);
  }

  function openReview(jobId){
    const j = HM.job(jobId);
    if (!j) return;
    let rating = 5;
    HM.modal({
      title:'דירוג העבודה',
      sub:'הדירוג נכתב רק אחרי עבודה שהושלמה, ומתפרסם בשם הפרטי שלך.',
      size:'narrow',
      body:`
        <div class="rating-input" id="ratingInput">
          ${[1,2,3,4,5].map(i => `<button data-r="${i}" class="${i<=rating?'on':''}" aria-label="${i} כוכבים">★</button>`).join('')}
        </div>
        <div class="field">
          <label class="label" for="revText">מה היה? (אופציונלי)</label>
          <textarea class="input" id="revText" placeholder="מקצועיות, זמן הגעה, מחיר, ניקיון..."></textarea>
        </div>
        <label class="switch"><input type="checkbox" id="revPhotos" checked><span class="track"></span> אפשר לפרסם תמונות לפני/אחרי</label>`,
      foot:`<button class="btn btn-primary" id="sendRev">שלח דירוג</button><button class="btn btn-ghost" data-close>ביטול</button>`,
      onMount(box){
        box.querySelectorAll('#ratingInput button').forEach(b => b.addEventListener('click', () => {
          rating = Number(b.dataset.r);
          box.querySelectorAll('#ratingInput button').forEach(x => x.classList.toggle('on', Number(x.dataset.r) <= rating));
        }));
        box.querySelector('#sendRev').addEventListener('click', () => {
          const text = box.querySelector('#revText').value.trim();
          HM.db.reviews.unshift({
            id:HM.uid('v'), jobId, proId:j.proId, author:j.customer, rating,
            text:text || 'עבודה טובה, ממליץ.', createdAt:new Date().toISOString(), photos:0
          });
          const p = HM.pro(j.proId);
          const all = HM.db.reviews.filter(r => r.proId === p.id);
          p.rating = Math.round((all.reduce((s,r) => s + r.rating, 0) / all.length) * 10) / 10;
          p.reviews = all.length + 180;
          HM.closeModal();
          HM.toast('תודה! הדירוג פורסם');
        });
      }
    });
  }

  /* ---------------- Chat ---------------- */
  function renderChat(root){
    const threads = HM.db.threads.slice().sort((a,b) => new Date(b.lastAt) - new Date(a.lastAt));
    if (!threads.find(t => t.id === S.activeThread) && threads.length) S.activeThread = threads[0].id;
    const active = threads.find(t => t.id === S.activeThread);
    const msgs = active ? (HM.db.messages[active.id] || []) : [];

    root.innerHTML = `
      <div class="chat">
        <div class="chat-list">
          <div style="padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:13px;font-weight:800">שיחות</div>
            ${HM.badge(String(threads.length), 'gray')}
          </div>
          ${threads.map(t => {
            const p = HM.pro(t.proId);
            const last = (HM.db.messages[t.id] || []).slice(-1)[0];
            return `<div class="lrow" data-thread="${t.id}" style="${t.id===S.activeThread?'background:var(--accent-soft)':''}">
              ${HM.avatar(p.name, HM.trade(p.trade).color, 'sm')}
              <div class="lrow-main">
                <div class="lrow-title">${HM.esc(p.name)}</div>
                <div class="lrow-sub">${last ? HM.esc(last.body) : 'אין הודעות'}</div>
              </div>
              ${t.unread ? `<span class="badge orange">${t.unread}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
        <div class="chat-thread">
          ${active ? `
            <div class="chat-head">
              ${HM.avatar(HM.pro(active.proId).name, HM.trade(HM.pro(active.proId).trade).color, 'sm')}
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:800">${HM.esc(HM.pro(active.proId).name)}</div>
                <div style="font-size:10.5px;color:var(--muted)">${HM.trade(HM.pro(active.proId).trade).name} · ${HM.esc(HM.request(active.requestId)?.address || '')}</div>
              </div>
              <button class="btn btn-ghost btn-sm" data-req="${active.requestId}">${HM.icon('file', 13)} הבקשה</button>
            </div>
            <div class="chat-body" id="chatBody">
              ${msgs.map(m => `<div class="msg ${m.from==='me'?'me':'them'}">${HM.esc(m.body)}<span class="msg-time">${HM.fmt.time(m.at)}</span></div>`).join('')}
            </div>
            <div class="chat-input">
              <input class="input" id="msgInput" placeholder="כתבו הודעה..." aria-label="הודעה">
              <button class="btn btn-primary" id="sendMsg" aria-label="שלח">${HM.icon('send', 15)}</button>
            </div>` : HM.empty('message', 'אין שיחות', 'שיחות נפתחות אחרי אישור הצעה.')}
        </div>
      </div>`;

    root.querySelectorAll('[data-thread]').forEach(el => el.addEventListener('click', () => {
      S.activeThread = el.dataset.thread;
      const t = HM.db.threads.find(x => x.id === S.activeThread);
      if (t) t.unread = 0;
      renderChat(root);
      HM.syncChrome();
    }));
    root.querySelectorAll('[data-req]').forEach(el => el.addEventListener('click', () => openRequestDetail(el.dataset.req)));

    const body = root.querySelector('#chatBody');
    if (body) body.scrollTop = body.scrollHeight;
    const send = () => {
      const input = root.querySelector('#msgInput');
      const val = input.value.trim();
      if (!val) return;
      HM.addMessage(S.activeThread, 'me', val);
      input.value = '';
      renderChat(root);
      setTimeout(() => {
        const replies = ['סבבה, מעדכן.', 'אגיע בזמן, אל תדאג.', 'שולח לך תמונה כשאסיים.', 'מעולה, נתראה.'];
        HM.addMessage(S.activeThread, 'them', replies[Math.floor(Math.random()*replies.length)]);
        if (HM.state.role === 'customer' && HM.parseHash().view === 'chat') renderChat(root);
        HM.syncChrome();
      }, 1400);
    };
    const btn = root.querySelector('#sendMsg');
    if (btn) btn.addEventListener('click', send);
    const inp = root.querySelector('#msgInput');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  /* ---------------- Entry ---------------- */
  HM.views.customer = function(root, view){
    destroyMap();
    if (view === 'chat') return renderChat(root);
    if (view === 'requests') return renderRequests(root);
    return renderSearch(root);
  };
})();
