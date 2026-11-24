'use strict';

const fs = require('node:fs/promises');
const {createWriteStream} = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {Transform} = require('node:stream');
const {pipeline} = require('node:stream/promises');
const {spawn} = require('node:child_process');

const repository = 'fbdn-fantasy/Document-Studio';
const latestRelease = 'https://api.github.com/repos/' + repository + '/releases/latest';
const userAgent = 'Document-Studio-Manual-Updater';
const cdnHosts = new Set(['release-assets.githubusercontent.com', 'objects.githubusercontent.com', 'github-releases.githubusercontent.com']);
const stableVersion = /^[vV]?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/;

function compareVersions(left, right) {
  const a = left.split('.').map(BigInt), b = right.split('.').map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

function assetName(version, format) {
  switch (format) {
    case 'windows': return 'Document-Studio-V' + version + '-Setup.exe';
    case 'deb': return 'Document-Studio-V' + version + '.deb';
    case 'rpm': return 'document-studio-' + version + '-1.x86_64.rpm';
    case 'tar': return 'Document-Studio-V' + version + '.tar.gz';
    default: throw Error('This installation has no compatible update package.');
  }
}

function legacyRelease(release) {
  if (/^[vV]?\d+$/.test(release.tag_name)) return true;
  const version = stableVersion.exec(release.tag_name)?.[1];
  const assets = Array.isArray(release.assets) ? release.assets : [];
  return !!version && assets.some(a => a.name === 'Document-Studio-Setup-' + version + '-x64.exe') &&
    !assets.some(a => a.name === assetName(version, 'windows'));
}

function selectRelease(release, current, format) {
  const installed = stableVersion.exec(current)?.[1];
  if (!installed) throw Error('The installed version could not be read.');
  const version = stableVersion.exec(release.tag_name)?.[1];
  if (!version || release.draft || release.prerelease || compareVersions(version, installed) <= 0) return null;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  if (legacyRelease(release)) return null;
  const name = assetName(version, format);
  const asset = assets.find(a => a.name === name && a.state === 'uploaded');
  if (!asset) throw Error('V' + version + ' is available, but its ' + format.toUpperCase() + ' installer has not been published.');
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0 || !/^sha256:[0-9a-f]{64}$/.test(asset.digest)) {
    throw Error('GitHub has not provided a valid size and SHA-256 digest for this installer. Try again after the release is complete.');
  }
  return {version, name, size: asset.size, digest: asset.digest, url: 'https://github.com/' + repository + '/releases/download/' + release.tag_name + '/' + name};
}

async function githubJson(url, request) {
  let response;
  try {
    response = await request(url, {
      headers: {'User-Agent': userAgent, Accept: 'application/vnd.github+json'},
      redirect: 'error', signal: AbortSignal.timeout(30000)
    });
  } catch { throw Error('Could not reach GitHub. Check your connection and try again.'); }
  if (response.status === 403 || response.status === 429) throw Error('GitHub is limiting update checks. Please try again later.');
  if (response.status === 404) throw Error('GitHub could not find a published public release of Document Studio.');
  if (!response.ok) throw Error('GitHub could not complete the update check (HTTP ' + response.status + ').');
  return response.json();
}

async function getRelease(request) {
  const latest = await githubJson(latestRelease, request);
  if (!legacyRelease(latest)) return latest;
  // After the numbering reset GitHub can keep a legacy release designated
  // "Latest". Look through one page of recent releases for the new series.
  const releases = await githubJson('https://api.github.com/repos/' + repository + '/releases?per_page=100', request);
  if (!Array.isArray(releases)) throw Error('GitHub returned an invalid release list.');
  let candidate, best;
  for (const release of releases) {
    const version = stableVersion.exec(release.tag_name)?.[1];
    if (version && !release.draft && !release.prerelease && !legacyRelease(release) &&
        (!best || compareVersions(version, best) > 0)) {
      candidate = release;
      best = version;
    }
  }
  return candidate || latest;
}

async function assetResponse(url, request, signal) {
  for (let i = 0; i < 5; i++) {
    const response = await request(url, {redirect: 'manual', signal, headers: {'User-Agent': userAgent}});
    if (response.status === 200 && response.body) return response;
    await response.body?.cancel();
    if (![301, 302, 303, 307, 308].includes(response.status)) throw Error('The installer download failed (HTTP ' + response.status + ').');
    const redirect = new URL(response.headers.get('location') || '', url);
    if (redirect.protocol !== 'https:' || redirect.port || redirect.username || redirect.password || !cdnHosts.has(redirect.hostname)) {
      throw Error('GitHub returned an unexpected installer download location.');
    }
    url = redirect.href;
  }
  throw Error('GitHub returned too many download redirects.');
}

async function downloadAsset(asset, folder, request, onProgress) {
  const partial = path.join(folder, 'download.part'), file = path.join(folder, asset.name);
  const hash = createHash('sha256'), controller = new AbortController();
  let received = 0, lastReport = 0;
  const idle = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await assetResponse(asset.url, request, controller.signal);
    const measure = new Transform({transform(chunk, encoding, next) {
      idle.refresh();
      received += chunk.length;
      if (received > asset.size) return next(Error('The installer exceeds its published size.'));
      hash.update(chunk);
      if (Date.now() - lastReport >= 300 || received === asset.size) {
        lastReport = Date.now();
        onProgress({received, total: asset.size});
      }
      next(null, chunk);
    }});
    await pipeline(response.body, measure, createWriteStream(partial, {flags: 'wx', mode: 0o600}), {signal: controller.signal});
    if (received !== asset.size || 'sha256:' + hash.digest('hex') !== asset.digest) {
      throw Error('The installer did not match its published size or SHA-256 digest. Download the update again.');
    }
    await fs.rename(partial, file);
    return file;
  } catch (error) {
    if (controller.signal.aborted) throw Error('The installer download timed out. Check your connection and try again.');
    if (error.code === 'ENOSPC') throw Error('There is not enough disk space for this update.');
    if (error instanceof TypeError || error.code === 'UND_ERR_SOCKET') throw Error('The installer download was interrupted. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(idle);
    controller.abort();
    await fs.rm(partial, {force: true}).catch(() => {});
  }
}

async function installedTarget(resourceRoot, platform = process.platform, arch = process.arch) {
  if (arch !== 'x64') throw Error('This application has no update package for this processor.');
  if (platform === 'win32') return {format: 'windows'};
  if (platform !== 'linux') throw Error('This operating system has no supported update installer.');
  const application = path.dirname(await fs.realpath(resourceRoot));
  const usr = path.resolve(application, '../..');
  const marker = path.join(application, 'update-format');
  const format = await fs.readFile(marker, 'utf8').then(value => value.trim()).catch(() => '');
  if (format === 'deb' || format === 'rpm') return {format};
  if (format === 'tar') {
    const releases = path.dirname(path.dirname(usr));
    if (path.basename(releases) === 'releases' && path.basename(path.dirname(releases)) === 'document-studio') {
      return {format, prefix: path.resolve(releases, '../../..')};
    }
  }
  throw Error('The Linux installation format could not be identified. Install the matching package from Document Studio Releases.');
}

function runProgram(program, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {stdio: 'ignore'});
    child.once('error', () => reject(Error('Could not start ' + path.basename(program) + '. Check that it is installed.')));
    child.once('exit', code => {
      if (code === 0) resolve();
      else if (path.basename(program) === 'pkexec' && code === 126) reject(Error('Update authorization was canceled.'));
      else reject(Error('The system installer could not complete the update. Check available disk space, package dependencies, and authorization, then try again.'));
    });
  });
}

async function installPackage(target, file, version, openWindowsInstaller) {
  if (target.format === 'windows') return openWindowsInstaller(file);
  const elevated = (command, args) => runProgram('/usr/bin/pkexec', [command, ...args]);
  if (target.format === 'deb') return elevated('/usr/bin/apt-get', ['-y', 'install', file]);
  if (target.format === 'rpm') return elevated('/usr/bin/dnf', ['-y', 'install', file]);
  const directory = path.dirname(file), root = 'Document-Studio-V' + version;
  const entries = ['install.sh', 'SHA256SUMS', 'payload.tar.gz'].map(name => root + '/' + name);
  await runProgram('/usr/bin/tar', ['-xzf', file, '-C', directory, '--no-same-owner', '--no-same-permissions', '--', ...entries]);
  const args = [path.join(directory, root, 'install.sh'), target.prefix];
  const canInstall = await fs.access(path.join(target.prefix, 'lib/document-studio/releases'), fs.constants.W_OK).then(() => true, () => false);
  return canInstall ? runProgram('/bin/bash', args) : elevated('/bin/bash', args);
}

class ManualUpdater {
  constructor({resourceRoot, dataDirectory, onProgress, openWindowsInstaller, request = fetch}) {
    this.root = resourceRoot;
    this.cache = path.join(dataDirectory, 'updates');
    this.onProgress = onProgress;
    this.openWindowsInstaller = openWindowsInstaller;
    this.request = request;
  }

  async exclusive(action) {
    if (this.busy) throw Error('Another update operation is in progress.');
    this.busy = true;
    try { return await action(); } finally { this.busy = false; }
  }

  // Only remove directories created by this updater. A Windows installer may
  // still be using its downloaded file immediately after launching the app.
  async cleanCache() {
    const entries = await fs.readdir(this.cache, {withFileTypes: true}).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^session-[a-zA-Z0-9]{6}$/.test(entry.name)) continue;
      const directory = path.join(this.cache, entry.name);
      if (directory === this.folder) continue;
      const stat = await fs.stat(directory);
      if (Date.now() - stat.mtimeMs > 86400000) await fs.rm(directory, {recursive: true, force: true});
    }
  }

  check() {
    return this.exclusive(async () => {
      const previous = this.asset;
      this.asset = null;
      const manifest = JSON.parse(await fs.readFile(path.join(this.root, 'runtime-manifest.json'), 'utf8'));
      this.target = await installedTarget(this.root);
      const release = await getRelease(this.request);
      const asset = selectRelease(release, manifest.version, this.target.format);
      if (this.folder && (!asset || previous?.digest !== asset.digest || previous.name !== asset.name)) {
        await fs.rm(this.folder, {recursive: true, force: true});
        this.file = this.folder = null;
      }
      await this.cleanCache().catch(() => {});
      this.asset = asset;
      return {available: !!asset, currentVersion: manifest.version, version: asset?.version || manifest.version, size: asset?.size};
    });
  }

  download() {
    return this.exclusive(async () => {
      if (!this.asset) throw Error('Check for an available update first.');
      if (this.file) return;
      await fs.mkdir(this.cache, {recursive: true, mode: 0o700});
      this.folder = await fs.mkdtemp(path.join(this.cache, 'session-'));
      try { this.file = await downloadAsset(this.asset, this.folder, this.request, this.onProgress); }
      catch (error) {
        await fs.rm(this.folder, {recursive: true, force: true}).catch(() => {});
        this.folder = null;
        throw error;
      }
    });
  }

  install() {
    return this.exclusive(async () => {
      if (!this.file || !this.asset) throw Error('Download and verify the update before installing.');
      await installPackage(this.target, this.file, this.asset.version, this.openWindowsInstaller);
      if (this.target.format !== 'windows') await fs.rm(this.folder, {recursive: true, force: true}).catch(() => {});
      this.file = this.asset = this.folder = null;
    });
  }
}

module.exports = {ManualUpdater, selectRelease, downloadAsset, installedTarget, getRelease};
