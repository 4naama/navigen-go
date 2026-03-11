[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$slug   = "hd-budakeszi-7088"
$site   = "https://navigen.io"
$worker = "https://navigen-api.4naama.workers.dev"

function New-HttpClient([bool]$AllowRedirect) {
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $AllowRedirect

  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(30)

  $cache = [System.Net.Http.Headers.CacheControlHeaderValue]::new()
  $cache.NoCache = $true
  $cache.NoStore = $true
  $client.DefaultRequestHeaders.CacheControl = $cache

  [pscustomobject]@{
    Client  = $client
    Handler = $handler
  }
}

function Get-Redirect([string]$Url) {
  $http = New-HttpClient $false
  try {
    $resp = $http.Client.GetAsync($Url).GetAwaiter().GetResult()

    $headers = @{}
    foreach ($h in $resp.Headers) {
      $headers[$h.Key] = ($h.Value -join ', ')
    }
    foreach ($h in $resp.Content.Headers) {
      $headers[$h.Key] = ($h.Value -join ', ')
    }

    [pscustomobject]@{
      StatusCode = [int]$resp.StatusCode
      Location   = if ($resp.Headers.Location) { $resp.Headers.Location.ToString() } else { "" }
      Headers    = $headers
    }
  }
  finally {
    $http.Client.Dispose()
    $http.Handler.Dispose()
  }
}

function Resolve-AbsoluteUrl([string]$BaseUrl, [string]$MaybeRelativeUrl) {
  if ([string]::IsNullOrWhiteSpace($MaybeRelativeUrl)) { return "" }

  try {
    return ([System.Uri]::new([System.Uri]$BaseUrl, $MaybeRelativeUrl)).AbsoluteUri
  }
  catch {
    return $MaybeRelativeUrl
  }
}

function Parse-Query([string]$Url) {
  $map = @{}
  if ([string]::IsNullOrWhiteSpace($Url)) { return $map }

  try {
    $raw = ([System.Uri]$Url).Query.TrimStart('?')
  }
  catch {
    return $map
  }

  foreach ($pair in ($raw -split '&')) {
    if ([string]::IsNullOrWhiteSpace($pair)) { continue }

    $kv = $pair -split '=', 2
    $k = [uri]::UnescapeDataString($kv[0])
    $v = if ($kv.Count -gt 1) { [uri]::UnescapeDataString($kv[1]) } else { "" }

    $map[$k] = $v
  }

  return $map
}

function New-FreshRedeemCase([string]$Slug, [string]$Site, [string]$Worker) {
  $status = Invoke-RestMethod -Method GET "$Site/api/status?locationID=$([uri]::EscapeDataString($Slug))"
  $camp   = [string]$status.activeCampaignKey
  if (-not $camp) {
    throw "No activeCampaignKey returned for $Slug"
  }

  $promo = Invoke-RestMethod -Method GET "$Site/api/promo-qr?locationID=$([uri]::EscapeDataString($Slug))&campaignKey=$([uri]::EscapeDataString($camp))"
  $qrUrl = [string]$promo.qrUrl
  $rt    = ([regex]::Match($qrUrl, '[?&]rt=([^&]+)').Groups[1].Value)

  if (-not $rt) {
    throw "promo-qr returned no rt in qrUrl"
  }

  $summary = Invoke-RestMethod -Method GET "$Worker/api/campaign-summary?locationID=$([uri]::EscapeDataString($Slug))&campaignKey=$([uri]::EscapeDataString($camp))"
  $ulid    = [string]$summary.locationULID

  if (-not $ulid) {
    throw "campaign-summary returned no locationULID"
  }

  [pscustomobject]@{
    Slug        = $Slug
    CampaignKey = $camp
    QrUrl       = $qrUrl
    Rt          = $rt
    Ulid        = $ulid
  }
}

function Invoke-RedeemTruth([string]$Worker, [string]$Ulid, [string]$Rt) {
  Invoke-RestMethod -Method POST "$Worker/hit/qr-redeem/$([uri]::EscapeDataString($Ulid))?rt=$([uri]::EscapeDataString($Rt))&json=1"
}

function Test-RedeemRoute([string]$Label, [string]$Url, [string]$Worker, [string]$Ulid, [string]$Rt) {
  $redir = Get-Redirect $Url
  $resolvedLocation = Resolve-AbsoluteUrl -BaseUrl $Url -MaybeRelativeUrl $redir.Location
  $qp = Parse-Query $resolvedLocation

  $first  = Invoke-RedeemTruth -Worker $Worker -Ulid $Ulid -Rt $Rt
  $second = Invoke-RedeemTruth -Worker $Worker -Ulid $Ulid -Rt $Rt

  [pscustomobject]@{
    Route             = $Label
    Url               = $Url
    Status            = $redir.StatusCode
    RawLocation       = $redir.Location
    ResolvedLocation  = $resolvedLocation
    RedeemParam       = $qp['redeem']
    RedeemedParam     = $qp['redeemed']
    RtParam           = $qp['rt']
    ContractHeader    = $redir.Headers['X-NG-Redeem-Contract']
    BuildHeader       = $redir.Headers['X-NG-Redeem-Build']
    FirstOutcome      = [string]$first.outcome
    SecondOutcome     = [string]$second.outcome
  }
}

$casePages = New-FreshRedeemCase -Slug $slug -Site $site -Worker $worker
$pages = Test-RedeemRoute -Label "pages" -Url $casePages.QrUrl -Worker $worker -Ulid $casePages.Ulid -Rt $casePages.Rt

$caseApi = New-FreshRedeemCase -Slug $slug -Site $site -Worker $worker
$apiUrl = "$worker/out/qr-redeem/$([uri]::EscapeDataString($caseApi.Slug))?camp=$([uri]::EscapeDataString($caseApi.CampaignKey))&rt=$([uri]::EscapeDataString($caseApi.Rt))"
$api = Test-RedeemRoute -Label "api" -Url $apiUrl -Worker $worker -Ulid $caseApi.Ulid -Rt $caseApi.Rt

Write-Host ""
Write-Host "=== redeem route split proof ==="
@($pages, $api) | Format-List

Write-Host ""
Write-Host "=== diagnosis ==="
if ($pages.FirstOutcome -eq 'used' -and $api.FirstOutcome -eq 'ok') {
  Write-Host "- Pages route is still old. API worker route is healthy."
} elseif ($pages.FirstOutcome -eq 'used' -and $api.FirstOutcome -eq 'used') {
  Write-Host "- Both Pages and API redeem routes are still old or both are still consuming on GET."
} elseif ($pages.FirstOutcome -eq 'ok' -and $api.FirstOutcome -eq 'ok') {
  Write-Host "- Both redeem routes are healthy. Move to static asset verification."
} else {
  Write-Host "- Mixed result. Inspect the Route blocks above."
}