// router.js — navigasi antar-halaman memakai hash (#/nama). Cocok untuk GitHub Pages
// karena tidak butuh pengaturan server.
window.App = window.App || {};
App.pages = App.pages || {};

const Router = {
  defaultPage: 'dashboard',
  _seq: 0,

  start() {
    window.addEventListener('hashchange', Router.render);
    Router.render();
  },

  current() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return h || Router.defaultPage;
  },

  go(name) {
    if (Router.current() === name && location.hash) { Router.render(); return; }
    location.hash = '#/' + name;
  },

  async render() {
    const name = Router.current();
    const page = App.pages[name];
    const root = document.getElementById('page-root');
    if (!root) return;

    if (!page) {
      root.innerHTML = '<div class="empty-state">Halaman tidak ditemukan.</div>';
      return;
    }
    const loggedIn = !!Api.getToken();
    if (page.auth && !loggedIn) { Router.go('masuk'); return; }
    if (name === 'masuk' && loggedIn) { Router.go(Router.defaultPage); return; }

    // Tampilan masuk tidak memakai sidebar dan topbar
    document.body.setAttribute('data-view', page.auth === false ? 'login' : 'app');
    if (App.closeSidebar) App.closeSidebar();
    if (App.refreshChrome) App.refreshChrome();

    const u = App.state && App.state.user;
    if (page.roles && (!u || page.roles.indexOf(u.role) === -1)) {
      root.innerHTML = '<div class="panel-card">' + UI.empty('Anda tidak berhak membuka halaman ini.', 'bi-lock') + '</div>';
      return;
    }

    document.title = page.title + ' — ' + App.config.APP_NAME;
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-page') === name);
    });

    // Tiap render punya wadah sendiri. Bila pengguna pindah halaman sebelum data tiba,
    // halaman lama menulis ke wadah yang sudah dilepas, jadi tidak menimpa halaman baru.
    const seq = ++Router._seq;
    const view = document.createElement('div');
    view.className = 'page-view';
    view.innerHTML = UI.spinnerBlock('Memuat...');
    root.replaceChildren(view);
    try {
      await page.render(view, { name: name, isCurrent: function () { return seq === Router._seq; } });
    } catch (err) {
      if (seq === Router._seq) view.innerHTML = '<div class="panel-card">' + UI.empty(err.message || 'Terjadi kesalahan.', 'bi-exclamation-triangle') + '</div>';
    }
  }
};

window.Router = Router;
