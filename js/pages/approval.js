// pages/approval.js — persetujuan peminjaman (Admin memproses; Kepala Sekolah hanya melihat)
window.App = window.App || {};
App.pages = App.pages || {};

(function () {
  const TABS = ['Menunggu', 'Disetujui', 'Ditolak'];
  const st = { tab: 'Menunggu', data: [] };

  function draw(view, reload) {
    const u = App.state.user || {};
    const isAdmin = u.role === 'Admin';
    const counts = {};
    st.data.forEach(function (r) { counts[r.Status_Approval] = (counts[r.Status_Approval] || 0) + 1; });
    const rows = st.data.filter(function (r) { return r.Status_Approval === st.tab; });

    view.innerHTML =
      '<div class="section-head"><div><h2>Approval</h2><p class="muted">' +
        (isAdmin ? 'Review dan proses permintaan peminjaman peralatan.' : 'Lihat status persetujuan peminjaman (mode lihat).') + '</p></div></div>' +
      '<div class="tab-pills">' + TABS.map(function (s) {
        return '<button type="button" class="tab-pill' + (st.tab === s ? ' active' : '') + '" data-tab="' + s + '">' + s +
          (counts[s] ? '<span class="count-dot">' + counts[s] + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="panel-card pad-0">' +
        (rows.length === 0 ? UI.empty('Tidak ada data pada status ini.', 'bi-inbox') :
          '<div class="table-wrap"><table class="table"><thead><tr><th>Peminjam</th><th>Item / Ruang</th><th>Jadwal</th><th>Status</th>' +
          (isAdmin ? '<th>Aksi</th>' : '') + '</tr></thead><tbody>' +
          rows.map(function (r) {
            const act = isAdmin
              ? (r.Status_Approval === 'Menunggu'
                ? '<td><div class="action-cell">' +
                    '<button type="button" class="btn btn-soft-danger btn-sm" data-reject="' + UI.esc(r.ID_Peminjaman) + '" data-item="' + UI.esc(r.Nama_Item) + '" data-nama="' + UI.esc(r.Nama_Peminjam) + '" aria-label="Tolak"><i class="bi bi-x-lg"></i></button>' +
                    '<button type="button" class="btn btn-soft-success btn-sm" data-approve="' + UI.esc(r.ID_Peminjaman) + '" aria-label="Setujui"><i class="bi bi-check-lg"></i></button>' +
                  '</div></td>'
                : '<td>-</td>')
              : '';
            return '<tr>' +
              '<td><div class="person"><div class="mini-avatar">' + UI.esc(UI.initials(r.Nama_Peminjam)) + '</div>' +
                '<div><div class="semibold">' + UI.esc(r.Nama_Peminjam) + '</div>' + UI.roleBadge(r.Role) + '</div></div></td>' +
              '<td>' + UI.esc(r.Nama_Item) + '<div class="muted small">' + UI.esc(r.Unit_Kelas) + '</div></td>' +
              '<td>' + UI.esc(r.Tanggal) + '<div class="muted small">' + UI.esc(r.Jam_Mulai) + ' - ' + UI.esc(r.Jam_Selesai) + '</div></td>' +
              '<td>' + UI.chip(r.Status_Approval) + (r.Alasan_Tolak ? '<div class="reason">' + UI.esc(r.Alasan_Tolak) + '</div>' : '') + '</td>' +
              act + '</tr>';
          }).join('') + '</tbody></table></div>') +
      '</div>';

    view.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { st.tab = b.getAttribute('data-tab'); draw(view, reload); });
    });
    view.querySelectorAll('[data-approve]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const res = await UI.run(function () { return Api.call('peminjaman.proses', { id: b.getAttribute('data-approve'), aksi: 'setujui' }); });
        if (res) { UI.success(res.message || 'Pengajuan disetujui.'); reload(); }
      });
    });
    view.querySelectorAll('[data-reject]').forEach(function (b) {
      b.addEventListener('click', function () { openReject(b.getAttribute('data-reject'), b.getAttribute('data-item'), b.getAttribute('data-nama'), reload); });
    });
  }

  function openReject(id, item, nama, reload) {
    const m = UI.modal({
      title: 'Tolak Peminjaman',
      body: '<div class="modal-icon-warning"><i class="bi bi-exclamation-triangle"></i></div>' +
        '<p class="muted">Anda akan menolak permintaan peminjaman <strong>' + UI.esc(item) + '</strong> oleh <strong>' + UI.esc(nama) + '</strong>.</p>' +
        '<label class="form-label" for="rejectReason">Alasan Penolakan <span class="required">*</span></label>' +
        '<textarea class="textarea" id="rejectReason" rows="3" placeholder="Masukkan alasan penolakan (misal: Barang sedang rusak atau jadwal bentrok)..."></textarea>',
      footer: '<button type="button" class="btn btn-secondary" data-close>Batal</button>' +
        '<button type="button" class="btn btn-danger" id="confirmRejectBtn"><i class="bi bi-x-lg"></i> Konfirmasi Tolak</button>'
    });
    m.el.querySelector('#confirmRejectBtn').addEventListener('click', async function () {
      const alasan = m.el.querySelector('#rejectReason').value.trim();
      if (!alasan) { UI.warning('Alasan penolakan wajib diisi.'); return; }
      const res = await UI.run(function () { return Api.call('peminjaman.proses', { id: id, aksi: 'tolak', alasan: alasan }); });
      if (res) { m.close(); UI.success(res.message || 'Pengajuan ditolak.'); reload(); }
    });
  }

  App.pages.approval = {
    title: 'Approval',
    auth: true,
    roles: ['Admin', 'Kepala Sekolah'],
    async render(view, ctx) {
      const reload = async function () {
        st.data = UI.arr(await Api.call('peminjaman.list', { scope: 'all' }));
        if (ctx.isCurrent()) draw(view, reload);
      };
      await reload();
    }
  };
})();
