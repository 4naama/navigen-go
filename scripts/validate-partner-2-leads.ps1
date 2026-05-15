$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Assert-Condition {
  param(
    [bool] $Condition,
    [string] $Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Get-RequiredSegment {
  param(
    [string] $Body,
    [string] $StartMarker,
    [string] $EndMarker
  )

  $start = $Body.IndexOf($StartMarker)
  Assert-Condition ($start -ge 0) "Missing start marker: $StartMarker"

  $end = $Body.IndexOf($EndMarker, $start)
  Assert-Condition ($end -gt $start) "Missing end marker after $StartMarker`: $EndMarker"

  return $Body.Substring($start, ($end + $EndMarker.Length) - $start)
}

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
$WorkerDir = Join-Path $RepoRoot "backend\worker"
$IndexPath = Join-Path $WorkerDir "src\index.ts"
$WranglerPath = Join-Path $WorkerDir "wrangler.toml"

Assert-Condition (Test-Path $IndexPath) "Missing backend\worker\src\index.ts."
Assert-Condition (Test-Path $WranglerPath) "Missing backend\worker\wrangler.toml."

$npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npx) {
  $npx = Get-Command npx -ErrorAction SilentlyContinue
}
Assert-Condition ($null -ne $npx) "npx was not found on PATH."

Push-Location $WorkerDir
try {
  $dryRunOutput = & $npx.Source wrangler deploy --dry-run --outdir .wrangler-dryrun 2>&1
  if ($LASTEXITCODE -ne 0) {
    $dryRunOutput | Out-String | Write-Host
    throw "wrangler dry-run failed."
  }
}
finally {
  Pop-Location
}

$index = Get-Content -Raw $IndexPath -ErrorAction SilentlyContinue
if ($null -eq $index) { $index = "" }

$wrangler = Get-Content -Raw $WranglerPath -ErrorAction SilentlyContinue
if ($null -eq $wrangler) { $wrangler = "" }

$leadBlock = Get-RequiredSegment `
  -Body $index `
  -StartMarker "// --- Partner-2 lead reservation helpers" `
  -EndMarker "// --- End Partner-2 lead reservation helpers"

$routeBlock = Get-RequiredSegment `
  -Body $index `
  -StartMarker "// --- Partner lead reservation: limited Partner-2 lead routes" `
  -EndMarker "// --- End Partner lead reservation routes"

Assert-Condition ($wrangler.Contains('PARTNER_ENABLED = "false"')) "Missing PARTNER_ENABLED=false default."
Assert-Condition ($wrangler.Contains('PARTNER_PUBLIC_LAUNCH_ENABLED = "false"')) "Missing PARTNER_PUBLIC_LAUNCH_ENABLED=false default."

Assert-Condition ($index.Contains('if (s === "partner_assisted" || s === "agent") return "partner_assisted";')) "Missing legacy agent to partner_assisted normalization."
Assert-Condition ($index.Contains('partner_assisted_route_required')) "Missing generic checkout guard for partner_assisted."

Assert-Condition ($leadBlock.Contains('type PartnerLeadStatus = "reserved" | "converted" | "expired" | "archived" | "rejected";')) "Missing Partner lead status type."
Assert-Condition ($leadBlock.Contains('type PartnerLeadRecord = {')) "Missing Partner lead record type."
Assert-Condition ($leadBlock.Contains('const PARTNER_LEAD_RESERVATION_DAYS = 30;')) "Missing 30-day Partner lead reservation window."
Assert-Condition ($leadBlock.Contains('function partnerLeadKey(leadId: string): string')) "Missing Partner lead KV key helper."
Assert-Condition ($leadBlock.Contains('function partnerLeadByFingerprintKey(fingerprint: string): string')) "Missing Partner lead duplicate fingerprint helper."
Assert-Condition ($leadBlock.Contains('async function requirePartnerSession(req: Request, env: Env): Promise<PartnerSessionResolution | Response>')) "Missing Partner session requirement helper."
Assert-Condition ($leadBlock.Contains('async function handlePartnerLeadList(req: Request, env: Env): Promise<Response>')) "Missing Partner lead list handler."
Assert-Condition ($leadBlock.Contains('async function handlePartnerLeadCreate(req: Request, env: Env): Promise<Response>')) "Missing Partner lead create handler."
Assert-Condition ($leadBlock.Contains('async function handlePartnerLeadRead(req: Request, env: Env, leadId: string): Promise<Response>')) "Missing Partner lead read handler."
Assert-Condition ($leadBlock.Contains('async function handlePartnerLeadArchive(req: Request, env: Env, leadId: string): Promise<Response>')) "Missing Partner lead archive handler."
Assert-Condition ($leadBlock.Contains('partner_lead_capacity_exceeded')) "Missing Partner lead capacity guard."
Assert-Condition ($leadBlock.Contains('duplicate_partner_lead')) "Missing duplicate Partner lead guard."
Assert-Condition ($leadBlock.Contains('reservationStakePaymentIntentId: ""')) "Missing separated reservation stake reference field."

Assert-Condition ($routeBlock.Contains('normPath === "/api/partner/leads" && req.method === "GET"')) "Missing GET /api/partner/leads route."
Assert-Condition ($routeBlock.Contains('normPath === "/api/partner/leads" && req.method === "POST"')) "Missing POST /api/partner/leads route."
Assert-Condition ($routeBlock.Contains('partnerLeadArchiveMatch')) "Missing Partner lead archive route matcher."
Assert-Condition ($routeBlock.Contains('partnerLeadDetailMatch')) "Missing Partner lead detail route matcher."

$forbiddenPartner2 = @(
  "STRIPE_SECRET_KEY",
  "createCampaignCheckoutSession",
  "/api/campaigns/checkout",
  "/api/owner/campaigns/checkout",
  "plan_selection",
  "ownership:",
  "op_sess",
  "partner_commission",
  "reservation-checkout",
  "/api/partner/handoff"
)

foreach ($bad in $forbiddenPartner2) {
  Assert-Condition (-not $leadBlock.Contains($bad)) "Partner-2 lead helper block contains forbidden boundary marker: $bad"
  Assert-Condition (-not $routeBlock.Contains($bad)) "Partner-2 lead route block contains forbidden boundary marker: $bad"
}

Assert-Condition (-not $index.Contains('initiationType === "agent"')) "Stale agent checkout allow-list remains."
Assert-Condition (-not $index.Contains('owner | agent | platform')) "Stale agent checkout comment remains."

Write-Host "PASS: Partner-2 lead reservation backend is present, isolated, and deployable."