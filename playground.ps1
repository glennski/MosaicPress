$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& npx.cmd --yes @wp-playground/cli@latest server --mount-dir-before-install=build /wordpress --login @args
exit $LASTEXITCODE
