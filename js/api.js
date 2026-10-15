// api.js — SATU-SATUNYA tempat fetch ke GAS. Halaman hanya memanggil Api.call().
window.App = window.App || {};

const Api = {

  // Metode HTTP tiap action. Isi mengikuti peta-migrasi.json.
  methods: {
    'ping': 'GET',
    'auth.login': 'POST',
    'auth.logout': 'POST',
    'dashboard.get': 'GET',
    'peminjaman.list': 'GET',
    'peminjaman.cekBentrok': 'GET',
    'peminjaman.submit': 'POST',
    'peminjaman.proses': 'POST',
    'jadwal.list': 'GET',
    'laporan.get': 'GET',
    'aset.list': 'GET',
    'aset.save': 'POST',
    'aset.delete': 'POST',
    'pengguna.list': 'GET',
    'pengguna.save': 'POST',
    'config.get': 'GET',
    'config.set': 'POST'
  },

  tokenKey: 'app_token',
  userKey: 'app_user',

  getToken() { try { return sessionStorage.getItem(Api.tokenKey) || ''; } catch (e) { return ''; } },
  setToken(t) { try { t ? sessionStorage.setItem(Api.tokenKey, t) : sessionStorage.removeItem(Api.tokenKey); } catch (e) { /* abaikan */ } },

  // Profil (nama, role) hanya untuk tampilan agar bertahan setelah reload.
  // Hak akses yang sebenarnya SELALU diperiksa server lewat token.
  getUser() { try { return JSON.parse(sessionStorage.getItem(Api.userKey) || 'null'); } catch (e) { return null; } },
  setUser(u) { try { u ? sessionStorage.setItem(Api.userKey, JSON.stringify(u)) : sessionStorage.removeItem(Api.userKey); } catch (e) { /* abaikan */ } },

  async call(action, payload) {
    const method = Api.methods[action];
    if (!method) throw Api.error('Action belum terdaftar di Api.methods: ' + action, 'VALIDATION');

    const base = App.config.GAS_URL;
    if (!base || base.indexOf('GANTI_') === 0) {
      throw Api.error('GAS_URL belum diisi di js/config.js', 'CONFIG');
    }

    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, App.config.TIMEOUT_MS);

    try {
      let res;
      if (method === 'GET') {
        const q = new URLSearchParams(Object.assign({ action: action, token: Api.getToken() }, payload || {}));
        res = await fetch(base + '?' + q.toString(), { signal: ctrl.signal });
      } else {
        // action dikirim lewat query string agar Router (e.parameter.action) bisa memilih route
        res = await fetch(base + '?action=' + encodeURIComponent(action), {
          method: 'POST',
          // WAJIB text/plain: JSON memicu preflight CORS yang ditolak GAS
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ token: Api.getToken(), data: payload || {} }),
          signal: ctrl.signal
        });
      }
      const json = await res.json();
      if (!json.success) {
        if (json.code === 'AUTH' && App.onAuthExpired) App.onAuthExpired();
        throw Api.error(json.message || 'Terjadi kesalahan.', json.code);
      }
      return json.data;
    } catch (err) {
      if (err.name === 'AbortError') throw Api.error('Server terlalu lama menjawab. Coba lagi.', 'TIMEOUT');
      if (err.code) throw err;
      throw Api.error('Tidak dapat terhubung ke server. Periksa koneksi internet.', 'NETWORK');
    } finally {
      clearTimeout(timer);
    }
  },

  // Cache baca singkat di sessionStorage untuk data yang jarang berubah
  async cached(action, payload, ttlMs) {
    const key = 'c:' + action + ':' + JSON.stringify(payload || {});
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const o = JSON.parse(raw);
        if (Date.now() - o.t < (ttlMs || 60000)) return o.v;
      }
    } catch (e) { /* abaikan */ }
    const v = await Api.call(action, payload);
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { /* abaikan */ }
    return v;
  },

  error(message, code) {
    const e = new Error(message);
    e.code = code || 'SERVER';
    return e;
  }
};

window.Api = Api;
