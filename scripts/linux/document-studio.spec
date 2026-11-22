# The app runtime-manifest records hashes of the private OCR / import runtime.
# Rewriting prebuilt runtime libraries or scripts would invalidate those hashes.
%global __os_install_post %{nil}
%global source_date_epoch_from_changelog 0
%global debug_package %{nil}
%global _build_id_links none
%global _binary_payload w5T2.zstdio
Name: document-studio
Version: %{app_version}
Release: 1
Summary: Offline document editor and OCR studio
License: Apache-2.0
BuildArch: x86_64
AutoReqProv: no
Requires: glibc >= %{glibc_min}
Requires: webkit2gtk4.1, gtk3, openssl-libs, fontconfig
Requires: glib2, libglvnd-glx, libstdc++, libgcc, libgomp, zlib-ng-compat, libX11, libXext, libxcb, dbus-libs
%description
Create and format documents, import files and recognize scanned pages with
bundled offline OCR models and a private document-processing runtime.
%install
mkdir -p "%{buildroot}"
cp -a --reflink=auto "$DOCUMENT_STUDIO_PACKAGE_ROOT"/. "%{buildroot}/"
%files
%defattr(-,root,root,-)
/usr/bin/document-studio
"/usr/lib/Document Studio"
/usr/share/doc/document-studio
/usr/share/applications/document-studio.desktop
/usr/share/icons/hicolor/*/apps/document-studio.png
