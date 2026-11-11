# V3.7 Before/After 对比图合成 (System.Drawing, 无外部依赖)
# 用法: powershell -File compose_diff.ps1
# 生成: docs/screenshots/v37-diff/<name>_diff.png (左Before右After, 中缝标签)
Add-Type -AssemblyName System.Drawing

$pairs = @(
    @{ name = '1soldier'; before = 'docs/screenshots/v37-before/390_1soldier.png'; after = 'docs/screenshots/v37-after/390_1soldier.png' },
    @{ name = '31';       before = 'docs/screenshots/v37-before/390_31.png';       after = 'docs/screenshots/v37-after/390_31.png' },
    @{ name = '100';      before = 'docs/screenshots/v37-before/390_100.png';      after = 'docs/screenshots/v37-after/390_100.png' },
    @{ name = 'start';    before = 'docs/screenshots/v37-before/390_start.png';    after = 'docs/screenshots/v37-after/390_start.png' },
    @{ name = '12';       before = 'docs/screenshots/v37-before/390_12.png';       after = 'docs/screenshots/v37-after/390_12.png' }
)

$outDir = 'docs/screenshots/v37-diff'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$labelFont = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
$bgColor = [System.Drawing.Color]::FromArgb(30, 30, 40)

foreach ($p in $pairs) {
    $beforePath = Join-Path $PWD $p.before
    $afterPath  = Join-Path $PWD $p.after
    if (-not (Test-Path $beforePath)) { Write-Output "SKIP(no before): $($p.name)"; continue }
    if (-not (Test-Path $afterPath))  { Write-Output "SKIP(no after): $($p.name)"; continue }

    $imgB = [System.Drawing.Image]::FromFile($beforePath)
    $imgA = [System.Drawing.Image]::FromFile($afterPath)

    $gap = 8
    $banner = 44
    $w = $imgB.Width + $imgA.Width + $gap
    $h = [Math]::Max($imgB.Height, $imgA.Height) + $banner

    $canvas = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear($bgColor)

    # Before 左半 + 标签
    $g.DrawImage($imgB, 0, $banner, $imgB.Width, $imgB.Height)
    $g.DrawString('BEFORE (V3.6基线)', $labelFont, [System.Drawing.Brushes]::OrangeRed, 12, 6)
    # After 右半 + 标签
    $ax = $imgB.Width + $gap
    $g.DrawImage($imgA, $ax, $banner, $imgA.Width, $imgA.Height)
    $g.DrawString('AFTER (V3.7返工)', $labelFont, [System.Drawing.Brushes]::LimeGreen, ($ax + 12), 6)

    $g.Dispose()
    $outPath = Join-Path $PWD "$outDir/$($p.name)_diff.png"
    $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
    $imgB.Dispose()
    $imgA.Dispose()
    Write-Output "OK: $outPath ($([IO.File]::Info($outPath).Length) bytes)"
}
