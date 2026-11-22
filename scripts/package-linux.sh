#!/usr/bin/env bash
# Run after stage.py linux and a release Tauri build. All formats share one payload.
set -euo pipefail
root=$(cd -- "$(dirname -- "$0")/.." && pwd)
version=$(node -p "require(process.argv[1]).version" "$root/package.json")
out=$(realpath -m -- "${1:-$root/release/Linux}")
binary=${DOCUMENT_STUDIO_BINARY:-${CARGO_TARGET_DIR:-$root/src-tauri/target}/release/document-studio}
resources="$root/app-resources-linux"
[[ -f "$resources/runtime-manifest.json" && -x "$binary" && -x "$resources/runtime/bin/python3" && -x "$resources/node/bin/node" ]]
cmp "$root/LICENSE" "$resources/LICENSE"
mkdir -p "$out"/{RPM,DEB,TAR}
work=$(mktemp -d -- "${DOCUMENT_STUDIO_BUILD_TMP:-$out}/.package-XXXXXXXX")
# rpmbuild's internal shell commands require an absolute topdir without spaces.
short=$(mktemp -d /tmp/document-studio-rpm-XXXXXXXX)
trap 'rm -rf -- "$short" "$work"' EXIT
mkdir "$work/rpmbuild"
ln -s "$work/rpmbuild" "$short/rpm"
export DOCUMENT_STUDIO_PACKAGE_ROOT="$work/tree"
tree="$DOCUMENT_STUDIO_PACKAGE_ROOT/usr"
install -Dm755 "$binary" "$tree/bin/document-studio"
strip --strip-debug "$tree/bin/document-studio"
mkdir -p "$tree/lib/Document Studio"
cp -a --reflink=auto "$resources" "$tree/lib/Document Studio/app-resources"
install -Dm644 "$root/LICENSE" "$tree/share/doc/document-studio/copyright"
install -Dm644 "$root/scripts/linux/document-studio.desktop" "$tree/share/applications/document-studio.desktop"
for size in 32 48 64 128 256 512; do
  install -Dm644 "$root/assets/icons/${size}x${size}.png" "$tree/share/icons/hicolor/${size}x${size}/apps/document-studio.png"
done
chmod -R u+rwX,go+rX,go-w "$tree"
# A GCC/glibc built binary can require a newer glibc than the runtime's glibc.
glibc_min=$(readelf --version-info "$tree/bin/document-studio" | sed -nE 's/.*Name: GLIBC_([0-9.]+) .*/\1/p' | sort -V | tail -1)
[[ -n "$glibc_min" ]]
rpmbuild -bb \
  --define "_tmppath $short" --define "_topdir $short/rpm" --define "_buildhost localhost" \
  --define "app_version $version" --define "glibc_min $glibc_min" \
  "$root/scripts/linux/document-studio.spec"
rpm_file="document-studio-$version-1.x86_64.rpm"
mv "$work/rpmbuild/RPMS/x86_64/$rpm_file" "$out/RPM/$rpm_file"
mkdir -p "$work/deb/control" "$work/installer/Document-Studio-$version"
installed_kib=$(du -sk --apparent-size "$tree" | cut -f1)
cat > "$work/deb/control/control" <<CONTROL
Package: document-studio
Version: $version-1
Section: editors
Priority: optional
Architecture: amd64
Installed-Size: $installed_kib
Maintainer: Document Studio <maintainer@document-studio.invalid>
Depends: libc6 (>= $glibc_min), libgtk-3-0t64 | libgtk-3-0, libwebkit2gtk-4.1-0, libssl3t64 | libssl3, libdbus-1-3, fontconfig, libgl1, libglib2.0-0t64 | libglib2.0-0, libstdc++6, libgcc-s1, libgomp1, zlib1g, libx11-6, libxext6, libxcb1
Description: Offline document editor and OCR studio
 Create and format documents, import files and recognize scanned pages with
 bundled offline OCR models and a private document-processing runtime.
CONTROL
gzip_cmd=(gzip -n -3)
if command -v pigz >/dev/null; then gzip_cmd=(pigz -p 2 -n -3); fi
pack() {
  tar --format=gnu --sort=name --mtime=@0 --owner=0 --group=0 --numeric-owner -C "$1" -cf - "${@:2}" | "${gzip_cmd[@]}"
}
printf '2.0\n' > "$work/deb/debian-binary"
pack "$work/deb/control" . > "$work/deb/control.tar.gz"
pack "$work/tree" ./usr > "$work/deb/data.tar.gz"
(
  cd "$work/deb"
  ar crD "$work/document-studio.deb" debian-binary control.tar.gz data.tar.gz
)
mv "$work/document-studio.deb" "$out/DEB/document-studio_${version}-1_amd64.deb"
install_dir="$work/installer/Document-Studio-$version"
mv "$work/deb/data.tar.gz" "$install_dir/payload.tar.gz"
(cd "$install_dir" && sha256sum payload.tar.gz > SHA256SUMS)
install -m755 "$root/scripts/linux/install.sh" "$install_dir/"
install -m644 "$root/LICENSE" "$install_dir/LICENSE"
sed "s/@MIN_GLIBC@/$glibc_min/" "$root/scripts/linux/INSTALL.txt" > "$install_dir/INSTALL.txt"
pack "$work/installer" "Document-Studio-$version" > "$work/document-studio.tar.gz"
mv "$work/document-studio.tar.gz" "$out/TAR/document-studio-$version-linux-x86_64.tar.gz"
