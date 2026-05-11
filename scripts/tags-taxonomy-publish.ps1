param(
  [string]$TagsPath = ".\frontend\public\data\tags.json",
  [string]$Source = "repo-tags-json",
  [string]$BaseUrl = "https://navigen-api.4naama.workers.dev"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TagsPath)) {
  throw "Tags file not found: $TagsPath"
}

if (-not $env:NAVIGEN_ADMIN_TOKEN) {
  throw "Set NAVIGEN_ADMIN_TOKEN before publishing tags"
}

$raw = Get-Content -Raw $TagsPath

try {
  $json = $raw | ConvertFrom-Json
} catch {
  throw "tags.json is not valid JSON: $($_.Exception.Message)"
}

$payload = @{
  source = $Source
  tagGroups = @($json.tagGroups)
} | ConvertTo-Json -Depth 100

$uri = $BaseUrl.TrimEnd("/") + "/api/admin/structure/publish-tags"

$response = Invoke-RestMethod `
  -Method Post `
  -Uri $uri `
  -Headers @{
    Authorization = "Bearer $env:NAVIGEN_ADMIN_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body $payload

if ($response.ok -ne $true) {
  throw "Tags publish failed"
}

if (-not $response.manifest -or [int]$response.manifest.count -lt 1) {
  throw "Tags publish returned no tag count"
}

Write-Host "STR-TAGS-1 tags publish passed."
Write-Host ("Runtime key: {0}" -f $response.key)
Write-Host ("Tag groups: {0}" -f $response.tagGroupCount)
Write-Host ("Tags: {0}" -f $response.tagCount)