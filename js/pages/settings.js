// pages/settings.js — identitas aplikasi (hanya Admin)
window.App = window.App || {};
App.pages = App.pages || {};

App.pages.settings = {
  title: 'Pengaturan',
  auth: true,
  roles: ['Admin'],
  async render(view, ctx) {
    const cfg = UI.obj(await Api.call('config.get'));
    if (!ctx.isCurrent()) return;

    view.innerHTML =
      '<div class="section-head"><div><h2>Pengaturan</h2><p class="muted">Identitas aplikasi dan konfigurasi umum SIPMEDIA.</p></div></div>' +
      '<div class="panel-card settings-card">' +
        '<div class="field"><label class="form-label" for="cfgAppName">Nama Aplikasi</label><input class="input" id="cfgAppName" value="' + UI.esc(cfg.appName) + '"></div>' +
        '<div class="field"><label class="form-label" for="cfgTagline">Tagline</label><input class="input" id="cfgTagline" value="' + UI.esc(cfg.tagline) + '"></div>' +
        '<div class="field"><label class="form-label" for="cfgLogo">Logo URL</label><input class="input" id="cfgLogo" value="' + UI.esc(cfg.logoUrl) + '" placeholder="https://..."></div>' +
        '<button class="btn" id="btnSaveCfg" type="button"><i class="bi bi-check-lg"></i> Simpan Pengaturan</button>' +
      '</div>';

    view.querySelector('#btnSaveCfg').addEventListener('click', async function () {
      const pairs = [
        ['appName', view.querySelector('#cfgAppName').value],
        ['tagline', view.querySelector('#cfgTagline').value],
        ['logoUrl', view.querySelector('#cfgLogo').value]
      ];
      // Berurutan (bukan serentak) agar penulisan ke sheet tidak saling tabrak
      const ok = await UI.run(async function () {
        for (let i = 0; i < pairs.length; i++) await Api.call('config.set', { key: pairs[i][0], value: pairs[i][1] });
        return true;
      });
      if (ok) UI.success('Pengaturan disimpan.');
    });
  }
};
