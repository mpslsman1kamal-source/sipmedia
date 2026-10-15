// pages/dashboard.js — ringkasan sesuai peran (Admin/Kepala Sekolah: ringkasan penuh; Guru/OSIS: milik sendiri)
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.dashboard = {
  title: 'Dashboard',
  auth: true,
  async render(view, ctx) {
    const d = UI.obj(await Api.call('dashboard.get'));
    if (!ctx.isCurrent()) return;

    const u = App.state.user || {};
    const role = d.role || u.role;
    const privileged = ['Admin', 'Kepala Sekolah'].indexOf(role) !== -1;
    const num = function (v) { return UI.esc(v === undefined || v === null ? 0 : v); };

    if (privileged) {
      const pending = UI.arr(d.pending), top = UI.arr(d.topItems), insights = UI.arr(d.insights);
      view.innerHTML =
        '<div class="section-head"><div><h2>Dashboard Overview</h2><p class="muted">Ringkasan aktivitas dan penggunaan fasilitas sekolah.</p></div></div>' +
        '<div class="grid grid-4 mb-4">' +
          statCard('bi-clipboard-check', num(d.menunggu), 'Pending Approval', true) +
          statCard('bi-people', d.totalUsers === undefined ? '-' : num(d.totalUsers), 'Total Users') +
          statCard('bi-hdd-stack', d.totalAset === undefined ? '-' : num(d.totalAset), 'Active Items') +
          statCard('bi-clock-history', num(d.totalPeminjaman), 'Total History') +
        '</div>' +
        '<div class="grid grid-main">' +
          '<div>' +
            '<div class="panel-card mb-4">' +
              '<div class="row between mb-3"><h5 class="mb-0">Pengajuan Menunggu Persetujuan</h5><a class="small" href="#/approval">Lihat Semua →</a></div>' +
              (pending.length === 0 ? UI.empty('Tidak ada pengajuan menunggu.', 'bi-check2-circle') :
                '<div class="table-wrap"><table class="table"><thead><tr><th>Peminjam</th><th>Item</th><th>Tanggal</th></tr></thead><tbody>' +
                pending.map(function (p) {
                  return '<tr><td><div class="person"><div class="mini-avatar">' + UI.esc(UI.initials(p.nama)) + '</div>' +
                    '<div><div class="semibold">' + UI.esc(p.nama) + '</div><div class="muted small">' + UI.esc(p.ruang) + '</div></div></div></td>' +
                    '<td>' + UI.esc(p.item) + '</td>' +
                    '<td>' + UI.esc(p.tanggal) + '<div class="muted small">' + UI.esc(p.mulai) + ' - ' + UI.esc(p.selesai) + '</div></td></tr>';
                }).join('') + '</tbody></table></div>') +
            '</div>' +
            '<div class="panel-card"><h5 class="mb-3">Tren Peminjaman</h5><div class="chart-box"><canvas id="chartTrend"></canvas></div></div>' +
          '</div>' +
          '<div>' +
            '<div class="panel-card mb-4"><h6 class="mb-3">Item Paling Sering Dipinjam</h6>' +
              (top.length === 0 ? UI.empty('Belum ada data', 'bi-bar-chart') : top.map(function (it) {
                const w = Math.min(100, (Number(it.count) || 0) * 10);
                return '<div class="top-item"><div class="row between small"><span>' + UI.esc(it.name) + '</span><span class="muted">' + UI.esc(it.count) + '</span></div>' +
                  '<div class="progress"><div class="progress-bar" style="width:' + w + '%"></div></div></div>';
              }).join('')) +
            '</div>' +
            '<div class="insight-card"><h6><i class="bi bi-lightbulb"></i> Analisis Otomatis</h6><ul>' +
              insights.map(function (i) { return '<li>' + UI.esc(i) + '</li>'; }).join('') + '</ul></div>' +
          '</div>' +
        '</div>';
      const trend = UI.arr(d.trend);
      UI.chart('trend', view.querySelector('#chartTrend'), 'line',
        trend.map(function (t) { return t.tanggal; }), trend.map(function (t) { return t.jumlah; }));
      return;
    }

    const recent = UI.arr(d.recent);
    const first = String(d.nama || u.nama || '').split(' ')[0];
    view.innerHTML =
      '<div class="section-head"><div><h2>Selamat Datang, ' + UI.esc(first) + '</h2>' +
        '<p class="muted">' + UI.esc(role) + ' — Pantau aktivitas peminjaman media dan ruang Anda hari ini.</p></div></div>' +
      '<div class="grid grid-3-always mb-4">' +
        '<div class="stat-card"><div class="stat-value">' + num(d.totalPeminjaman) + '</div><div class="stat-label">Total Peminjaman</div></div>' +
        '<div class="stat-card"><div class="stat-value is-success">' + num(d.disetujui) + '</div><div class="stat-label">Disetujui</div></div>' +
        '<div class="stat-card"><div class="stat-value is-warning">' + num(d.menunggu) + '</div><div class="stat-label">Menunggu</div></div>' +
      '</div>' +
      '<div class="grid grid-2 mb-4">' +
        '<a class="panel-card clickable quick-card is-amber" href="#/booking"><i class="bi bi-plus-circle"></i><h5>Ajukan Peminjaman Baru</h5>' +
          '<p class="muted small mb-0">Pesan proyektor, ruang lab, atau perangkat lainnya untuk kebutuhan kelas.</p></a>' +
        '<a class="panel-card clickable quick-card is-blue" href="#/schedule"><i class="bi bi-calendar3"></i><h5>Lihat Jadwal Kalender</h5>' +
          '<p class="muted small mb-0">Cek ketersediaan ruangan dan alat sebelum membuat pengajuan baru.</p></a>' +
      '</div>' +
      '<div class="panel-card">' +
        '<div class="row between mb-3"><h5 class="mb-0">Pengajuan Terbaru Saya</h5><a class="small" href="#/history">Lihat Semua →</a></div>' +
        (recent.length === 0 ? UI.empty('Belum ada pengajuan.', 'bi-inbox') :
          '<div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>Tanggal</th><th>Waktu</th><th>Status</th></tr></thead><tbody>' +
          recent.map(function (r) {
            return '<tr><td>' + UI.esc(r.item) + '<div class="muted small">' + UI.esc(r.ruang) + '</div></td><td>' + UI.esc(r.tanggal) + '</td>' +
              '<td>' + UI.esc(r.mulai) + ' - ' + UI.esc(r.selesai) + '</td><td>' + UI.chip(r.status) + '</td></tr>';
          }).join('') + '</tbody></table></div>') +
      '</div>';

    function statCard(icon, value, label, accent) {
      return '<div class="stat-card' + (accent ? ' accent-fill' : '') + '"><div class="stat-icon"><i class="bi ' + icon + '"></i></div>' +
        '<div class="stat-value">' + value + '</div><div class="stat-label">' + UI.esc(label) + '</div></div>';
    }
  }
};
