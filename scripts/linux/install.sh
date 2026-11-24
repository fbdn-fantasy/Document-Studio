#!/usr/bin/env bash
# Install into a private release directory, then switch its stable application links.
set -euo pipefail
prefix=${1:-/usr/local}
if [[ $# -gt 1 || "$prefix" != /* || "$prefix" == / ]]; then
  echo "Usage: ./install.sh [/absolute/install/prefix]" >&2
  exit 2
fi
here=$(cd -- "$(dirname -- "$0")" && pwd)
(cd "$here" && sha256sum -c SHA256SUMS)
base="$prefix/lib/document-studio"
mkdir -p "$base/releases"
if [[ -e "$base/current" && ! -L "$base/current" ]]; then
  echo "The installation directory already contains an unrelated file." >&2
  exit 1
fi
release=$(mktemp -d -- "$base/releases/build-XXXXXXXX")
switch=$(mktemp -d -- "$base/.select-XXXXXXXX")
trap 'rm -rf -- "$switch"; if [[ ! -e "$release/.installed" ]]; then rm -rf -- "$release"; fi' EXIT
chmod 755 "$release"
tar --extract --gzip --file="$here/payload.tar.gz" --directory="$release" --no-same-owner --no-same-permissions
printf 'tar\n' > "$release/usr/lib/Document Studio/update-format"
# Preserve an existing file installed by another package in the same prefix.
files=(bin/document-studio share/applications/document-studio.desktop)
for file in "$release"/usr/share/icons/hicolor/*/apps/document-studio.png; do
  files+=("${file#"$release/usr/"}")
done
for file in "${files[@]}"; do
  target="$base/current/usr/$file"
  link="$prefix/$file"
  if [[ -e "$link" || -L "$link" ]]; then
    [[ -L "$link" && "$(readlink -- "$link")" == "$target" ]] || {
      echo "An existing installation owns $link. Choose a different prefix." >&2
      exit 1
    }
  fi
done
for file in "${files[@]}"; do
  mkdir -p -- "$(dirname -- "$prefix/$file")"
  if [[ ! -L "$prefix/$file" ]]; then ln -s -- "$base/current/usr/$file" "$prefix/$file"; fi
done
ln -s -- "releases/$(basename -- "$release")" "$switch/current"
touch "$release/.installed"
mv -Tf -- "$switch/current" "$base/current"
echo "Installed Document Studio at $prefix/bin/document-studio"
