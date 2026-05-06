param(
  [string]$TaxonomyPath = "",
  [string]$ApiBase = "https://navigen-api.4naama.workers.dev",
  [string]$AdminToken = $env:NAVIGEN_ADMIN_TOKEN,
  [string]$Source = "google-sheets-export",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Json-String {
  param([string]$Value)

  return ($Value | ConvertTo-Json -Compress)
}

function Count-TaxonomyRows {
  param([object]$Parsed)

  if ($Parsed -is [array]) {
    return @($Parsed).Count
  }

  $props = @($Parsed.PSObject.Properties.Name)

  if ($props -contains "rows") {
    return @($Parsed.rows).Count
  }

  if ($props -contains "taxonomy") {
    return @($Parsed.taxonomy).Count
  }

  if ($props -contains "contexts") {
    return @($Parsed.contexts).Count
  }

  return 0
}

function Build-PublishPayload {
  param(
    [string]$RawJson,
    [string]$SourceName
  )

  $trimmed = $RawJson.Trim()
  Assert-True ($trimmed.Length -gt 0) "taxonomy JSON is empty"

  $parsed = $trimmed | ConvertFrom-Json
  $rowCount = Count-TaxonomyRows $parsed

  Assert-True ($rowCount -gt 0) "taxonomy JSON must contain at least one row"

  if ($trimmed.StartsWith("[")) {
    $payload = '{"source":' + (Json-String $SourceName) + ',"rows":' + $trimmed + '}'
    return [pscustomobject]@{
      Payload = $payload
      RowCount = $rowCount
      Shape = "root-array"
    }
  }

  if ($trimmed.StartsWith("{")) {
    return [pscustomobject]@{
      Payload = $trimmed
      RowCount = $rowCount
      Shape = "root-object"
    }
  }

  throw "taxonomy JSON must start with '[' or '{'"
}

if (-not $TaxonomyPath) {
  $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
  $TaxonomyPath = Join-Path $repoRoot.Path "frontend\public\data\contexts.json"
}

$resolvedTaxonomyPath = Resolve-Path $TaxonomyPath
$rawJson = [System.IO.File]::ReadAllText($resolvedTaxonomyPath.Path, [System.Text.Encoding]::UTF8)
$built = Build-PublishPayload -RawJson $rawJson -SourceName $Source

Write-Host "Taxonomy file:" $resolvedTaxonomyPath.Path
Write-Host "Payload shape:" $built.Shape
Write-Host "Rows:" $built.RowCount
Write-Host "API base:" $ApiBase

if ($DryRun) {
  Write-Host "Dry run passed. No publish request sent."
  exit 0
}

Assert-True (-not [string]::IsNullOrWhiteSpace($AdminToken)) "Set NAVIGEN_ADMIN_TOKEN or pass -AdminToken"

$api = $ApiBase.TrimEnd("/")
$adminHeaders = @{
  Authorization = "Bearer $AdminToken"
  Accept = "application/json"
}

$publishUri = "$api/api/admin/contexts/publish"
$publicUri = "$api/api/contexts/business-taxonomy"
$manifestUri = "$api/api/admin/contexts/manifest"

Write-Host "Publishing taxonomy..."

$manifest = Invoke-RestMethod `
  -Uri $publishUri `
  -Method Post `
  -Headers $adminHeaders `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($built.Payload))

Assert-True (-not [string]::IsNullOrWhiteSpace([string]$manifest.activeVersion)) "publish response missing activeVersion"
Assert-True (-not [string]::IsNullOrWhiteSpace([string]$manifest.checksum)) "publish response missing checksum"
Assert-True ([int]$manifest.count -gt 0) "publish response count must be greater than zero"

Write-Host "Published version:" $manifest.activeVersion
Write-Host "Published checksum:" $manifest.checksum
Write-Host "Published count:" $manifest.count

Write-Host "Verifying public business taxonomy..."

$taxonomy = Invoke-RestMethod `
  -Uri $publicUri `
  -Method Get `
  -Headers @{ Accept = "application/json" }

Assert-True ([string]$taxonomy.version -eq [string]$manifest.activeVersion) "public taxonomy version does not match published manifest"
Assert-True ($null -ne $taxonomy.groups -and @($taxonomy.groups).Count -gt 0) "public taxonomy missing groups"
Assert-True ($null -ne $taxonomy.contexts -and @($taxonomy.contexts).Count -gt 0) "public taxonomy missing contexts"

$taxonomyJson = $taxonomy | ConvertTo-Json -Depth 80 -Compress
Assert-True (-not ($taxonomyJson -match "adminNote|adminNotes|sheetRowId|sheetRowID|operatorComment|operatorComments|internalReview|reviewFlags")) "public taxonomy leaked admin-only fields"

Write-Host "Verifying admin manifest..."

$remoteManifest = Invoke-RestMethod `
  -Uri $manifestUri `
  -Method Get `
  -Headers $adminHeaders

Assert-True ([string]$remoteManifest.activeVersion -eq [string]$manifest.activeVersion) "admin manifest activeVersion mismatch"
Assert-True ([string]$remoteManifest.checksum -eq [string]$manifest.checksum) "admin manifest checksum mismatch"

Write-Host "CTX-5 publish passed."
Write-Host ""
$manifest | ConvertTo-Json -Depth 20