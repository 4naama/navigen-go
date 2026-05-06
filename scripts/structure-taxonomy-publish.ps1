param(
  [string]$StructurePath = "",
  [string]$ApiBase = "https://navigen-api.4naama.workers.dev",
  [string]$AdminToken = $env:NAVIGEN_ADMIN_TOKEN,
  [string]$Source = "structure-json-export",
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

function Count-StructureRows {
  param([object]$Parsed)

  if ($Parsed -is [array]) {
    return @($Parsed).Count
  }

  $props = @($Parsed.PSObject.Properties.Name)

  if ($props -contains "rows") {
    return @($Parsed.rows).Count
  }

  if ($props -contains "groups") {
    return @($Parsed.groups).Count
  }

  if ($props -contains "structure") {
    return @($Parsed.structure).Count
  }

  return 0
}

function Build-PublishPayload {
  param(
    [string]$RawJson,
    [string]$SourceName
  )

  $trimmed = $RawJson.Trim()
  Assert-True ($trimmed.Length -gt 0) "structure JSON is empty"

  $parsed = $trimmed | ConvertFrom-Json
  $rowCount = Count-StructureRows $parsed

  Assert-True ($rowCount -gt 0) "structure JSON must contain at least one group"

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

  throw "structure JSON must start with '[' or '{'"
}

if (-not $StructurePath) {
  $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
  $StructurePath = Join-Path $repoRoot.Path "frontend\public\data\structure.json"
}

$resolvedStructurePath = Resolve-Path $StructurePath
$rawJson = Get-Content -Raw $resolvedStructurePath.Path
$built = Build-PublishPayload -RawJson $rawJson -SourceName $Source

Write-Host "Structure file:" $resolvedStructurePath.Path
Write-Host "Payload shape:" $built.Shape
Write-Host "Groups:" $built.RowCount
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

$publishUri = "$api/api/admin/structure/publish"
$publicUri = "$api/api/structure/business-categories"
$manifestUri = "$api/api/admin/structure/manifest"

Write-Host "Publishing structure..."

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

Write-Host "Verifying public business categories..."

$structure = Invoke-RestMethod `
  -Uri $publicUri `
  -Method Get `
  -Headers @{ Accept = "application/json" }

Assert-True ([string]$structure.version -eq [string]$manifest.activeVersion) "public structure version does not match published manifest"
Assert-True ($null -ne $structure.groups -and @($structure.groups).Count -gt 0) "public structure missing groups"

$groupKeys = @($structure.groups | ForEach-Object { [string]$_.groupKey })
Assert-True ($groupKeys -contains "group.medical-services") "public structure missing group.medical-services"

$structureJson = $structure | ConvertTo-Json -Depth 80 -Compress
Assert-True (-not ($structureJson -match "adminNote|adminNotes|sheetRowId|sheetRowID|operatorComment|operatorComments|internalReview|reviewFlags")) "public structure leaked admin-only fields"

Write-Host "Verifying admin manifest..."

$remoteManifest = Invoke-RestMethod `
  -Uri $manifestUri `
  -Method Get `
  -Headers $adminHeaders

Assert-True ([string]$remoteManifest.activeVersion -eq [string]$manifest.activeVersion) "admin manifest activeVersion mismatch"
Assert-True ([string]$remoteManifest.checksum -eq [string]$manifest.checksum) "admin manifest checksum mismatch"

Write-Host "STR-1 structure publish passed."
Write-Host ""
$manifest | ConvertTo-Json -Depth 20