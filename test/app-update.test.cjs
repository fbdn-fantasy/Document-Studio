'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {ManualUpdater, selectRelease, downloadAsset, installedTarget, getRelease} = require('../app-update.cjs');

const bytes = Buffer.from('release installer fixture');
const digest = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const formats = {
  windows: 'Document-Studio-V1.10.0-Setup.exe',
  deb: 'Document-Studio-V1.10.0.deb',
  rpm: 'document-studio-1.10.0-1.x86_64.rpm',
  tar: 'Document-Studio-V1.10.0.tar.gz'
};
const release = {tag_name: 'V1.10.0', draft: false, prerelease: false,
  assets: Object.values(formats).map(name => ({name, size: bytes.length, digest, state: 'uploaded'}))};
const selected = selectRelease(release, '1.9.0', 'windows');

async function temporary(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-studio-update-test-'));
  t.after(() => fs.rm(dir, {recursive: true, force: true}));
  return dir;
}

test('selects the exact versioned installer for each installed format', () => {
  for (const [format, name] of Object.entries(formats)) {
    const result = selectRelease(release, '1.9.0', format);
    assert.equal(result.name, name);
    assert.equal(result.url, 'https://github.com/fbdn-fantasy/Document-Studio/releases/download/V1.10.0/' + name);
  }
  for (const tag of ['v1.10.0', '1.10.0']) assert.equal(selectRelease({...release, tag_name: tag}, '1.9.0', 'deb').version, '1.10.0');
  for (const tag of ['V24', 'v1.10.0-beta.1', '../V1.10.0', '1.9.0', '1.8.9']) assert.equal(selectRelease({...release, tag_name: tag}, '1.9.0', 'rpm'), null);
  for (const key of ['draft', 'prerelease']) assert.equal(selectRelease({...release, [key]: true}, '1.9.0', 'rpm'), null);
  const legacy = {tag_name: '24.0.0', assets: [{name:'Document-Studio-Setup-24.0.0-x64.exe'}, {name:'document-studio-24.0.0-1.x86_64.rpm'}]};
  assert.equal(selectRelease(legacy, '1.0.0', 'rpm'), null);
});

test('reports missing, incomplete, or unverifiable release assets', () => {
  for (const asset of [{name: 'Document-Studio-V1.10.0-Windows-Source.zip'}, {name: formats.windows, state: 'new'}]) {
    assert.throws(() => selectRelease({...release, assets: [asset]}, '1.0.0', 'windows'), /has not been published/);
  }
  for (const fields of [{size: 0}, {size: -1}, {digest: null}, {digest: 'sha256:123'}]) {
    const asset = {...release.assets[0], ...fields};
    assert.throws(() => selectRelease({...release, assets: [asset]}, '1.0.0', 'windows'), /SHA-256/);
  }
});

test('finds the newest stable new-scheme release while GitHub still designates V24 as latest', async () => {
  const legacy = {tag_name: 'V24'};
  const old = {tag_name: '24.0.0', assets: [{name: 'Document-Studio-Setup-24.0.0-x64.exe'}]};
  const releases = [legacy, old, {...release, tag_name: 'V2.0.0', draft: true}, {...release, tag_name: 'V3.0.0', prerelease: true}, {...release, tag_name: 'V1.2.0'}, release];
  const fetchRelease = listing => async url => {
    if (url.endsWith('/releases/latest')) return Response.json(legacy);
    assert.match(url, /\/releases\?per_page=100$/);
    return Response.json(listing);
  };
  assert.deepEqual(await getRelease(fetchRelease(releases)), release);
  assert.equal(selectRelease(await getRelease(fetchRelease([old, legacy])), '1.0.0', 'rpm'), null);
  let requests = 0;
  assert.deepEqual(await getRelease(async () => { requests++; return Response.json(release); }), release);
  assert.equal(requests, 1);
});

test('streams a CDN redirect into a private file and reports byte progress', async t => {
  const dir = await temporary(t);
  let calls = 0;
  const progress = [];
  const destination = 'https://release-assets.githubusercontent.com/github-production-release-asset/example';
  const file = await downloadAsset(selected, dir, async (url, options) => {
    assert.equal(options.redirect, 'manual');
    assert.equal(url, calls++ ? destination : selected.url);
    return calls === 1 ? Response.redirect(destination) : new Response(bytes);
  }, p => progress.push(p));
  assert.equal(calls, 2);
  assert.deepEqual(await fs.readFile(file), bytes);
  assert.deepEqual(progress.at(-1), {received: bytes.length, total: bytes.length});
  assert.deepEqual(await fs.readdir(dir), [selected.name]);
});

test('rejects insecure redirects, truncated downloads and hash mismatches without leaving installers', async t => {
  const dir = await temporary(t);
  for (const destination of ['https://example.com/file', 'http://release-assets.githubusercontent.com/file', 'https://bad@release-assets.githubusercontent.com/file']) {
    await assert.rejects(downloadAsset(selected, dir, async () => Response.redirect(destination), () => {}), /unexpected/);
  }
  for (const data of [bytes.subarray(1), Buffer.from(bytes).fill(0), Buffer.concat([bytes, bytes])]) {
    await assert.rejects(downloadAsset(selected, dir, async () => new Response(data), () => {}), /size/);
  }
  assert.deepEqual(await fs.readdir(dir), []);
});

test('identifies package ownership and preserves custom TAR installation prefixes', async t => {
  const prefix = await temporary(t);
  const canonicalPrefix = await fs.realpath(prefix);
  const usr = path.join(canonicalPrefix, 'lib/document-studio/releases/build-abc123/usr');
  const root = path.join(usr, 'lib/Document Studio/app-resources');
  const marker = path.join(usr, 'lib/Document Studio/update-format');
  await fs.mkdir(root, {recursive: true});
  await fs.mkdir(path.dirname(marker), {recursive: true});
  for (const format of ['rpm', 'deb', 'tar']) {
    await fs.writeFile(marker, format + '\n');
    assert.deepEqual(await installedTarget(root, 'linux', 'x64'), format === 'tar' ? {format, prefix: canonicalPrefix} : {format});
  }
  await fs.writeFile(marker, 'unknown');
  await assert.rejects(installedTarget(root, 'linux', 'x64'), /could not be identified/);
  await assert.rejects(installedTarget(root, 'linux', 'arm64'), /processor/);
});

test('manual check, confirmation boundary, verified download, and handoff', {skip: process.platform !== 'win32'}, async t => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, 'runtime-manifest.json'), JSON.stringify({version: '1.0.0'}));
  let checks = 0, downloads = 0, opened = 0;
  let pending;
  const gate = new Promise(resolve => { pending = resolve; });
  const updater = new ManualUpdater({resourceRoot: root, dataDirectory: root, onProgress() {},
    request: async url => {
      if (url.endsWith('/releases/latest')) { checks++; return Response.json(release); }
      downloads++;
      await gate;
      return new Response(bytes);
    },
    openWindowsInstaller: async file => { opened++; assert.equal(path.basename(file), formats.windows); assert.deepEqual(await fs.readFile(file), bytes); }
  });
  assert.equal(checks, 0);
  await assert.rejects(updater.download(), /Check for/);
  await assert.rejects(updater.install(), /Download and verify/);
  assert.deepEqual(await updater.check(), {available: true, version: '1.10.0', currentVersion: '1.0.0', size: bytes.length});
  assert.equal(downloads, 0);
  const downloading = updater.download();
  await assert.rejects(updater.install(), /in progress/);
  pending();
  await downloading;
  assert.equal(opened, 0);
  await updater.check();
  await updater.download();
  assert.equal(downloads, 1);
  await updater.install();
  assert.equal(opened, 1);
  await assert.rejects(updater.install(), /Download and verify/);
});
