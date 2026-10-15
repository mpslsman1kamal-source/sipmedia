// pages/history.js — riwayat peminjaman (Admin/Kepala Sekolah: semua; Guru/OSIS: milik sendiri)
window.App = window.App || {};
App.pages = App.pages || {};

(function () {
  const FILTERS = ['Semua', 'Menunggu', 'Disetujui', 'Ditolak'];
  const st = { filter: 'Semua' };

  function draw(view, data) {
    const u = App.state.user || {};
    const wide = ['Admin', 'Kepala Sekolah'].indexOf(u.role) !== -1;
    const rows = st.filter === 'Semua' ? data : data.filter(function (r) { return r.Status_Approval === st.filter; });

    view.innerHTML =
      '<div class="section-head"><div><h2>Riwayat Peminjaman</h2><p class="muted">Histori seluruh transaksi peminjaman.</p></div></div>' +
      '<div class="tab-pills">' + FILTERS.map(function (s) {
        return '<button type="button" class="tab-pill' + (st.filter === s ? ' active' : '') + '" data-filter="' + s + '">' + s + '</button>';
      }).join('') + '</div>' +
      '<div class="panel-card pad-0">' +
        (rows.length === 0 ? UI.empty('Belum ada riwayat peminjaman.', 'bi-clock-history') :
          '<div class="table-wrap"><table class="table"><thead><tr><th>Item</th>' + (wide ? '<th>Peminjam</th>' : '') +
          '<th>Tanggal</th><th>Waktu</th><th>Status</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr><td>' + UI.esc(r.Nama_Item) + '<div class="muted small">' + UI.esc(r.Unit_Kelas) + '</div></td>' +
              (wide ? '<td>' + UI.esc(r.Nama_Peminjam) + '</td>' : '') +
              '<td>' + UI.esc(r.Tanggal) + '</td><td>' + UI.esc(r.Jam_Mulai) + ' - ' + UI.esc(r.Jam_Selesai) + '</td>' +
              '<td>' + UI.chip(r.Status_Approval) + '</td></tr>';
          }).join('') + '</tbody></table></div>') +
      '</div>';

    view.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () { st.filter = b.getAttribute('data-filter'); draw(view, data); });
    });
  }

  App.pages.history = {
    title: 'Riwayat Peminjaman',
    auth: true,
    async render(view, ctx) {
      const u = App.state.user || {};
      const scope = ['Admin', 'Kepala Sekolah'].indexOf(u.role) !== -1 ? 'all' : 'mine';
      const data = UI.arr(await Api.call('peminjaman.list', { scope: scope }));
      if (!ctx.isCurrent()) return;
      draw(view, data);
    }
  };
})();
