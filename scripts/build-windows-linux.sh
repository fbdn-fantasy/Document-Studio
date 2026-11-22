#!/usr/bin/env bash
set -euo pipefail
# Cross-compile the normal NSIS installer from Linux using Tauri's documented
# cargo-xwin approach. This is build tooling; users install only the setup EXE.
cd "$(dirname "$0")/.."
for tool in cargo rustup clang-cl lld-link llvm-rc makensis node npm; do
  command -v "$tool" >/dev/null || { echo "Missing build prerequisite: $tool" >&2; exit 1; }
done
# cargo-xwin requires an absolute SDK cache path without spaces.
export XWIN_CACHE_DIR="${XWIN_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/cargo-xwin}"
case "$XWIN_CACHE_DIR" in *" "*) echo "XWIN_CACHE_DIR must not contain spaces" >&2; exit 1;; esac
rustup target add x86_64-pc-windows-msvc
command -v cargo-xwin >/dev/null || cargo install cargo-xwin --locked
npm ci
python3 scripts/build-windows.py --cross
