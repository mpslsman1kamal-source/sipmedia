// ui.js — pembantu tampilan: notifikasi, loading, modal, escape HTML, grafik.
window.App = window.App || {};

const UI = {

  // Semua teks dari server WAJIB lewat UI.esc() sebelum masuk innerHTML (cegah XSS)
  esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  // Pastikan bentuk data dari server (halaman tidak boleh runtuh bila bentuknya tak terduga)
  arr(v) { return Array.isArray(v) ? v : []; },
  obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; },

  // ---------- Notifikasi ----------
  _notifTimer: null,
  notif(message, type) {
    const el = document.getElementById('notif');
    if (!el) return;
    const t = type || 'success';
    const icons = { success: 'bi-check-circle', error: 'bi-x-circle', warning: 'bi-exclamation-triangle', info: 'bi-info-circle' };
    const titles = { success: 'Berhasil', error: 'Gagal', warning: 'Peringatan', info: 'Info' };
    el.className = 'toast toast-' + t;
    el.innerHTML = '<i class="bi toast-icon ' + (icons[t] || icons.info) + '"></i>' +
      '<div><span class="toast-title">' + UI.esc(titles[t] || '') + '</span>' + UI.esc(message) + '</div>';
    void el.offsetWidth; // mulai ulang transisi
    el.classList.add('show');
    clearTimeout(UI._notifTimer);
    UI._notifTimer = setTimeout(function () { el.classList.remove('show'); }, 4000);
  },
  success(m) { UI.notif(m, 'success'); },
  error(m)   { UI.notif(m, 'error'); },
  warning(m) { UI.notif(m, 'warning'); },
  info(m)    { UI.notif(m, 'info'); },

  // ---------- Loading (untuk aksi: simpan, setujui, dst.) ----------
  _loadingCount: 0,
  loading(show) {
    UI._loadingCount = Math.max(0, UI._loadingCount + (show ? 1 : -1));
    const el = document.getElementById('loading');
    if (el) el.classList.toggle('show', UI._loadingCount > 0);
  },

  // Bungkus aksi async: loading + galat jadi notifikasi. Mengembalikan hasil, atau null bila gagal.
  async run(fn) {
    UI.loading(true);
    try { return await fn(); }
    catch (err) { UI.error(err.message || 'Terjadi kesalahan.'); return null; }
    finally { UI.loading(false); }
  },

  // ---------- Potongan HTML yang dipakai ulang ----------
  spinnerBlock(msg) {
    return '<div class="loading-inline"><div class="spinner"></div><p>' + UI.esc(msg || 'Memuat data...') + '</p></div>';
  },
  empty(msg, icon) {
    return '<div class="empty-state"><i class="bi ' + UI.esc(icon || 'bi-inbox') + '"></i><p>' + UI.esc(msg) + '</p></div>';
  },
  chip(status) {
    const cls = 'status-' + String(status === undefined || status === null ? '' : status).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return '<span class="status-chip ' + cls + '">' + UI.esc(status) + '</span>';
  },
  roleClass(role) { return 'role-' + String(role || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); },
  roleBadge(role) { return '<span class="role-badge ' + UI.roleClass(role) + '">' + UI.esc(role) + '</span>'; },
  initials(name) {
    if (!name) return '--';
    return String(name).split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  },

  // ---------- Modal ----------
  // UI.modal({ title, body (HTML), footer (HTML) }) → { el, close }
  modal(opts) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true">' +
        (opts.title ? '<div class="modal-head"><h5>' + UI.esc(opts.title) + '</h5><button type="button" class="modal-close" data-close aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div>' : '') +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    const onKey = function (e) { if (e.key === 'Escape') close(); };
    const close = function () {
      document.removeEventListener('keydown', onKey);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    const first = wrap.querySelector('input:not([type=hidden]), select, textarea');
    if (first) first.focus();
    return { el: wrap, close: close };
  },

  debounce(fn, ms) {
    let t;
    return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  },

  // ---------- Grafik (Chart.js lokal di vendor/) ----------
  cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
  _charts: {},

  chartPalette() {
    return {
      text: UI.cssVar('--chart-text'), grid: UI.cssVar('--chart-grid'), fill: UI.cssVar('--chart-fill'),
      series: ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map(UI.cssVar)
    };
  },

  // kind: 'line' | 'bar'. Mengembalikan false bila Chart.js tidak termuat.
  chart(key, canvas, kind, labels, values) {
    if (UI._charts[key]) { UI._charts[key].destroy(); delete UI._charts[key]; }
    if (!canvas) return false;
    if (typeof Chart === 'undefined') {
      canvas.parentNode.innerHTML = UI.empty('Grafik tidak dapat dimuat.', 'bi-bar-chart');
      return false;
    }
    UI._charts[key] = new Chart(canvas, {
      type: kind,
      data: { labels: labels, datasets: [{ data: values, fill: kind === 'line', tension: 0.4, pointRadius: 4, borderRadius: 6 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
    UI._charts[key]._kind = kind;
    UI.applyChartTheme(UI._charts[key]);
    return true;
  },

  applyChartTheme(chart) {
    const p = UI.chartPalette();
    const ds = chart.data.datasets[0];
    if (chart._kind === 'line') { ds.borderColor = p.series[0]; ds.backgroundColor = p.fill; ds.pointBackgroundColor = p.series[0]; }
    else { ds.backgroundColor = p.series; }
    chart.options.scales.x.ticks = { color: p.text };
    chart.options.scales.y.ticks = { color: p.text, precision: 0 };
    chart.options.scales.y.grid = { color: p.grid };
    chart.update();
  },

  refreshCharts() {
    Object.keys(UI._charts).forEach(function (k) {
      const c = UI._charts[k];
      if (c && c.canvas && document.body.contains(c.canvas)) UI.applyChartTheme(c);
    });
  }
};

window.UI = UI;
