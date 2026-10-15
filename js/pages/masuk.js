// pages/masuk.js — halaman login
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.masuk = {
  title: 'Masuk',
  auth: false,
  async render(view) {
    view.innerHTML =
      '<div class="login-screen"><div class="login-card">' +
        '<div class="login-banner"><i class="bi bi-camera-reels"></i></div>' +
        '<div class="login-body">' +
          '<h1 class="login-title">SIPMEDIA</h1>' +
          '<p class="login-subtitle">Sistem Peminjaman Ruang Media &amp; Peralatan Sekolah</p>' +
          '<form id="form-masuk" novalidate>' +
            '<div class="field"><label class="form-label" for="loginEmail">Email</label>' +
              '<div class="input-icon"><i class="bi bi-envelope"></i>' +
              '<input class="input" type="email" id="loginEmail" placeholder="nama@sekolah.sch.id" autocomplete="username" required></div></div>' +
            '<div class="field"><label class="form-label" for="loginPassword">Password</label>' +
              '<div class="input-icon"><i class="bi bi-lock"></i>' +
              '<input class="input" type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password" required>' +
              '<button type="button" class="icon-toggle" id="btnEye" aria-label="Tampilkan sandi"><i class="bi bi-eye" id="eyeIcon"></i></button></div></div>' +
            '<button type="submit" class="btn btn-block" id="loginBtn"><i class="bi bi-box-arrow-in-right"></i> Masuk</button>' +
            '<div class="login-error" id="loginError" role="alert"></div>' +
          '</form>' +
        '</div>' +
      '</div></div>';

    const $ = function (id) { return view.querySelector('#' + id); };

    $('btnEye').addEventListener('click', function () {
      const input = $('loginPassword');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      $('eyeIcon').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    });

    $('form-masuk').addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = $('loginEmail').value.trim();
      const password = $('loginPassword').value;
      const err = $('loginError');
      const btn = $('loginBtn');
      err.textContent = '';
      if (!email || !password) { err.textContent = 'Isi email dan password.'; return; }

      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';
      btn.disabled = true;
      try {
        const res = UI.obj(await Api.call('auth.login', { email: email, password: password }));
        App.setSession(res.token, res.user);
        Router.go('dashboard');
      } catch (ex) {
        err.textContent = ex.message || 'Gagal masuk.';
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  }
};
