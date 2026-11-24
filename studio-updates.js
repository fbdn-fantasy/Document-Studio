'use strict';

window.DocumentStudioUpdates = function (api, guard, resumeDrafts) {
  if (!api.checkForUpdate) return () => false;
  const button = document.getElementById('desktop-update');
  const dialog = document.getElementById('update-dialog');
  const message = document.getElementById('update-message');
  const close = document.getElementById('update-close');
  const action = document.getElementById('update-action');
  const progress = document.getElementById('update-progress');
  let phase = 'idle';
  let version;

  function display(next, text, label) {
    phase = next;
    message.textContent = text;
    action.textContent = label || '';
    action.hidden = !label;
    close.disabled = next === 'installing';
    progress.hidden = next !== 'downloading';
  }

  function show() {
    if (!dialog.open) dialog.showModal();
  }

  function failed(title, error) {
    const reason = typeof error === 'string' ? error : error?.message;
    display('error', reason ? title + ' ' + reason : title, 'Check again');
  }

  async function check() {
    display('checking', 'Checking GitHub for the latest release…');
    try {
      const release = await api.checkForUpdate();
      version = release.version;
      if (!release.available) {
        display('current', 'Document Studio V' + release.currentVersion + ' is up to date.');
        return;
      }
      const size = release.size ? ' (' + Math.ceil(release.size / 1048576) + ' MiB)' : '';
      display('available', 'Document Studio V' + version + size + ' is available. You have V' + release.currentVersion + '.', 'Download update');
    } catch (error) {
      failed('Couldn’t check for updates.', error);
    }
  }

  async function download() {
    display('downloading', 'Downloading Document Studio V' + version + '…');
    progress.removeAttribute('value');
    const stop = api.onUpdateProgress(({received, total}) => {
      if (total > 0) {
        progress.max = total;
        progress.value = received;
      }
    });
    try {
      await api.downloadUpdate();
      display('ready', 'Document Studio V' + version + ' is ready to install. The editor will close for the update.', 'Install and close');
    } catch (error) {
      failed('Couldn’t download the update.', error);
    } finally {
      stop();
    }
  }

  async function install() {
    display('guarding', 'Preparing to install…');
    dialog.close();
    try {
      if (!await guard()) {
        display('ready', 'Installation canceled. The downloaded update is ready when you are.', 'Install and close');
        return;
      }
      display('installing', 'Installing Document Studio V' + version + '… Follow any prompts from the installer.');
      show();
      await api.installUpdate();
      await api.close();
    } catch (error) {
      failed('Couldn’t finish installing the update.', error);
      show();
    } finally {
      resumeDrafts();
    }
  }

  button.hidden = false;
  button.addEventListener('click', () => {
    if (phase === 'guarding') return;
    show();
    if (['idle', 'available', 'current', 'error'].includes(phase)) void check();
  });
  action.addEventListener('click', () => {
    if (phase === 'available') void download();
    else if (phase === 'ready') void install();
    else if (phase === 'error') void check();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    if (phase === 'installing') event.preventDefault();
  });
  return () => phase === 'installing' || phase === 'guarding';
};
