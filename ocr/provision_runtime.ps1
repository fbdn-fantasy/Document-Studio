param(
  [switch]$DownloadDependencies,
  [string]$PythonArchive,
  [string]$PaddleWheel,
  [string]$Wheelhouse
)
$ErrorActionPreference = 'Stop'
$appSource = Split-Path -Parent $PSScriptRoot
$runtimeFolder = Join-Path $appSource 'runtime'
$runtimePython = Join-Path $runtimeFolder 'python.exe'
if (-not (Test-Path -LiteralPath $runtimePython)) {
  if (-not $PythonArchive) {
    if (-not $DownloadDependencies) { throw 'Supply -PythonArchive or explicitly use -DownloadDependencies on the build machine.' }
    $PythonArchive = Join-Path $appSource 'python-3.13.11-embed-amd64.zip'
    Invoke-WebRequest 'https://www.python.org/ftp/python/3.13.11/python-3.13.11-embed-amd64.zip' -OutFile $PythonArchive
  }
  $archiveHash = (Get-FileHash -LiteralPath $PythonArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($archiveHash -ne '1ec066fb61ba5e8c73e29e048cd07c26850f74585e3a116005135b31b8004890') { throw 'Unexpected Python 3.13.11 x64 embedded archive hash' }
  New-Item -ItemType Directory -Path $runtimeFolder -Force | Out-Null
  Expand-Archive -LiteralPath $PythonArchive -DestinationPath $runtimeFolder
  Set-Content -LiteralPath (Join-Path $runtimeFolder 'python313._pth') -Value @('python313.zip','.','Lib\site-packages','import site') -Encoding ascii
}
if ($DownloadDependencies -or $Wheelhouse) {
  # A build host with pip is required only when replacing the already supplied runtime.
  # The release source contains the complete prepared runtime for offline rebuilds.
  $hostPython = Get-Command python -ErrorAction Stop
  $pipArgs = @('-m','pip','--python',$runtimePython,'install','--disable-pip-version-check','--no-cache-dir')
  if ($Wheelhouse) { $pipArgs += @('--no-index','--find-links',$Wheelhouse) }
  & $hostPython.Source @pipArgs 'pip==26.3' 'setuptools==84.2.1' 'wheel==0.48.0'
  if ($LASTEXITCODE -ne 0) { throw 'Runtime bootstrap failed' }
  $installArgs = @('-m','pip','install','--disable-pip-version-check','--no-cache-dir')
  if ($Wheelhouse) { $installArgs += @('--no-index','--find-links',$Wheelhouse) }
  $installArgs += @('-r',(Join-Path $PSScriptRoot 'requirements-lock.txt'))
  & $runtimePython @installArgs
  if ($LASTEXITCODE -ne 0) { throw 'Pinned runtime dependency installation failed' }
  if ($PaddleWheel) {
    & $runtimePython -m pip install --no-deps --force-reinstall $PaddleWheel
    if ($LASTEXITCODE -ne 0) { throw 'Supplied PaddlePaddle wheel installation failed' }
  }
}
& $runtimePython (Join-Path $PSScriptRoot 'prepare_runtime.py')
if ($LASTEXITCODE -ne 0) { throw 'Runtime preparation failed' }
& $runtimePython (Join-Path $appSource 'import-engine\prepare_pdfium.py')
if ($LASTEXITCODE -ne 0) { throw 'Supplied PDFium preparation failed' }
& $runtimePython -m pip check
if ($LASTEXITCODE -ne 0) { throw 'Dependency compatibility check failed' }
Write-Host 'Offline Document Studio runtime prepared. Run import-engine/worker.py --health and OCR acceptance tests.'
