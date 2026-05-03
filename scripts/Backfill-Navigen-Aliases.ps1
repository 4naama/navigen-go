param(
  [Parameter(Mandatory=$true)] [string] $CfAccountId,
  [Parameter(Mandatory=$true)] [string] $AliasesNamespaceId,
  [Parameter(Mandatory=$true)] [string] $CfApiToken,
  [Parameter(Mandatory=$true)] [string] $WorkerAdminBase, # e.g. https://your-worker.workers.dev
  [Parameter(Mandatory=$true)] [string] $WorkerAdminJwt,
  [string] $ProfilesPath = ".\profiles.json",
  [string] $ProfilesUrl  = "https://navigen.io/data/profiles.json",
  [string] $ApiBase      = $WorkerAdminBase
)

$ErrorActionPreference = "Stop"

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Ok($m){ Write-Host "[ OK ] $m" -ForegroundColor Green }

# Load profiles.json (local or remote)
$json = $null
if (Test-Path -Path $ProfilesPath) {
  Info "Reading local profiles: $ProfilesPath"
  $json = Get-Content -Raw -Path $ProfilesPath | ConvertFrom-Json
} else {
  Info "Downloading profiles: $ProfilesUrl"
  $resp = Invoke-WebRequest -UseBasicParsing -Uri $ProfilesUrl -Headers @{ "Accept" = "application/json" }
  $json = $resp.Content | ConvertFrom-Json
}

# Normalize locations array
$locations = @()
if ($json.locations -is [System.Collections.IEnumerable]) { $locations = $json.locations }
elseif ($json.locations -is [pscustomobject]) { $locations = $json.locations.PSObject.Properties | ForEach-Object { $_.Value } }
if (-not $locations) { throw "profiles.json has no 'locations'." }

# Keep only curated brands (Helen Doron + Európa Patika)
$want = $locations | Where-Object { ([string]$_.locationID) -match '^(hd-|europa-patika-)' }
Info "Curated candidates: $($want.Count)"

$ULIDRegex = '^[0-9A-HJKMNP-TV-Z]{26}$'

function Resolve-CanonicalUlid([string] $alias) {
  $url = "$ApiBase/api/data/profile?id=$([uri]::EscapeDataString($alias))"
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $url -Headers @{ "Accept" = "application/json" }
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
      $p = $r.Content | ConvertFrom-Json
      $id = [string]$p.locationID
      if ($id -match $ULIDRegex) { return $id }
    }
  } catch { }
  return $null
}

function Put-KvAlias([string] $alias, [string] $ulid) {
  $key   = "alias:$alias"
  $value = @{ locationID = $ulid } | ConvertTo-Json -Compress
  $cfUrl = "https://api.cloudflare.com/client/v4/accounts/$CfAccountId/storage/kv/namespaces/$AliasesNamespaceId/values/$([uri]::EscapeDataString($key))"
  $hdrs  = @{ "Authorization" = "Bearer $CfApiToken"; "Content-Type" = "application/json" }
  $r = Invoke-WebRequest -Method PUT -UseBasicParsing -Uri $cfUrl -Headers $hdrs -Body $value
  return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300)
}

# Build alias list
$todo = $want | ForEach-Object { [pscustomobject]@{ alias = [string]$_.locationID; ulid = $null } }

# Try resolve ULIDs via API
$resolved = 0
foreach ($row in $todo) {
  $u = Resolve-CanonicalUlid -alias $row.alias
  if ($u) { $row.ulid = $u; $resolved++; Ok "$($row.alias) → $u" } else { Warn "Unresolved: $($row.alias)" }
}

# Manual overrides if any unresolved; fill as needed then rerun
$Manual = @{}
foreach ($k in $Manual.Keys) {
  $row = $todo | Where-Object { $_.alias -eq $k }
  if ($row) { $row.ulid = $Manual[$k]; Ok "Manual map $k → $($row.ulid)" }
}

# Write KV alias records
$wrote = 0; $skipped = 0
foreach ($row in $todo) {
  if ($row.ulid -and ($row.ulid -match $ULIDRegex)) {
    if (Put-KvAlias -alias $row.alias -ulid $row.ulid) { $wrote++ } else { Warn "KV put failed: $($row.alias)" }
  } else { $skipped++ }
}
Info "KV summary: wrote=$wrote, skipped=$skipped"

# Trigger slug→ULID stats backfill (idempotent)
try {
  $hdrs = @{ "Authorization" = "Bearer $WorkerAdminJwt"; "Content-Type" = "application/json" }
  $url  = "$WorkerAdminBase/api/admin/backfill-slug-stats"
  $res  = Invoke-WebRequest -UseBasicParsing -Method POST -Uri $url -Headers $hdrs -Body "{}"
  Ok ("Backfill: " + $res.Content)
} catch {
  Warn "Backfill call failed: $($_.Exception.Message)"
}
Ok "Done."
