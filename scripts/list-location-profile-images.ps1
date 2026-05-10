param(
  [string]$ImagesRoot = "",
  [string]$BaseUrl = "https://navigen.io",
  [string]$OutDir = "",
  [int]$MaxCandidatePhotos = 3,
  [switch]$Resolve
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  $scriptRoot = Split-Path -Parent $PSCommandPath
  return Split-Path -Parent $scriptRoot
}

function Normalize-PathText {
  param([string]$Value)

  return (StringOrEmpty $Value).Replace("`t", " ").Replace("`r", " ").Replace("`n", " ").Trim()
}

function StringOrEmpty {
  param([object]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return [string]$Value
}

function Get-ImageInfo {
  param([string]$Path)

  $info = [ordered]@{
    Width = ""
    Height = ""
  }

  try {
    Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
    $img = [System.Drawing.Image]::FromFile($Path)
    try {
      $info.Width = [string]$img.Width
      $info.Height = [string]$img.Height
    } finally {
      $img.Dispose()
    }
  } catch {
    $info.Width = ""
    $info.Height = ""
  }

  return [pscustomobject]$info
}

function Resolve-LocationSlug {
  param(
    [string]$Slug,
    [string]$Origin
  )

  $result = [ordered]@{
    Resolved = $false
    Ulid = ""
    LocationID = ""
    Error = ""
  }

  try {
    $url = $Origin.TrimEnd("/") + "/api/data/item?id=" + [uri]::EscapeDataString($Slug)
    $item = Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 25

    $ulid = StringOrEmpty($item.id)
    if (-not $ulid) { $ulid = StringOrEmpty($item.ID) }
    if (-not $ulid) { $ulid = StringOrEmpty($item.ulid) }
    if (-not $ulid) { $ulid = StringOrEmpty($item.locationUID) }

    $locationID = StringOrEmpty($item.locationID)
    if (-not $locationID) { $locationID = StringOrEmpty($item.slug) }

    $result.Resolved = [bool]$ulid
    $result.Ulid = $ulid
    $result.LocationID = $locationID
  } catch {
    $result.Error = StringOrEmpty($_.Exception.Message)
  }

  return [pscustomobject]$result
}

$repoRoot = Get-RepoRoot

if (-not $ImagesRoot) {
  $ImagesRoot = Join-Path $repoRoot "frontend\public\assets\location-profile-images"
}

if (-not $OutDir) {
  $OutDir = Join-Path $repoRoot "reports"
}

if (-not (Test-Path $ImagesRoot)) {
  throw "Images root not found: $ImagesRoot"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$inventoryPath = Join-Path $OutDir "location-profile-images-inventory.tsv"
$candidatePath = Join-Path $OutDir "location-profile-images-candidates.tsv"

$supportedExtensions = @(".jpg", ".jpeg", ".png", ".webp")
$nonPhotoNamePattern = "(?i)(^|[-_.])(icon|logo|placeholder|fallback|pin|marker|sprite|avatar|import)([-_.]|$)|icon-?512|512-green|no-photo|no_image|no-image"

$inventoryRows = New-Object System.Collections.Generic.List[object]
$candidateRows = New-Object System.Collections.Generic.List[object]

$folders = Get-ChildItem -Path $ImagesRoot -Directory | Sort-Object Name

foreach ($folder in $folders) {
  $slug = $folder.Name
  $files = Get-ChildItem -Path $folder.FullName -File | Sort-Object Name
  $imageFiles = $files | Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() }
  $nonPhotoFiles = $imageFiles | Where-Object { $_.Name -match $nonPhotoNamePattern }
  $candidateFiles = $imageFiles | Where-Object { $_.Name -notmatch $nonPhotoNamePattern }
  $selectedFiles = $candidateFiles | Sort-Object Length -Descending | Select-Object -First $MaxCandidatePhotos

  $resolved = [pscustomobject]@{
    Resolved = $false
    Ulid = ""
    LocationID = ""
    Error = ""
  }

  if ($Resolve) {
    $resolved = Resolve-LocationSlug -Slug $slug -Origin $BaseUrl
  }

  $skipReason = ""
  if ($imageFiles.Count -eq 0) {
    $skipReason = "no_supported_images"
  } elseif ($candidateFiles.Count -eq 0 -and $nonPhotoFiles.Count -gt 0) {
    $skipReason = "logo_or_placeholder_only"
  } elseif ($Resolve -and -not $resolved.Resolved) {
    $skipReason = "unresolved_slug"
  } else {
    $skipReason = "candidate"
  }

  $selectedNames = ($selectedFiles | ForEach-Object { $_.Name }) -join "|"
  $allNames = ($imageFiles | ForEach-Object { $_.Name }) -join "|"

  $inventoryRows.Add([pscustomobject]@{
    slug = Normalize-PathText $slug
    resolved = [string]$resolved.Resolved
    ulid = Normalize-PathText $resolved.Ulid
    locationID = Normalize-PathText $resolved.LocationID
    skipReason = Normalize-PathText $skipReason
    imageCount = [string]$imageFiles.Count
    candidateCount = [string]$candidateFiles.Count
    selectedCount = [string]$selectedFiles.Count
    selectedFiles = Normalize-PathText $selectedNames
    allImageFiles = Normalize-PathText $allNames
    resolveError = Normalize-PathText $resolved.Error
    folderPath = Normalize-PathText $folder.FullName
  }) | Out-Null

  $rank = 0
  foreach ($file in $selectedFiles) {
    $rank += 1
    $dim = Get-ImageInfo -Path $file.FullName

    $candidateRows.Add([pscustomobject]@{
      slug = Normalize-PathText $slug
      ulid = Normalize-PathText $resolved.Ulid
      locationID = Normalize-PathText $resolved.LocationID
      rank = [string]$rank
      fileName = Normalize-PathText $file.Name
      extension = Normalize-PathText $file.Extension.ToLowerInvariant()
      bytes = [string]$file.Length
      width = Normalize-PathText $dim.Width
      height = Normalize-PathText $dim.Height
      filePath = Normalize-PathText $file.FullName
    }) | Out-Null
  }
}

$inventoryRows | Export-Csv -Path $inventoryPath -Delimiter "`t" -NoTypeInformation -Encoding UTF8
$candidateRows | Export-Csv -Path $candidatePath -Delimiter "`t" -NoTypeInformation -Encoding UTF8

$summary = $inventoryRows | Group-Object skipReason | Sort-Object Name | ForEach-Object {
  "{0}: {1}" -f $_.Name, $_.Count
}

Write-Host "IMG-5A static media inventory complete."
Write-Host "Images root: $ImagesRoot"
Write-Host "Inventory: $inventoryPath"
Write-Host "Candidates: $candidatePath"
Write-Host ""
Write-Host "Summary:"
$summary | ForEach-Object { Write-Host $_ }