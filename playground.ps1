$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& node.exe ( Join-Path $PSScriptRoot 'tools\playground\server.mjs' ) @args
exit $LASTEXITCODE
