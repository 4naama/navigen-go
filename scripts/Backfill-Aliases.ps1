<# Backfill-Aliases.ps1
   Purpose: Backfill KV_ALIASES so legacy hd-* slugs resolve to ULIDs via Cloudflare REST API.
#>

param(
  [Parameter(Mandatory=$true)] [string] $AccountId,     # Cloudflare account id
  [Parameter(Mandatory=$true)] [string] $ApiToken,      # API token with KV read/write
  [Parameter(Mandatory=$true)] [string] $AliasesNs,     # KV_ALIASES namespace id
  [Parameter(Mandatory=$true)] [string] $StatsNs,       # KV_STATS namespace id (for discovery)
  [switch] $DiscoverFromStats,                          # list hd-* aliases from stats
  [string] $WriteTemplate,                              # write aliases.json skeleton
  [hashtable] $Map,                                     # inline alias->ULID
  [string] $FromJson,                                   # path to aliases.json
  [switch] $StoreAsObject                               # use {"locationID":"ULID"} JSON value
)

$Base = "https://api.cloudflare.com/client/v4/accounts/$AccountId/storage/kv/namespaces"
$Hdrs = @{ Authorization = "Bearer $ApiToken" }

function Test-ULID([string]$v) { return ($v -match '^[0-9A-HJKMNP-TV-Z]{26}$') }

function CF-ListKeys {
  param([string]$Ns,[string]$Prefix,[int]$Limit=1000)
  $cursor = $null
  $out = @()
  do {
    $u = "$Base/$Ns/keys?prefix=$([uri]::EscapeDataString($Prefix))&limit=$Limit"
    if ($cursor) { $u += "&cursor=$([uri]::EscapeDataString($cursor))" }
    $resp = Invoke-RestMethod -Method GET -Uri $u -Headers $Hdrs
    if (-not $resp.success) { throw "ListKeys failed: $($resp.errors | ConvertTo-Json -Compress)" }
    $out += $resp.result
    $cursor = $resp.result_info.cursor
  } while ($resp.result_info.cursor -and -not $resp.result_info.list_complete)
  return $out
}

function CF-PutValue {
  param([string]$Ns,[string]$Key,[string]$Value,[string]$ContentType="text/plain")
  $u = "$Base/$Ns/values/$([uri]::EscapeDataString($Key))"
  $resp = Invoke-RestMethod -Method PUT -Uri $u -Headers ($Hdrs + @{ "Content-Type"=$ContentType }) -Body $Value
  if (-not $resp.success) { throw "PutValue failed for ${Key}: $($resp.errors | ConvertTo-Json -Compress)" }
}

function Discover-AliasesFromStats {
  $keys = CF-ListKeys -Ns $StatsNs -Prefix "stats:"
  $needed = New-Object System.Collections.Generic.HashSet[string]
  foreach ($k in $keys) {
    $parts = $k.name.Split(":")
    if ($parts.Count -eq 4) {
      $id = $parts[1]
      if (-not (Test-ULID $id) -and $id -like 'hd-*') { [void]$needed.Add($id) }
    }
  }
  if ($needed.Count -eq 0) {
    Write-Host "✅ No slug-based stats found."
  } else {
    Write-Host "⚠️ Aliases needing ULIDs:"
    $needed | Sort-Object | ForEach-Object { Write-Host " - $_" }
    if ($WriteTemplate) {
      $tmpl = $needed | Sort-Object | ForEach-Object { [pscustomobject]@{ alias = $_; locationID = "<PUT_ULID_HERE>" } }
      $tmpl | ConvertTo-Json -Depth 3 | Out-File -Encoding UTF8 $WriteTemplate
      Write-Host "📝 Template written: $WriteTemplate"
    }
  }
}

function Load-Mapping {
  $pairs = @()
  if ($Map) {
    foreach ($k in $Map.Keys) { $pairs += [pscustomobject]@{ alias=[string]$k; locationID=[string]$Map[$k] } }
  }
  if ($FromJson) {
    if (-not (Test-Path $FromJson)) { throw "JSON file not found: $FromJson" }
    $json = (Get-Content -Raw -Path $FromJson | ConvertFrom-Json)
    if ($json -is [System.Collections.IEnumerable]) {
      foreach ($row in $json) { $pairs += [pscustomobject]@{ alias=[string]$row.alias; locationID=[string]$row.locationID } }
    } elseif ($json.PSObject.Properties.Name -contains "alias") {
      $pairs += [pscustomobject]@{ alias=[string]$json.alias; locationID=[string]$json.locationID }
    } else {
      foreach ($p in $json.PSObject.Properties) { $pairs += [pscustomobject]@{ alias=[string]$p.Name; locationID=[string]$p.Value } }
    }
  }
  $pairs = $pairs | Where-Object { $_.alias -and $_.locationID } |
           Group-Object alias | ForEach-Object { $_.Group | Select-Object -First 1 }
  return $pairs
}

if ($DiscoverFromStats) {
  Discover-AliasesFromStats
  if (-not $Map -and -not $FromJson) { return }
}

$pairs = Load-Mapping
if (-not $pairs -or $pairs.Count -eq 0) {
  Write-Host "No alias→ULID pairs supplied. Use -FromJson or -Map, or run -DiscoverFromStats."
  return
}

$ok = 0; $bad = 0
foreach ($row in $pairs) {
  $alias = $row.alias.Trim()
  $ulid  = $row.locationID.Trim().ToUpper()
  if (-not (Test-ULID $ulid)) {
    Write-Warning "Skipping '$alias' → '$ulid' (invalid ULID)."
    $bad++; continue
  }
  $key = "alias:$alias"
  if ($StoreAsObject) {
    $val = @{ locationID = $ulid } | ConvertTo-Json -Compress
    CF-PutValue -Ns $AliasesNs -Key $key -Value $val -ContentType "application/json"
  } else {
    CF-PutValue -Ns $AliasesNs -Key $key -Value $ulid -ContentType "text/plain"
  }
  Write-Host "✅ $key → $ulid"
  $ok++
}
Write-Host "Done. ✅ $ok written, ❌ $bad skipped."
