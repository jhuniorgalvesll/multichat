$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot
$parts = Get-ChildItem (Join-Path $base 'parts\fertisem-checkout-lite-v1.6.19-public-sanitized.zip.part-*') | Sort-Object Name
if (-not $parts) { throw 'No se encontraron las partes del archivo.' }
$out = Join-Path $base 'fertisem-checkout-lite-v1.6.19-public-sanitized.zip'
$stream = [System.IO.File]::Open($out, [System.IO.FileMode]::Create)
try {
    foreach ($part in $parts) {
        $bytes = [System.IO.File]::ReadAllBytes($part.FullName)
        $stream.Write($bytes, 0, $bytes.Length)
    }
} finally {
    $stream.Dispose()
}
Write-Host "ZIP reconstruido: $out"
Write-Host 'SHA-256 esperado: fc59b971e63b901b6409b0367acab4cea4b0e8405a411923a6af11aec31dd0d7'
