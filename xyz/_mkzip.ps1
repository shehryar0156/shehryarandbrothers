$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = 'D:\xyz'
$zipPath = Join-Path $root 'site.zip'

$rootFiles = @(
  'index.html', 'services.html', 'gallery.html', 'rates.html', 'contact.html',
  '404.html', 'site.css', 'site.js', 'robots.txt', 'sitemap.xml',
  'sab-logo.svg', 'logo-mark.svg', 'og-image.jpg', 'UPLOAD-READ-ME.txt', '_headers'
)

# ---------- literal img/... references written in the site files ----------
$sources = @('index.html', 'services.html', 'gallery.html', 'rates.html', 'contact.html', 'site.css', 'site.js')
$refs = @{}
foreach ($s in $sources) {
  $txt = [IO.File]::ReadAllText((Join-Path $root $s))
  foreach ($m in [regex]::Matches($txt, 'img/[A-Za-z0-9._/-]+\.(?:jpg|jpeg|png|webp|svg|gif)')) { $refs[$m.Value] = $true }
}

# ---------- EVERY item photo on disk must ship ----------
# (some item-chip photos are only linked from the JS data array, where the
#  path is built as 'img/items/' + slug + '.jpg' - a literal scan cannot see them)
$itemsDir = Join-Path $root 'img\items'
$diskItems = @()
if (Test-Path $itemsDir) {
  $diskItems = @(Get-ChildItem $itemsDir -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp|svg|gif)$' } | Sort-Object Name)
}
$ship = @{}
foreach ($r in $refs.Keys) { $ship[$r] = $true }
foreach ($fi in $diskItems) { $ship['img/items/' + $fi.Name] = $true }
$imgShip = @($ship.Keys | Sort-Object)
$items = @($imgShip | Where-Object { $_ -like 'img/items/*' })
Write-Output ('root files: {0}   img to ship: {1} (items {2} + root {3})' -f $rootFiles.Count, $imgShip.Count, $items.Count, ($imgShip.Count - $items.Count))

$err = 0
$burgerPat = 'cart\.|checkout|product\.|pakistan\.html|youngstar|script\.js|store\.js|styles\.css|urdu\.js|burger-|pk-|diner|fries|shake'
foreach ($f in $rootFiles) { if (-not (Test-Path (Join-Path $root $f))) { Write-Output ('MISSING ROOT: ' + $f); $err++ } }
foreach ($r in $imgShip) {
  if ($r.Contains('\')) { Write-Output ('BACKSLASH: ' + $r); $err++ }
  if (-not (Test-Path (Join-Path $root $r))) { Write-Output ('MISSING IMG: ' + $r); $err++ }
}
foreach ($f in $rootFiles) { if ($f -match $burgerPat) { Write-Output ('BURGER LEAK root: ' + $f); $err++ } }
foreach ($r in $imgShip) { if ($r -match $burgerPat) { Write-Output ('BURGER LEAK img: ' + $r); $err++ } }

# ---------- item-chip slugs (site.js STATIONERY_ITEMS 3rd value) ----------
$js = [IO.File]::ReadAllText((Join-Path $root 'site.js'))
$startAt = $js.IndexOf('var STATIONERY_ITEMS')
$endAt = $js.IndexOf("`n      ];", $startAt)
if ($startAt -lt 0 -or $endAt -lt 0) { Write-Output 'STATIONERY_ITEMS block not found'; $err++ }
$itemsBlock = ''
if ($startAt -ge 0 -and $endAt -gt $startAt) { $itemsBlock = $js.Substring($startAt, $endAt - $startAt) }
$slugCount = 0
foreach ($m in [regex]::Matches($itemsBlock, "\['[^']*',\s*'[^']*',\s*'([^']+)'\]")) {
  $slug = $m.Groups[1].Value
  $slugCount++
  if (-not (Test-Path (Join-Path $root ('img\items\' + $slug + '.jpg')))) {
    Write-Output ('MISSING CHIP PHOTO: img/items/' + $slug + '.jpg'); $err++
  }
}
$rowCount = ([regex]::Matches($itemsBlock, "\['[^']*',\s*'[^']*',\s*'")).Count
Write-Output ('item rows: ' + $rowCount + '   with a photo: ' + $slugCount)
$noPhoto = $rowCount - $slugCount
if ($noPhoto -gt 0) { Write-Output ('WARNING: ' + $noPhoto + ' item(s) have no photo (letter tile)') }
$unlinked = 0
foreach ($fi in $diskItems) {
  if (-not $refs.ContainsKey('img/items/' + $fi.Name)) { $unlinked++ }
}
Write-Output ('note: ' + $unlinked + ' item photo(s) are not a literal ref (used by JS data or unused)')

# ---------- footer checks ----------
foreach ($s in @('index.html', 'services.html', 'gallery.html', 'rates.html', 'contact.html')) {
  $t = [IO.File]::ReadAllText((Join-Path $root $s))
  if ($t -notmatch 'footer-credits') { Write-Output ('NO CREDITS BLOCK: ' + $s); $err++ }
  if ($t -notmatch '<details>') { Write-Output ('NO DETAILS: ' + $s); $err++ }
}
if ($err -gt 0) { throw ('validation failed: ' + $err + ' errors') }

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $count = 0
  foreach ($f in $rootFiles) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $f), $f, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $count++
  }
  foreach ($r in $imgShip) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $r), $r, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $count++
  }
} finally { $zip.Dispose() }
Write-Output ('site.zip: {0:N0} KB, {1} entries' -f ((Get-Item $zipPath).Length / 1KB), $count)

$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entries = @($check.Entries)
  $bad = 0
  foreach ($e in $entries) {
    if ($e.FullName.Contains('\')) { Write-Output ('ZIP BACKSLASH: ' + $e.FullName); $bad++ }
    if ($e.FullName -match $burgerPat) { Write-Output ('ZIP BURGER: ' + $e.FullName); $bad++ }
    if ($e.Length -eq 0) { Write-Output ('ZIP EMPTY: ' + $e.FullName); $bad++ }
  }
  $zipItems = @($entries | Where-Object { $_.FullName -like 'img/items/*' })
  Write-Output ('verify: entries={0} items={1} bad={2}' -f $entries.Count, $zipItems.Count, $bad)
  foreach ($n in @('pencils.jpg', 'item-127.jpg', 'item-103.jpg', 'pvc-id-cards.jpg', 'id-card-covers.jpg')) {
    $found = @($entries | Where-Object { $_.FullName -eq ('img/items/' + $n) }).Count -gt 0
    Write-Output ('  in zip: img/items/' + $n + ' = ' + $found)
  }
} finally { $check.Dispose() }
