param(
  [string]$SourceListPath = "",
  [string]$ImagesRoot = ".\frontend\public\assets\location-profile-images",
  [string]$OutPath = ".\reports\img5-static-media-profile-map.tsv",
  [string]$WorkerDir = ".\backend\worker"
)

$ErrorActionPreference = "Stop"

if (-not $SourceListPath) {
  $sourceListCandidates = @(
    ".\scripts\img5-curated-media-import-targets.tsv",
    ".\scripts\img5-curated-media-import-slugs.tsv"
  )

  $SourceListPath = ($sourceListCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1)

  if (-not $SourceListPath) {
    $SourceListPath = ".\scripts\img5-curated-media-import-targets.tsv"
  }
}

function Read-Text {
  param([object]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return [string]$Value
}

function Get-JsonValue {
  param(
    [object]$Object,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    try {
      if ($Object.PSObject.Properties.Name -contains $name) {
        $value = $Object.$name
        if ($null -ne $value -and [string]$value -ne "") {
          return $value
        }
      }
    } catch {}
  }

  return $null
}

function Get-ProfileLocationID {
  param([object]$Profile)

  $value = Get-JsonValue $Profile @("locationID", "slug", "alias")
  return (Read-Text $value).Trim()
}

function Get-ProfileName {
  param([object]$Profile)

  try {
    if ($Profile.locationName -and $Profile.locationName.en) {
      return (Read-Text $Profile.locationName.en).Trim()
    }

    if ($Profile.locationName) {
      return (Read-Text $Profile.locationName).Trim()
    }

    if ($Profile.name) {
      return (Read-Text $Profile.name).Trim()
    }
  } catch {}

  return ""
}

function Get-StaticFolderRefs {
  param([string]$JsonText)

  $refs = New-Object System.Collections.Generic.HashSet[string]
  if (-not $JsonText) {
    return @()
  }

  $regex = [regex]'/assets/location-profile-images/([^/"''\s\\]+)'
  foreach ($match in $regex.Matches($JsonText)) {
    $folder = [uri]::UnescapeDataString($match.Groups[1].Value).Trim()
    if ($folder) {
      [void]$refs.Add($folder)
    }
  }

  return @($refs)
}

function Get-WranglerKvText {
  param([string]$Key)

  Push-Location $WorkerDir
  try {
    $text = & wrangler kv key get $Key --binding KV_STATUS --remote --text 2>$null
    if ($LASTEXITCODE -ne 0) {
      return ""
    }

    return [string]$text
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path $SourceListPath)) {
  throw "Missing source list: $SourceListPath"
}

if (-not (Test-Path $ImagesRoot)) {
  throw "Missing images root: $ImagesRoot"
}

if (-not (Test-Path ".\reports")) {
  New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
}

$sourceRows = Import-Csv -Delimiter "`t" -Path $SourceListPath
$sourceFolders = New-Object System.Collections.Generic.HashSet[string]

foreach ($row in $sourceRows) {
  foreach ($candidate in @($row.preferredSlug, $row.alternateSlug, $row.sourceFolderSlug)) {
    $value = (Read-Text $candidate).Trim()
    if ($value) {
      [void]$sourceFolders.Add($value)
    }
  }
}

if ($sourceFolders.Count -eq 0) {
  throw "No source folder slugs found in $SourceListPath"
}

Push-Location $WorkerDir
try {
  $keyJson = & wrangler kv key list --binding KV_STATUS --prefix profile_base: --remote
  if ($LASTEXITCODE -ne 0) {
    throw "wrangler kv key list failed."
  }
} finally {
  Pop-Location
}

$keys = $keyJson | ConvertFrom-Json
$profileKeys = @($keys | ForEach-Object { [string]$_.name } | Where-Object { $_ -match '^profile_base:[0-9A-HJKMNP-TV-Z]{26}$' })

$rows = New-Object System.Collections.Generic.List[object]

foreach ($key in $profileKeys) {
  $ulid = $key.Replace("profile_base:", "").Trim()
  $baseText = Get-WranglerKvText "profile_base:$ulid"
  $overrideText = Get-WranglerKvText "override:$ulid"

  if (-not $baseText -and -not $overrideText) {
    continue
  }

  $base = $null
  $override = $null

  try { if ($baseText) { $base = $baseText | ConvertFrom-Json } } catch {}
  try { if ($overrideText) { $override = $overrideText | ConvertFrom-Json } } catch {}

  $effectiveForLabel = if ($override) { $override } else { $base }
  $locationID = Get-ProfileLocationID $effectiveForLabel
  if (-not $locationID -and $base) {
    $locationID = Get-ProfileLocationID $base
  }

  $name = Get-ProfileName $effectiveForLabel
  if (-not $name -and $base) {
    $name = Get-ProfileName $base
  }

  $baseRefs = Get-StaticFolderRefs $baseText
  $overrideRefs = Get-StaticFolderRefs $overrideText
  $allRefs = @($baseRefs + $overrideRefs) | Select-Object -Unique

  foreach ($folder in $allRefs) {
    if (-not $sourceFolders.Contains($folder)) {
      continue
    }

    $folderPath = Join-Path $ImagesRoot $folder
    $folderExists = Test-Path $folderPath

    $supported = @(".jpg", ".jpeg", ".png", ".webp")
    $nonPhotoPattern = "(?i)(^|[-_.])(icon|logo|placeholder|fallback|pin|marker|sprite|avatar|import)([-_.]|$)|icon-?512|512-green|no-photo|no_image|no-image"

    $files = @()
    $candidateFiles = @()

    if ($folderExists) {
      $files = @(Get-ChildItem -Path $folderPath -File | Where-Object { $supported -contains $_.Extension.ToLowerInvariant() } | Sort-Object Length -Descending)
      $candidateFiles = @($files | Where-Object { $_.Name -notmatch $nonPhotoPattern })
    }

    $matchedIn = @()
    if ($baseRefs -contains $folder) { $matchedIn += "base" }
    if ($overrideRefs -contains $folder) { $matchedIn += "override" }

    $rows.Add([pscustomobject]@{
      sourceFolderSlug = $folder
      targetULID = $ulid
      targetLocationID = $locationID
      targetName = $name
      matchedIn = ($matchedIn -join "|")
      folderExists = [string]$folderExists
      imageCount = [string]$files.Count
      nonLogoImageCount = [string]$candidateFiles.Count
      selectedFiles = (($candidateFiles | Select-Object -First 3 | ForEach-Object { $_.Name }) -join "|")
      approvedToMigrate = "review"
      note = "resolved from published profile static media reference"
    }) | Out-Null
  }
}

$rows |
  Sort-Object sourceFolderSlug, targetLocationID |
  Export-Csv -Path $OutPath -Delimiter "`t" -NoTypeInformation -Encoding UTF8

Write-Host "Static media profile map created:"
Write-Host $OutPath
Write-Host ""

Write-Host "Resolved rows:"
$rows |
  Sort-Object sourceFolderSlug |
  Format-Table sourceFolderSlug, targetLocationID, targetName, targetULID, folderExists, nonLogoImageCount, selectedFiles -AutoSize

Write-Host ""
Write-Host "Summary:"
Write-Host "source folders requested: $($sourceFolders.Count)"
Write-Host "profile_base keys scanned: $($profileKeys.Count)"
Write-Host "resolved static folder mappings: $($rows.Count)"