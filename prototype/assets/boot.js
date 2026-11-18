/* ============================================================
   HANDIMANS — Boot
   ============================================================ */
(function(){
  function init(){
    if (!location.hash) location.hash = '#/customer/search';

    document.querySelectorAll('.roleswitch button').forEach(b => {
      b.addEventListener('click', () => {
        const role = b.dataset.role;
        const target = role === 'pro' ? 'pro/dashboard'
          : role === 'admin' ? 'admin/overview'
          : role === 'contractor' ? 'contractor/dashboard'
          : 'customer/search';
        HM.go(target);
      });
    });

    const notif = document.getElementById('notifBtn');
    if (notif) notif.addEventListener('click', () => {
      const unread = HM.db.threads.reduce((s,t) => s + (t.unread||0), 0);
      HM.toast(unread ? `${unread} הודעות שלא נקראו` : 'אין התראות חדשות');
    });

    const overlay = document.getElementById('modalOverlay');
    overlay.addEventListener('click', e => { if (e.target === overlay) HM.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') HM.closeModal(); });

    HM.render();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
