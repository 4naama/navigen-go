param(
  [Parameter(Mandatory = $true)][string]$LocationID,
  [string]$CampaignKey = ''
)

$ErrorActionPreference = 'Stop'
$ApiBase  = 'https://navigen-api.4naama.workers.dev'
$SiteBase = 'https://navigen.io'

function Parse-Query([string]$Query) {
  $map = @{}
  foreach ($part in ($Query.TrimStart('?') -split '&')) {
    if ([string]::IsNullOrWhiteSpace($part)) { continue }
    $pair = $part -split '=', 2
    $k = [uri]::UnescapeDataString($pair[0])
    $v = if ($pair.Count -gt 1) { [uri]::UnescapeDataString($pair[1]) } else { '' }
    $map[$k] = $v
  }
  return $map
}

function Get-NoFollow([string]$Url) {
  $req = [System.Net.HttpWebRequest]::Create($Url)
  $req.Method = 'GET'
  $req.AllowAutoRedirect = $false
  $req.UserAgent = 'redeem-smoke/1.0'
  try {
    return [System.Net.HttpWebResponse]$req.GetResponse()
  } catch [System.Net.WebException] {
    if ($_.Exception.Response) { return [System.Net.HttpWebResponse]$_.Exception.Response }
    throw
  }
}

function Get-Header($Response, [string]$Name) {
  if ($null -eq $Response -or $null -eq $Response.Headers) { return '' }
  try { return [string]$Response.Headers[$Name] } catch { return '' }
}

function Get-StatusCode($Response) {
  try { return [int]$Response.StatusCode } catch { return -1 }
}

function Get-RedirectContract([string]$Url) {
  $resp = Get-NoFollow $Url
  [pscustomobject]@{
    Url      = $Url
    Status   = Get-StatusCode $resp
    Location = Get-Header $resp 'Location'
    Contract = Get-Header $resp 'X-NG-Redeem-Contract'
    Build    = Get-Header $resp 'X-NG-Redeem-Build'
  }
}

function Get-FreshPromo() {
  $url = "$ApiBase/api/promo-qr?locationID=$([uri]::EscapeDataString($LocationID))"
  if ($CampaignKey) {
    $url += "&campaignKey=$([uri]::EscapeDataString($CampaignKey))"
  }

  $promo = Invoke-RestMethod -Uri $url -Method Get -Headers @{
    'Origin'        = $SiteBase
    'Cache-Control' = 'no-cache'
    'Pragma'        = 'no-cache'
  }

  $qr = [uri]$promo.qrUrl
  $q = Parse-Query $qr.Query
  $routeId = [uri]::UnescapeDataString(($qr.AbsolutePath.TrimEnd('/') -split '/')[-1])

  [pscustomobject]@{
    QrUrl      = [string]$promo.qrUrl
    RouteId    = $routeId
    Token      = [string]$q['rt']
    Campaign   = [string]$q['camp']
    SiteOutUrl = "$SiteBase$($qr.PathAndQuery)"
    ApiOutUrl  = "$ApiBase$($qr.PathAndQuery)"
    Host       = $qr.Host
  }
}

function Invoke-Truth([string]$RouteId, [string]$Token) {
  $url = "$ApiBase/hit/qr-redeem/$([uri]::EscapeDataString($RouteId))?rt=$([uri]::EscapeDataString($Token))&json=1"
  return Invoke-RestMethod -Uri $url -Method Post -Headers @{
    'Origin'        = $SiteBase
    'Cache-Control' = 'no-cache'
    'Pragma'        = 'no-cache'
  }
}

function Run-Baseline() {
  $promo = Get-FreshPromo
  $first = Invoke-Truth $promo.RouteId $promo.Token
  $second = Invoke-Truth $promo.RouteId $promo.Token
  [pscustomobject]@{
    Host   = $promo.Host
    QrUrl  = $promo.QrUrl
    First  = [string]$first.outcome
    Second = [string]$second.outcome
  }
}

function Run-Touched([string]$EntryBase) {
  $promo = Get-FreshPromo
  $pathAndQuery = ([uri]$promo.QrUrl).PathAndQuery
  $touchUrl = "$EntryBase$pathAndQuery"
  $contract = Get-RedirectContract $touchUrl
  $first = Invoke-Truth $promo.RouteId $promo.Token
  $second = Invoke-Truth $promo.RouteId $promo.Token

  [pscustomobject]@{
    EntryUrl         = $touchUrl
    RedirectStatus   = $contract.Status
    RedirectLocation = $contract.Location
    RedirectContract = $contract.Contract
    RedirectBuild    = $contract.Build
    First            = [string]$first.outcome
    Second           = [string]$second.outcome
  }
}

$baseline    = Run-Baseline
$apiTouched  = Run-Touched $ApiBase
$siteTouched = Run-Touched $SiteBase

$modalJs = Invoke-WebRequest -Uri "$SiteBase/modal-injector.js?ts=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())" -Headers @{
  'Cache-Control' = 'no-cache'
  'Pragma'        = 'no-cache'
}
$modalPatched = ($modalJs.Content -match 'Tap one face to confirm the redeem event\.' -and $modalJs.Content -match 'setupTapOutClose\(modalId\);')

$report = [pscustomobject]@{
  baseline     = $baseline
  apiTouched   = $apiTouched
  siteTouched  = $siteTouched
  modalPatched = $modalPatched
}

$report | ConvertTo-Json -Depth 8

$errors = @()
$warnings = @()

if ($baseline.Host -ne 'navigen-api.4naama.workers.dev') {
  $errors += 'New promo QR URL is not using the API-host hotfix.'
}
if ($baseline.First -ne 'ok' -or $baseline.Second -ne 'used') {
  $errors += 'Baseline token lifecycle is wrong.'
}
if ($apiTouched.RedirectContract -ne 'pending-v2') {
  $errors += 'API /out/qr-redeem is not serving pending-v2.'
}
if ($apiTouched.First -ne 'ok' -or $apiTouched.Second -ne 'used') {
  $errors += 'Touching API /out/qr-redeem still burns or breaks the token.'
}
if (-not $modalPatched) {
  $errors += 'modal-injector.js does not contain the completed cashier modal patch.'
}

if ($siteTouched.RedirectContract -ne 'pending-v2') {
  $warnings += 'Site /out/qr-redeem is still not pending-v2. Old site-hosted promo QR URLs remain broken.'
}
if ($siteTouched.First -ne 'ok') {
  $warnings += 'Touching site /out/qr-redeem still burns or invalidates the token.'
}

if ($warnings.Count -gt 0) {
  Write-Warning ($warnings -join ' ')
}

if ($errors.Count -gt 0) {
  Write-Error ($errors -join ' ')
  exit 1
}

Write-Host 'PASS: new promo QR flow is healthy.'