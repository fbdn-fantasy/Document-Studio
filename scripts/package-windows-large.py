"""Build a single NSIS EXE for the >2GiB offline OCR payload.

Run `tauri build --no-bundle --target x86_64-pc-windows-msvc ...` first,
then run `tauri bundle ...` once to generate the normal NSIS script. The latter
may fail at NSIS's 2GiB uncompressed data limit; this script preserves its normal
install/uninstall/UI logic and replaces the raw resource directives with one
embedded ZIP, extracted by a minimal copy of the bundled Windows Python.
"""
from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,sys,zipfile,zlib
root=Path(__file__).resolve().parent.parent
target_dir=Path(os.environ.get('CARGO_TARGET_DIR', root/'src-tauri/target')).resolve()
release=target_dir/'x86_64-pc-windows-msvc/release'
version=json.loads((root/'package.json').read_text())['version']
installer_name=f'Document-Studio-V{version}-Setup.exe'
binary_name=json.loads((root/'src-tauri/tauri.conf.json').read_text())['mainBinaryName']+'.exe'
nsis=release/'nsis/x64'
original=nsis/'installer.nsi'
if not original.exists():raise SystemExit('Generate the Tauri NSIS installer.nsi before running this script.')
resources=root/'app-resources-windows'
build=root/'windows-installer-build';build.mkdir(exist_ok=True)
payload=build/'app-resources.zip'
files=sorted(p for p in resources.rglob('*') if p.is_file())
expanded_bytes=sum(p.stat().st_size for p in files)
reuse='--reuse-payload' in sys.argv and payload.exists()
if reuse:
 with zipfile.ZipFile(payload) as archive:
  index={item.filename:item for item in archive.infolist()}
  if set(index) != {'app-resources/'+p.relative_to(resources).as_posix() for p in files}:
   raise SystemExit('Payload cache file list differs from staged resources; rebuild without --reuse-payload.')
  for p in files:
   item=index['app-resources/'+p.relative_to(resources).as_posix()]
   crc=0
   with p.open('rb') as source:
    while chunk:=source.read(1024*1024):crc=zlib.crc32(chunk,crc)
   if item.file_size!=p.stat().st_size or item.CRC!=crc:
    raise SystemExit('Payload cache differs from staged resource: '+str(p))
else:
 with zipfile.ZipFile(payload,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True,strict_timestamps=False) as archive:
  for p in files:archive.write(p, 'app-resources/'+p.relative_to(resources).as_posix())
with zipfile.ZipFile(payload) as archive:
 bad=archive.testzip()
 if bad:raise SystemExit('Payload ZIP integrity failure: '+bad)
print('Verified ZIP payload:',payload.stat().st_size,'bytes,',len(files),'files',flush=True)
script=original.read_text(encoding='utf-8-sig')
script=re.sub(r'!define ESTIMATEDSIZE \"[0-9]+\"', '!define ESTIMATEDSIZE \"'+str((expanded_bytes+(release/binary_name).stat().st_size+1023)//1024)+'\"',script)
script=script.replace('Section Install\n','Section Install\n  ; Account for expanded resources while embedded ZIP remains in TEMP.\n  AddSize '+str((expanded_bytes+1023)//1024)+'\n',1)
script,count=re.subn(r'^[ \t]*SetCompressor(?: /SOLID)? "?[a-z0-9]+"?$', 'SetCompressor zlib', script, flags=re.MULTILINE)
if count!=1:raise SystemExit('Unexpected NSIS compressor directive. Check the generated installer template.')
script=script.replace('!define OUTFILE "nsis-output.exe"', '!define OUTFILE "'+str(build/installer_name)+'"')
bootstrap=resources/'runtime'
lines=['  ; Offline resources are precompressed to avoid the NSIS 2GiB data limit.',
 '  ClearErrors','  InitPluginsDir','  CreateDirectory "$PLUGINSDIR\\docstudio-python"',
 '  SetOutPath "$PLUGINSDIR\\docstudio-python"']
for name in ['python.exe','python313.dll','python313.zip','python313._pth','vcruntime140.dll','vcruntime140_1.dll']:
 source=bootstrap/name
 if source.exists():lines.append('  File "/oname='+name+'" "'+str(source)+'"')
lines += ['  SetOutPath "$PLUGINSDIR"','  SetCompress off',
 '  File "/oname=app-resources.zip" "'+str(payload)+'"',
 '  SetCompress auto',
 '  File "/oname=extract-windows-resources.py" "'+str(root/'scripts/extract-windows-resources.py')+'"',
 '  IfErrors docstudio_resources_failed',
 '  DetailPrint "Verifying and installing offline OCR resources..."',
 '  ClearErrors',
 '  ExecWait \'"$PLUGINSDIR\\docstudio-python\\python.exe" -I -S -B "$PLUGINSDIR\\extract-windows-resources.py" "$PLUGINSDIR\\app-resources.zip" "$INSTDIR"\' $0',
 '  IfErrors docstudio_resources_failed',
 '  StrCmp $0 "0" docstudio_resources_done',
 '  docstudio_resources_failed:',
 '    MessageBox MB_ICONSTOP "Offline components could not be verified or installed. Ensure sufficient free disk space and run setup again." /SD IDOK',
 '    SetErrorLevel 1',
 '    Abort',
 '  docstudio_resources_done:',
 '  SetOutPath "$INSTDIR"']
a=script.index('  ; Copy resources');b=script.index('  ; Copy external binaries',a)
script=script[:a]+'\n'.join(lines)+'\n\n'+script[b:]
# Keep Tauri's original explicit uninstaller list, and also remove only this
# package-owned resource directory. User settings/recovery live outside INSTDIR.
uninstall=script.index('Section Uninstall') if 'Section Uninstall' in script else script.index('Section \"Uninstall\"')
insert=script.index('  ; Delete resources',uninstall)
script=script[:insert]+'  RMDir /r \"$INSTDIR\\app-resources\"\n'+script[insert:]
custom=nsis/'installer-large.nsi';custom.write_text(script,encoding='utf-8')
compiler=shutil.which('makensis')
if not compiler and os.name=='nt':
 cached=Path(os.environ['LOCALAPPDATA'])/'tauri/NSIS/makensis.exe'
 if cached.is_file():compiler=str(cached)
if not compiler:raise SystemExit('Install NSIS or add makensis to PATH.')
subprocess.run([compiler,'/V2' if os.name=='nt' else '-V2',str(custom)],cwd=nsis,check=True)
output=build/installer_name
print('Installer created:',output,output.stat().st_size,'bytes',flush=True)

