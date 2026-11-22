"""Installer-only extraction using bundled isolated Python, never user Python."""
from pathlib import Path
import os,shutil,sys,tempfile,zipfile
archive,install=Path(sys.argv[1]),Path(sys.argv[2]).resolve()
if os.name=='nt':
    # Long model and Python module names can exceed MAX_PATH under a custom
    # installation directory. Use absolute extended paths for staging and cleanup.
    destination=str(install)
    if not destination.startswith('\\\\?\\'):
        destination=('\\\\?\\UNC\\'+destination[2:]) if destination.startswith('\\\\') else ('\\\\?\\'+destination)
        install=Path(destination)
resources=(install/'app-resources').resolve()
if resources != install/'app-resources':
    raise ValueError('Installer resource directory must not be a redirected path')
with zipfile.ZipFile(archive) as source:
    for member in source.infolist():
        target=(install/member.filename).resolve()
        if resources not in target.parents or not member.filename.startswith('app-resources/'):
            raise ValueError('Invalid installer resource path')
    required=sum(item.file_size for item in source.infolist())
    if shutil.disk_usage(install).free < required:
        raise OSError('Insufficient free disk space for expanded offline components')
    damaged=source.testzip()
    if damaged:
        raise ValueError('Corrupt installer resource: '+damaged)
    # Preserve any previous resources until the new package has fully extracted.
    with tempfile.TemporaryDirectory(prefix='.docstudio-install-',dir=install) as temporary:
        staging=Path(temporary)
        source.extractall(staging)
        backup=staging/'previous-resources'
        if resources.exists():resources.rename(backup)
        try:(staging/'app-resources').rename(resources)
        except BaseException:
            if backup.exists():backup.rename(resources)
            raise
