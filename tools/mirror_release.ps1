param(
    [string]$Tag = "v0.4.0",
    [string]$AppRepo = "kvikram170822/Folder-Org-Project",
    [switch]$SkipDownload
)

$ErrorActionPreference = "Stop"
$Site = Split-Path -Parent $PSScriptRoot
$Assets = Join-Path $Site "assets"
New-Item -ItemType Directory -Path $Assets -Force | Out-Null

if (-not $SkipDownload) {
    if (Test-Path (Join-Path $Assets "*")) {
        Remove-Item -Path (Join-Path $Assets "*") -Recurse -Force
    }
    gh release download $Tag --repo $AppRepo --dir $Assets
}

$assetsJson = gh release view $Tag --repo $AppRepo --json assets
$assetList = ($assetsJson | ConvertFrom-Json).assets

$map = @(
    @{ pattern = ".*\.dmg$";           platform = "macOS (Apple Silicon)"; desc = "Disk image" },
    @{ pattern = ".*\.app\.tar\.gz$";  platform = "macOS (Apple Silicon)"; desc = "Updater bundle" },
    @{ pattern = ".*\.msi$";           platform = "Windows";  desc = "Installer (MSI)" },
    @{ pattern = ".*\.exe$";           platform = "Windows";  desc = "Installer (EXE)" },
    @{ pattern = ".*\.deb$";           platform = "Linux";    desc = "Package (deb)" }
)

$downloads = @()
foreach ($row in $assetList) {
    foreach ($m in $map) {
        if ($row.name -match $m.pattern) {
            $local = Join-Path $Assets $row.name
            if (-not (Test-Path $local)) { Write-Warning "Missing local file: $($row.name)"; break }
            $size = (Get-Item $local).Length
            $downloads += [pscustomobject]@{
                name     = $row.name
                platform = $m.platform
                desc     = $m.desc
                size     = $size
                url      = "assets/$($row.name)"
            }
            break
        }
    }
}

$version = $Tag -replace "^v", ""
$json = @{ version = $version; downloads = @($downloads) } | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $Site "releases.json") -Value $json -Encoding utf8

Write-Host "releases.json written for v$version with $($downloads.Count) mirrors:"
$downloads | ForEach-Object { Write-Host ("  {0}  {1}  {2} bytes  -> {3}" -f $_.platform, $_.name, $_.size, $_.url) }