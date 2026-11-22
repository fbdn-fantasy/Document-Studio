"""Build the x64 desktop application and its full NSIS installer."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


root = Path(__file__).resolve().parent.parent
target = 'x86_64-pc-windows-msvc'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cross', action='store_true', help='Use cargo-xwin on Linux.')
args = parser.parse_args()

node = shutil.which('node')
if not node:
    raise SystemExit('Install Node.js before building.')
cli = [node, str(root / 'node_modules/@tauri-apps/cli/tauri.js')]
env = os.environ.copy()
env.setdefault('CARGO_PROFILE_RELEASE_DEBUG', '0')

# Rust panic locations can otherwise include the build account or checkout path.
personal_paths = [root, Path.home()]
if env.get('CARGO_HOME'):
    personal_paths.append(Path(env['CARGO_HOME']).resolve())
flags = []
for path in personal_paths:
    if args.cross:
        # cargo-xwin passes flags to Cargo with a space separator.
        while ' ' in str(path):
            path = path.parent
    if path != Path(path.anchor):
        flags.append('--remap-path-prefix=' + str(path) + '=/build')
flags.extend(['-C', 'link-arg=/PDBALTPATH:%_PDB%', '-C', 'strip=symbols'])
if args.cross:
    env['RUSTFLAGS'] = ' '.join([env.get('RUSTFLAGS', ''), *flags]).strip()
else:
    previous = env.get('CARGO_ENCODED_RUSTFLAGS', '')
    env['CARGO_ENCODED_RUSTFLAGS'] = '\x1f'.join(filter(None, [previous, *flags]))


def run(command):
    subprocess.run(command, cwd=root, env=env, check=True)

run([sys.executable, 'scripts/stage.py', 'windows'])
build = cli + ['build', '--no-bundle', '--target', target, '--config', 'src-tauri/tauri.windows.conf.json']
if args.cross:
    build.extend(['--runner', 'cargo-xwin'])
run(build)

# Generate the standard Tauri install, upgrade, WebView2 and uninstall logic.
# The final build embeds the large offline resource tree as one compressed ZIP.
run(cli + ['bundle', '--target', target, '--bundles', 'nsis', '--config',
           json.dumps({'bundle': {'resources': [], 'windows': {'nsis': {'compression': 'zlib'}}}})])
run([sys.executable, 'scripts/package-windows-large.py'])
