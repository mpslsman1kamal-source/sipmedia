// pages/schedule.js — kalender jadwal peminjaman (Menunggu dan Disetujui)
window.App = window.App || {};
App.pages = App.pages || {};

(function () {
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Minggu'];
  const KNOWN = { Disetujui: 1, Menunggu: 1 };
  const st = { month: new Date().getMonth(), year: new Date().getFullYear(), data: [] };

  function draw(view) {
    const startOffset = (new Date(st.year, st.month, 1).getDay() + 6) % 7; // Senin = 0
    const daysInMonth = new Date(st.year, st.month + 1, 0).getDate();

    const byDate = {};
    st.data.forEach(function (ev) { (byDate[ev.tanggalIso] = byDate[ev.tanggalIso] || []).push(ev); });

    let cells = '';
    for (let i = 0; i < startOffset; i++) cells += '<div class="calendar-cell muted"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = st.year + '-' + String(st.month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const events = byDate[iso] || [];
      cells += '<div class="calendar-cell"><div class="calendar-date">' + d + '</div>' +
        events.slice(0, 3).map(function (ev) {
          const cls = KNOWN[ev.status] ? ' status-' + ev.status : '';
          return '<span class="cal-event' + cls + '" title="' + UI.esc(ev.item) + ' - ' + UI.esc(ev.peminjam) + '">' + UI.esc(ev.item) + '</span>';
        }).join('') +
        (events.length > 3 ? '<span class="muted small">+' + (events.length - 3) + ' lainnya</span>' : '') +
        '</div>';
    }

    view.innerHTML =
      '<div class="section-head">' +
        '<div><h2>Jadwal Peminjaman</h2><p class="muted">Kelola dan pantau jadwal penggunaan ruangan dan alat.</p></div>' +
        '<div class="row gap-2">' +
          '<button class="icon-btn" type="button" data-month="-1" aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button>' +
          '<strong>' + MONTHS[st.month] + ' ' + st.year + '</strong>' +
          '<button class="icon-btn" type="button" data-month="1" aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="panel-card pad-0 clip">' +
        '<div class="calendar-head">' + DAYS.map(function (n) { return '<div>' + n + '</div>'; }).join('') + '</div>' +
        '<div class="calendar-grid">' + cells + '</div>' +
      '</div>' +
      '<div class="row gap-3 mt-3 small muted">' +
        '<span><span class="cal-event status-Disetujui legend-dot">●</span> Disetujui</span>' +
        '<span><span class="cal-event status-Menunggu legend-dot">●</span> Menunggu</span>' +
      '</div>';

    view.querySelectorAll('[data-month]').forEach(function (b) {
      b.addEventListener('click', function () {
        st.month += Number(b.getAttribute('data-month'));
        if (st.month < 0) { st.month = 11; st.year--; }
        if (st.month > 11) { st.month = 0; st.year++; }
        draw(view);
      });
    });
  }

  App.pages.schedule = {
    title: 'Jadwal Peminjaman',
    auth: true,
    async render(view, ctx) {
      const data = UI.arr(await Api.call('jadwal.list'));
      if (!ctx.isCurrent()) return;
      st.data = data;
      draw(view);
    }
  };
})();
