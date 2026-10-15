// pages/analytics.js — laporan & grafik (Admin dan Kepala Sekolah)
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.analytics = {
  title: 'Laporan & Grafik',
  auth: true,
  roles: ['Admin', 'Kepala Sekolah'],
  async render(view, ctx) {
    const d = UI.obj(await Api.call('laporan.get'));
    if (!ctx.isCurrent()) return;

    const kat = UI.obj(d.kategoriCounts), trend = UI.arr(d.trend), guru = UI.arr(d.laporanGuru);

    view.innerHTML =
      '<div class="section-head"><div><h2>Laporan &amp; Grafik</h2><p class="muted">Overview media usage and statistics.</p></div>' +
        '<button class="btn btn-outline" id="btnExport" type="button"><i class="bi bi-download"></i> Export CSV</button></div>' +
      '<div class="grid grid-2">' +
        '<div class="panel-card"><h6 class="mb-3">Penggunaan per Kategori</h6><div class="chart-box"><canvas id="chartKategori"></canvas></div></div>' +
        '<div class="panel-card"><h6 class="mb-3">Tren Peminjaman</h6><div class="chart-box"><canvas id="chartTrenLaporan"></canvas></div></div>' +
      '</div>' +
      '<div class="panel-card pad-0 chart-pair">' +
        '<div class="panel-card card-flat"><h6>Laporan Penggunaan per Guru/Staf</h6></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Nama / Peran</th><th>Total Pinjam</th><th>Jam Penggunaan</th><th>Status Dominan</th></tr></thead><tbody>' +
        (guru.length === 0 ? '<tr><td colspan="4" class="center muted">Belum ada data.</td></tr>' : guru.map(function (g) {
          return '<tr><td><div class="person"><div class="mini-avatar">' + UI.esc(UI.initials(g.nama)) + '</div>' +
            '<div><div class="semibold">' + UI.esc(g.nama) + '</div>' + UI.roleBadge(g.role) + '</div></div></td>' +
            '<td>' + UI.esc(g.totalPinjam) + 'x</td><td>' + UI.esc(g.jamPenggunaan) + ' Jam</td><td>' + UI.chip(g.statusDominan) + '</td></tr>';
        }).join('')) + '</tbody></table></div>' +
      '</div>';

    UI.chart('kategori', view.querySelector('#chartKategori'), 'bar', Object.keys(kat), Object.keys(kat).map(function (k) { return kat[k]; }));
    UI.chart('trenLaporan', view.querySelector('#chartTrenLaporan'), 'line',
      trend.map(function (t) { return t.week; }), trend.map(function (t) { return t.jumlah; }));

    view.querySelector('#btnExport').addEventListener('click', function () {
      UI.info('Gunakan Google Sheets → File → Download → CSV pada sheet Peminjaman untuk export lengkap.');
    });
  }
};
