// app.js — inisialisasi, sesi, menu per peran, tema. Dimuat TERAKHIR setelah semua halaman terdaftar.
window.App = window.App || {};
App.state = App.state || { user: null, assets: null };

// Menu per peran (sama dengan aplikasi lama, termasuk label yang berbeda per peran).
// Ini hanya TAMPILAN; hak akses sebenarnya diperiksa server lewat token.
App.menus = {
  'Admin': [
    { page: 'dashboard',  icon: 'bi-speedometer2',   label: 'Dashboard' },
    { page: 'schedule',   icon: 'bi-calendar3',      label: 'Jadwal' },
    { page: 'booking',    icon: 'bi-plus-square',    label: 'Bookings' },
    { page: 'approval',   icon: 'bi-check2-square',  label: 'Approval' },
    { page: 'history',    icon: 'bi-clock-history',  label: 'History' },
    { page: 'analytics',  icon: 'bi-bar-chart',      label: 'Analytics' },
    { page: 'masterdata', icon: 'bi-hdd-stack',      label: 'Master Data' },
    { page: 'settings',   icon: 'bi-gear',           label: 'Settings' }
  ],
  'Kepala Sekolah': [
    { page: 'dashboard',  icon: 'bi-speedometer2',   label: 'Dashboard' },
    { page: 'schedule',   icon: 'bi-calendar3',      label: 'Jadwal' },
    { page: 'approval',   icon: 'bi-eye',            label: 'Approval (Lihat)' },
    { page: 'history',    icon: 'bi-clock-history',  label: 'Riwayat' },
    { page: 'analytics',  icon: 'bi-bar-chart',      label: 'Laporan & Grafik' }
  ],
  'Guru': [
    { page: 'dashboard',  icon: 'bi-house',          label: 'Dashboard' },
    { page: 'booking',    icon: 'bi-plus-square',    label: 'Ajukan Peminjaman' },
    { page: 'schedule',   icon: 'bi-calendar3',      label: 'Jadwal' },
    { page: 'history',    icon: 'bi-clock-history',  label: 'Riwayat Saya' }
  ],
  'OSIS': [
    { page: 'dashboard',  icon: 'bi-house',          label: 'Dashboard' },
    { page: 'booking',    icon: 'bi-plus-square',    label: 'Ajukan Peminjaman' },
    { page: 'schedule',   icon: 'bi-calendar3',      label: 'Jadwal' },
    { page: 'history',    icon: 'bi-clock-history',  label: 'Riwayat Saya' }
  ]
};

// Sesuaikan header, menu, dan avatar dengan status masuk dan peran pengguna.
App.refreshChrome = function () {
  const u = App.state.user;
  const nav = document.getElementById('sidebarNav');
  if (nav) {
    const items = u ? (App.menus[u.role] || App.menus['Guru']) : [];
    nav.innerHTML = items.map(function (m) {
      return '<li><a class="nav-link" data-page="' + UI.esc(m.page) + '" href="#/' + UI.esc(m.page) + '">' +
        '<i class="bi ' + UI.esc(m.icon) + '"></i> <span>' + UI.esc(m.label) + '</span></a></li>';
    }).join('');
    const cur = Router.current();
    nav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-page') === cur); });
  }
  const name = document.getElementById('userName');
  const avatar = document.getElementById('userAvatar');
  const badge = document.getElementById('userRoleBadge');
  if (name) name.textContent = u ? u.nama : '-';
  if (avatar) avatar.textContent = u ? UI.initials(u.nama) : '--';
  if (badge) { badge.textContent = u ? u.role : '-'; badge.className = 'role-badge ' + UI.roleClass(u && u.role); }
};

App.setSession = function (token, user) {
  Api.setToken(token);
  Api.setUser(user);
  App.state.user = user;
  App.state.assets = null;
  App.refreshChrome();
};

App.onAuthExpired = function () {
  App.setSession('', null);
  Router.go('masuk');
};

App.logout = function () {
  if (Api.getToken()) { Api.call('auth.logout').catch(function () { /* abaikan: sesi di peramban tetap dihapus */ }); }
  App.onAuthExpired();
};

// Daftar ruang & peralatan: disimpan di memori supaya form dan master data terasa instan
App.loadAssets = async function (force) {
  if (!force && App.state.assets) return App.state.assets;
  App.state.assets = UI.arr(await Api.call('aset.list'));
  return App.state.assets;
};

// ---------- Sidebar (HP) ----------
App.closeSidebar = function () {
  const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay');
  if (s) s.classList.remove('show');
  if (o) o.classList.remove('show');
};
App.toggleSidebar = function () {
  const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay');
  if (s) s.classList.toggle('show');
  if (o) o.classList.toggle('show');
};

// ---------- Tema gelap ----------
App.themeKey = 'sipmedia_theme';
App.applyTheme = function (theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const t = document.getElementById('darkModeToggle');
  if (t) t.checked = theme === 'dark';
  UI.refreshCharts();
};
App.savedTheme = function () {
  try { return localStorage.getItem(App.themeKey) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
};
App.toggleTheme = function () {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(App.themeKey, next); } catch (e) { /* abaikan */ }
  App.applyTheme(next);
};

document.addEventListener('DOMContentLoaded', function () {
  App.applyTheme(App.savedTheme());

  const on = function (id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  on('btnLogout', 'click', App.logout);
  on('darkModeToggle', 'change', App.toggleTheme);
  on('btnMenu', 'click', App.toggleSidebar);
  on('sidebarOverlay', 'click', App.closeSidebar);

  App.state.user = Api.getToken() ? Api.getUser() : null;
  if (Api.getToken() && !App.state.user) { Api.setToken(''); }
  App.refreshChrome();
  Router.start();
});
