"""Verify a large-payload NSIS installer without executing Windows binaries."""
import hashlib,json,os,subprocess,sys,zipfile
from pathlib import Path
installer=Path(sys.argv[1]).resolve(strict=True)
payload=Path(sys.argv[2]).resolve(strict=True)
root=Path(__file__).resolve().parent.parent
application_name=json.loads((root/'src-tauri/tauri.conf.json').read_text())['mainBinaryName']+'.exe'
if installer.open('rb').read(2)!=b'MZ':raise SystemExit('Not a Windows PE installer')
result=subprocess.run(['7z','l','-slt',str(installer)],text=True,capture_output=True,check=True)
entries=[line[7:].replace('\\','/') for line in result.stdout.splitlines() if line.startswith('Path = ')]
payload_entry=next((p for p in entries if p.endswith('app-resources.zip')),None)
checks={'native_executable':any(Path(p).name.casefold()==application_name.casefold() for p in entries),'embedded_resource_zip':bool(payload_entry),'bootstrap_python':any(p.lower().endswith('docstudio-python/python.exe') for p in entries)}
with zipfile.ZipFile(payload) as archive:
 names=archive.namelist()
 checks.update({
  'payload_zip_integrity':archive.testzip() is None,
  'node_runtime':'app-resources/node/node.exe' in names,
  'python_runtime':'app-resources/runtime/python.exe' in names,
  'document_service':'app-resources/desktop-service.cjs' in names,
  'ocr_worker':'app-resources/import-engine/worker.py' in names,
  'ocr_models':any('/ocr/models/' in p and p.endswith('inference.pdiparams') for p in names),
  'runtime_manifest':'app-resources/runtime-manifest.json' in names,
  'application_license':archive.read('app-resources/LICENSE')==Path(__file__).resolve().parent.parent.joinpath('LICENSE').read_bytes(),
  'application_notice':archive.read('app-resources/NOTICE')==Path(__file__).resolve().parent.parent.joinpath('NOTICE').read_bytes(),
  'manual_updater':archive.read('app-resources/app-update.cjs')==Path(__file__).resolve().parent.parent.joinpath('app-update.cjs').read_bytes(),
  'third_party_notices':'app-resources/THIRD-PARTY-NOTICES.md' in names,
 })
 payload_files=len(names)
 embedded_service=hashlib.sha256(archive.read('app-resources/desktop-service.cjs')).hexdigest()
checks['helper_matches_final_source']=embedded_service==hashlib.file_digest(Path(__file__).resolve().parent.parent.joinpath('desktop-service.cjs').open('rb'),'sha256').hexdigest()
expected=hashlib.file_digest(payload.open('rb'),'sha256').hexdigest()
if payload_entry:
 stream=subprocess.Popen(['7z','x','-so',str(installer),payload_entry],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 actual=hashlib.file_digest(stream.stdout,'sha256').hexdigest();stream.stdout.close();error=stream.stderr.read();stream.stderr.close();code=stream.wait()
 checks['embedded_payload_exact_hash']=code==0 and actual==expected
main_entry=next(p for p in entries if Path(p).name.casefold()==application_name.casefold())
target_dir=Path(os.environ.get('CARGO_TARGET_DIR',root/'src-tauri/target')).resolve()
main_file=target_dir/'x86_64-pc-windows-msvc/release'/application_name
main_sha256=hashlib.file_digest(main_file.open('rb'),'sha256').hexdigest()
main_stream=subprocess.Popen(['7z','x','-so',str(installer),main_entry],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
main_actual=hashlib.file_digest(main_stream.stdout,'sha256').hexdigest();main_stream.stdout.close()
checks['embedded_main_matches_final_binary']=main_stream.wait()==0 and main_actual==main_sha256
subprocess.run(['7z','t',str(installer)],stdout=subprocess.DEVNULL,check=True)
checks['installer_archive_integrity']=True
report={'installer':installer.name,'installer_bytes':installer.stat().st_size,'installer_sha256':hashlib.file_digest(installer.open('rb'),'sha256').hexdigest(),'application_sha256':main_sha256,'payload_files':payload_files,'payload_sha256':expected,'helper_sha256':embedded_service,'checks':checks,'runtime_execution':'This verification checks the installer structure and its exact embedded payload.'}
print(json.dumps(report,indent=2))
if not all(checks.values()):raise SystemExit('Installer verification failed')
