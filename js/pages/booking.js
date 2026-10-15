// pages/booking.js — form pengajuan peminjaman dengan cek bentrok jadwal langsung
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.booking = {
  title: 'Form Pengajuan',
  auth: true,
  roles: ['Admin', 'Guru', 'OSIS'],
  async render(view, ctx) {
    const assets = await App.loadAssets();
    if (!ctx.isCurrent()) return;

    const u = App.state.user || {};
    const options = assets.filter(function (a) { return a.Status === 'Tersedia'; }).map(function (a) {
      return '<option value="' + UI.esc(a.ID_Item) + '">' + UI.esc(a.Nama_Item) + ' (' + UI.esc(a.Kategori || a.Jenis) + ')</option>';
    }).join('');

    view.innerHTML =
      '<div class="section-head"><div><h2>Form Pengajuan Peminjaman</h2>' +
        '<p class="muted">Lengkapi formulir di bawah ini untuk mengajukan peminjaman fasilitas sekolah.</p></div></div>' +
      '<div class="panel-card booking-card"><h6 class="mb-3"><i class="bi bi-person"></i> Data Peminjam</h6>' +
        '<div class="form-grid cols-2">' +
          '<div class="field"><label class="form-label" for="bkNama">Nama Lengkap</label><input class="input" id="bkNama" value="' + UI.esc(u.nama) + '" disabled></div>' +
          '<div class="field"><label class="form-label" for="bkRole">Peran</label><input class="input" id="bkRole" value="' + UI.esc(u.role) + '" disabled></div>' +
          '<div class="field"><label class="form-label" for="bkUnit">Unit / Kelas / Kegiatan</label><input class="input" id="bkUnit" placeholder="mis. Guru Fisika - XI MIPA" required></div>' +
          '<div class="field"><label class="form-label" for="bkKontak">Kontak (WhatsApp)</label><input class="input" id="bkKontak" placeholder="08xxxxxxxxxx"></div>' +
        '</div></div>' +
      '<div class="panel-card booking-card"><h6 class="mb-3"><i class="bi bi-file-earmark-text"></i> Detail Peminjaman</h6>' +
        '<div class="form-grid cols-3">' +
          '<div class="field span-all"><label class="form-label" for="bkItem">Pilih Ruang/Alat</label>' +
            '<select class="select" id="bkItem"><option value="">Pilih fasilitas...</option>' + options + '</select></div>' +
          '<div class="field"><label class="form-label" for="bkTanggal">Tanggal</label><input class="input" type="date" id="bkTanggal" required></div>' +
          '<div class="field"><label class="form-label" for="bkMulai">Waktu Mulai</label><input class="input" type="time" id="bkMulai" required></div>' +
          '<div class="field"><label class="form-label" for="bkSelesai">Waktu Selesai</label><input class="input" type="time" id="bkSelesai" required></div>' +
        '</div>' +
        '<div id="conflictWarning" aria-live="polite"></div>' +
        '<div class="field mt-3"><label class="form-label" for="bkTujuan">Tujuan Penggunaan</label>' +
          '<textarea class="textarea" id="bkTujuan" rows="3" placeholder="Jelaskan secara singkat untuk kegiatan apa fasilitas ini digunakan..."></textarea></div>' +
      '</div>' +
      '<div class="row end booking-actions">' +
        '<a class="btn btn-secondary" href="#/dashboard">Batal</a>' +
        '<button class="btn" id="submitBookingBtn" type="button"><i class="bi bi-send"></i> Submit Pengajuan</button>' +
      '</div>';

    const $ = function (id) { return view.querySelector('#' + id); };
    const warn = function (title, text) {
      $('conflictWarning').innerHTML = '<div class="conflict-warning"><i class="bi bi-exclamation-triangle"></i><div><strong>' +
        UI.esc(title) + '</strong><p>' + UI.esc(text) + '</p></div></div>';
    };

    // ---- cek bentrok langsung (ditunda 300 ms; jawaban usang diabaikan) ----
    let seq = 0;
    const remoteCheck = UI.debounce(async function (mySeq, q) {
      try {
        const r = UI.obj(await Api.call('peminjaman.cekBentrok', q));
        if (mySeq !== seq || !ctx.isCurrent()) return;
        if (r.bentrok) warn('Jadwal Bentrok', 'Fasilitas ini sudah dipesan pada waktu tersebut oleh "' + r.peminjam + '". Silakan pilih waktu lain atau hubungi administrator.');
      } catch (e) { /* diamkan: cek bentrok bersifat non-kritis; server tetap memeriksa saat submit */ }
    }, 300);

    const onChange = function () {
      const mySeq = ++seq;
      $('conflictWarning').innerHTML = '';
      const q = { idItem: $('bkItem').value, tanggal: $('bkTanggal').value, jamMulai: $('bkMulai').value, jamSelesai: $('bkSelesai').value };
      if (!q.idItem || !q.tanggal || !q.jamMulai || !q.jamSelesai) return;
      if (q.jamMulai >= q.jamSelesai) { warn('Waktu Tidak Valid', 'Waktu selesai harus setelah waktu mulai.'); return; }
      remoteCheck(mySeq, q);
    };
    ['bkItem', 'bkTanggal', 'bkMulai', 'bkSelesai'].forEach(function (id) { $(id).addEventListener('change', onChange); });

    // ---- kirim ----
    $('submitBookingBtn').addEventListener('click', async function () {
      const record = {
        Unit_Kelas: $('bkUnit').value.trim(),
        Kontak: $('bkKontak').value.trim(),
        ID_Item: $('bkItem').value,
        Tanggal: $('bkTanggal').value,
        Jam_Mulai: $('bkMulai').value,
        Jam_Selesai: $('bkSelesai').value,
        Tujuan_Penggunaan: $('bkTujuan').value.trim()
      };
      if (!record.ID_Item || !record.Tanggal || !record.Jam_Mulai || !record.Jam_Selesai || !record.Unit_Kelas) {
        UI.warning('Lengkapi semua field wajib.'); return;
      }
      const btn = $('submitBookingBtn');
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-inline"></span> Mengirim...';
      btn.disabled = true;
      try {
        const res = UI.obj(await Api.call('peminjaman.submit', record));
        UI.success(res.message || 'Pengajuan berhasil dikirim.');
        Router.go('history');
      } catch (err) {
        UI.error(err.message);
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  }
};
