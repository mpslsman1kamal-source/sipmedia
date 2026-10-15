// pages/masterdata.js — kelola Ruang & Peralatan serta Pengguna (hanya Admin)
window.App = window.App || {};
App.pages = App.pages || {};

(function () {
  const st = { tab: 'aset' };
  const ROLES = ['Guru', 'OSIS', 'Kepala Sekolah', 'Admin'];

  const opts = function (list, selected) {
    return list.map(function (v) { return '<option' + (v === selected ? ' selected' : '') + '>' + UI.esc(v) + '</option>'; }).join('');
  };

  // ---------- Ruang & Peralatan ----------
  async function loadAssets(view, ctx) {
    const wrap = view.querySelector('#masterDataTableWrap');
    const rows = await App.loadAssets(true);
    if (!ctx.isCurrent()) return;
    wrap.innerHTML = '<div class="panel-card pad-0"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Nama Item</th><th>Kategori</th><th>Kapasitas/Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      (rows.length === 0 ? '<tr><td colspan="5" class="center muted">Belum ada data.</td></tr>' : rows.map(function (a, i) {
        return '<tr><td>' + UI.esc(a.Nama_Item) + '</td><td>' + UI.esc(a.Kategori || a.Jenis) + '</td><td>' + UI.esc(a.Kapasitas_Stok || '-') + '</td>' +
          '<td>' + UI.chip(a.Status) + '</td>' +
          '<td><div class="action-cell">' +
            '<button type="button" class="btn btn-outline btn-sm" data-edit="' + i + '" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' +
            '<button type="button" class="btn btn-soft-danger btn-sm" data-del="' + i + '" aria-label="Hapus"><i class="bi bi-trash"></i></button>' +
          '</div></td></tr>';
      }).join('')) + '</tbody></table></div></div>';

    wrap.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openAsset(rows[Number(b.getAttribute('data-edit'))], function () { loadAssets(view, ctx); }); });
    });
    wrap.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Yakin ingin menghapus item ini?')) return;
        const a = rows[Number(b.getAttribute('data-del'))];
        const res = await UI.run(function () { return Api.call('aset.delete', { ID_Item: a.ID_Item }); });
        if (res) { UI.success(res.message || 'Item berhasil dihapus.'); loadAssets(view, ctx); }
      });
    });
  }

  function openAsset(a, done) {
    a = a || {};
    const m = UI.modal({
      title: a.ID_Item ? 'Edit Item' : 'Tambah Item',
      body: '<form id="assetForm" novalidate><div class="form-grid">' +
        '<div class="field"><label class="form-label" for="assetNama">Nama Item</label><input class="input" id="assetNama" value="' + UI.esc(a.Nama_Item) + '" required></div>' +
        '<div class="two-cols">' +
          '<div class="field"><label class="form-label" for="assetJenis">Jenis</label><select class="select" id="assetJenis">' + opts(['Ruangan', 'Peralatan'], a.Jenis) + '</select></div>' +
          '<div class="field"><label class="form-label" for="assetKategori">Kategori</label><input class="input" id="assetKategori" value="' + UI.esc(a.Kategori) + '" placeholder="Multimedia, Audio, dll"></div>' +
        '</div>' +
        '<div class="two-cols">' +
          '<div class="field"><label class="form-label" for="assetKapasitas">Kapasitas / Stok</label><input class="input" id="assetKapasitas" value="' + UI.esc(a.Kapasitas_Stok) + '" placeholder="mis. 2 Unit / 300 Orang"></div>' +
          '<div class="field"><label class="form-label" for="assetStatus">Status</label><select class="select" id="assetStatus">' + opts(['Tersedia', 'Dalam Perbaikan', 'Nonaktif'], a.Status) + '</select></div>' +
        '</div></div></form>',
      footer: '<button type="button" class="btn btn-secondary" data-close>Batal</button>' +
        '<button type="button" class="btn" id="saveAssetBtn"><i class="bi bi-check-lg"></i> Simpan</button>'
    });
    const $ = function (id) { return m.el.querySelector('#' + id); };
    $('saveAssetBtn').addEventListener('click', async function () {
      const asset = {
        ID_Item: a.ID_Item || '',
        Nama_Item: $('assetNama').value.trim(),
        Jenis: $('assetJenis').value,
        Kategori: $('assetKategori').value.trim(),
        Kapasitas_Stok: $('assetKapasitas').value.trim(),
        Status: $('assetStatus').value
      };
      if (!asset.Nama_Item) { UI.warning('Nama item wajib diisi.'); return; }
      const res = await UI.run(function () { return Api.call('aset.save', asset); });
      if (res) { m.close(); UI.success(res.message || 'Data item berhasil disimpan.'); done(); }
    });
  }

  // ---------- Pengguna ----------
  async function loadUsers(view, ctx) {
    const wrap = view.querySelector('#masterDataTableWrap');
    const rows = UI.arr(await Api.call('pengguna.list'));
    if (!ctx.isCurrent()) return;
    wrap.innerHTML = '<div class="panel-card pad-0"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      (rows.length === 0 ? '<tr><td colspan="5" class="center muted">Belum ada data.</td></tr>' : rows.map(function (u, i) {
        return '<tr><td>' + UI.esc(u.Nama) + '</td><td>' + UI.esc(u.Email) + '</td><td>' + UI.roleBadge(u.Role) + '</td><td>' + UI.chip(u.Status) + '</td>' +
          '<td><button type="button" class="btn btn-outline btn-sm" data-edit="' + i + '" aria-label="Ubah"><i class="bi bi-pencil"></i></button></td></tr>';
      }).join('')) + '</tbody></table></div></div>';

    wrap.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openUser(rows[Number(b.getAttribute('data-edit'))], function () { loadUsers(view, ctx); }); });
    });
  }

  function openUser(u, done) {
    u = u || {};
    const m = UI.modal({
      title: u.ID_User ? 'Edit Pengguna' : 'Tambah Pengguna',
      body: '<form id="userForm" novalidate><div class="form-grid">' +
        '<div class="field"><label class="form-label" for="userNamaField">Nama Lengkap</label><input class="input" id="userNamaField" value="' + UI.esc(u.Nama) + '" required></div>' +
        '<div class="field"><label class="form-label" for="userEmailField">Email</label><input class="input" type="email" id="userEmailField" value="' + UI.esc(u.Email) + '" required></div>' +
        '<div class="two-cols">' +
          '<div class="field"><label class="form-label" for="userRoleField">Role</label><select class="select" id="userRoleField">' + opts(ROLES, u.Role || 'Guru') + '</select></div>' +
          '<div class="field"><label class="form-label" for="userStatusField">Status</label><select class="select" id="userStatusField">' + opts(['Aktif', 'Nonaktif'], u.Status || 'Aktif') + '</select></div>' +
        '</div>' +
        '<div class="field"><label class="form-label" for="userPasswordField">Password <span class="muted small">(kosongkan jika tidak diubah)</span></label>' +
          '<input class="input" type="password" id="userPasswordField" autocomplete="new-password"></div>' +
      '</div></form>',
      footer: '<button type="button" class="btn btn-secondary" data-close>Batal</button>' +
        '<button type="button" class="btn" id="saveUserBtn"><i class="bi bi-check-lg"></i> Simpan</button>'
    });
    const $ = function (id) { return m.el.querySelector('#' + id); };
    $('saveUserBtn').addEventListener('click', async function () {
      const user = {
        ID_User: u.ID_User || '',
        Nama: $('userNamaField').value.trim(),
        Email: $('userEmailField').value.trim(),
        Role: $('userRoleField').value,
        Status: $('userStatusField').value,
        Password: $('userPasswordField').value
      };
      if (!user.Nama || !user.Email) { UI.warning('Nama dan email wajib diisi.'); return; }
      const res = await UI.run(function () { return Api.call('pengguna.save', user); });
      if (res) { m.close(); UI.success(res.message || 'Data pengguna berhasil disimpan.'); done(); }
    });
  }

  App.pages.masterdata = {
    title: 'Kelola Data Master',
    auth: true,
    roles: ['Admin'],
    async render(view, ctx) {
      view.innerHTML =
        '<div class="section-head"><div><h2>Kelola Data Master</h2><p class="muted">Manajemen Ruang &amp; Peralatan Sekolah, serta Pengguna.</p></div>' +
          '<button class="btn" id="btnAdd" type="button"><i class="bi bi-plus-lg"></i> Tambah</button></div>' +
        '<div class="tab-pills">' +
          '<button type="button" class="tab-pill' + (st.tab === 'aset' ? ' active' : '') + '" data-tab="aset">Ruang &amp; Peralatan</button>' +
          '<button type="button" class="tab-pill' + (st.tab === 'user' ? ' active' : '') + '" data-tab="user">Pengguna</button>' +
        '</div>' +
        '<div id="masterDataTableWrap">' + UI.spinnerBlock() + '</div>';

      view.querySelectorAll('[data-tab]').forEach(function (b) {
        b.addEventListener('click', function () { st.tab = b.getAttribute('data-tab'); App.pages.masterdata.render(view, ctx); });
      });
      view.querySelector('#btnAdd').addEventListener('click', function () {
        if (st.tab === 'aset') openAsset(null, function () { loadAssets(view, ctx); });
        else openUser(null, function () { loadUsers(view, ctx); });
      });

      if (st.tab === 'aset') await loadAssets(view, ctx); else await loadUsers(view, ctx);
    }
  };
})();
