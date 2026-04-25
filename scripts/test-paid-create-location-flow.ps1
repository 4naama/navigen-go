[CmdletBinding()]
param(
    [string]$ApiBase = "https://navigen-api.4naama.workers.dev",
    [string]$CheckoutReturnOrigin = "https://navigen-api.4naama.workers.dev",
    [string]$GooglePlaceId = "ChIJtdvhw0PdQUcRqgR0dqjJxmY",
    [string]$PlanCode = "standard",
    [string]$CampaignPreset = "visibility",
    [switch]$DoNotOpenBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-WebErrorText {
    param(
        [Parameter(Mandatory = $true)]
        [object]$ErrorRecord
    )

    $response = $null
    $currentException = $ErrorRecord.Exception

    while ($null -ne $currentException -and $null -eq $response) {
        $responseProperty = $currentException.PSObject.Properties["Response"]

        if ($null -ne $responseProperty -and $null -ne $responseProperty.Value) {
            $response = $responseProperty.Value
        }

        $currentException = $currentException.InnerException
    }

    if ($null -eq $response) {
        return [string]$ErrorRecord.Exception.Message
    }

    $responseText = ""

    try {
        $contentProperty = $response.PSObject.Properties["Content"]

        if ($null -ne $contentProperty -and $null -ne $contentProperty.Value) {
            $content = $contentProperty.Value

            if ($content -is [string]) {
                $responseText = $content
            }
            elseif ($content.PSObject.Methods["ReadAsStringAsync"]) {
                $responseText = $content.ReadAsStringAsync().GetAwaiter().GetResult()
            }
        }
    }
    catch {
        $responseText = ""
    }

    if ([string]::IsNullOrWhiteSpace($responseText)) {
        try {
            $streamMethod = $response.PSObject.Methods["GetResponseStream"]

            if ($null -ne $streamMethod) {
                $stream = $response.GetResponseStream()

                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseText = $reader.ReadToEnd()
                    $reader.Dispose()
                    $stream.Dispose()
                }
            }
        }
        catch {
            $responseText = ""
        }
    }

    if ([string]::IsNullOrWhiteSpace($responseText)) {
        $responseText = [string]$ErrorRecord.Exception.Message
    }

    return $responseText
}

function ConvertFrom-JsonStrict {
    param(
        [string]$Text,
        [string]$Label
    )

    try {
        return $Text | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        throw ("{0} returned non-JSON response: {1}" -f $Label, $Text)
    }
}

function Invoke-JsonPost {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [Parameter(Mandatory = $true)]
        [object]$Body,

        [Parameter(Mandatory = $true)]
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $bodyText = $Body | ConvertTo-Json -Depth 40 -Compress

    $headers = @{
        "accept"       = "application/json"
        "content-type" = "application/json"
        "origin"       = $CheckoutReturnOrigin
    }

    try {
        $response = Invoke-WebRequest `
            -Uri $Uri `
            -Method Post `
            -Headers $headers `
            -Body $bodyText `
            -WebSession $WebSession `
            -UseBasicParsing `
            -ErrorAction Stop

        $json = ConvertFrom-JsonStrict -Text ([string]$response.Content) -Label $Label

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Json       = $json
            Raw        = [string]$response.Content
        }
    }
    catch {
        $errorText = Get-WebErrorText -ErrorRecord $_
        throw ("{0} failed: {1}" -f $Label, $errorText)
    }
}

function Invoke-JsonGet {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [Parameter(Mandatory = $true)]
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $headers = @{
        "accept" = "application/json"
        "origin" = $CheckoutReturnOrigin
    }

    try {
        $response = Invoke-WebRequest `
            -Uri $Uri `
            -Method Get `
            -Headers $headers `
            -WebSession $WebSession `
            -MaximumRedirection 5 `
            -UseBasicParsing `
            -ErrorAction Stop

        $json = ConvertFrom-JsonStrict -Text ([string]$response.Content) -Label $Label

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Json       = $json
            Raw        = [string]$response.Content
        }
    }
    catch {
        $errorText = Get-WebErrorText -ErrorRecord $_
        throw ("{0} failed: {1}" -f $Label, $errorText)
    }
}

function Get-OptionalPropertyValue {
    param(
        [object]$Source,

        [Parameter(Mandatory = $true)]
        [string[]]$PropertyPath
    )

    $currentValue = $Source

    foreach ($propertyName in $PropertyPath) {
        if ($null -eq $currentValue) {
            return $null
        }

        $property = $currentValue.PSObject.Properties[$propertyName]

        if ($null -eq $property) {
            return $null
        }

        $currentValue = $property.Value
    }

    return $currentValue
}

function Assert-Text {
    param(
        [string]$Value,
        [string]$Label
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw ("Missing required value: {0}" -f $Label)
    }

    return $Value.Trim()
}

$apiBaseClean = $ApiBase.Trim().TrimEnd("/")
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$endDate = (Get-Date).ToUniversalTime().AddDays(30).ToString("yyyy-MM-dd")
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
$campaignKey = "p8-paid-create-location-test-$stamp"

Write-Host "Testing paid create-location flow against:"
Write-Host ("  API: {0}" -f $apiBaseClean)
Write-Host ("  Checkout return origin: {0}" -f $CheckoutReturnOrigin)
Write-Host ("  Google place_id: {0}" -f $GooglePlaceId)
Write-Host ""

$draftResult = Invoke-JsonPost `
    -Uri "$apiBaseClean/api/location/draft" `
    -WebSession $session `
    -Label "location draft create" `
    -Body @{
        googlePlaceId = $GooglePlaceId
        draft = @{}
    }

$draftULID = Assert-Text -Value ([string]$draftResult.Json.draftULID) -Label "draftULID"
$draftSessionId = Assert-Text -Value ([string]$draftResult.Json.draftSessionId) -Label "draftSessionId"

Write-Host "PASS draft created"
Write-Host ("  draftULID: {0}" -f $draftULID)
Write-Host ("  draftSessionId: {0}" -f $draftSessionId)

$checkoutBody = @{
    draftULID = $draftULID
    draftSessionId = $draftSessionId
    planCode = $PlanCode
    campaignPreset = $CampaignPreset
    draft = @{
        campaignKey = $campaignKey
        campaignName = "P8 paid create-location test"
        productName = "Saboré"
        campaignType = "visibility"
        targetChannels = @("listing")
        offerType = "none"
        discountKind = "none"
        campaignDiscountValue = $null
        eligibilityType = "all"
        eligibilityNotes = ""
        utmSource = "p8-test"
        utmMedium = "powershell"
        utmCampaign = $campaignKey
        startDate = $today
        endDate = $endDate
        campaignScope = "single"
        campaignPreset = $CampaignPreset
        planCode = $PlanCode
        selectedLocationULIDs = @()
    }
}

$checkoutResult = Invoke-JsonPost `
    -Uri "$apiBaseClean/api/campaigns/checkout" `
    -WebSession $session `
    -Label "campaign checkout create" `
    -Body $checkoutBody

$checkoutSessionId = Assert-Text -Value ([string]$checkoutResult.Json.sessionId) -Label "checkout session id"
$checkoutUrl = Assert-Text -Value ([string]$checkoutResult.Json.url) -Label "checkout url"

Write-Host "PASS checkout session created"
Write-Host ("  sessionId: {0}" -f $checkoutSessionId)
Write-Host ""
Write-Host "Open and pay this Checkout URL:"
Write-Host $checkoutUrl
Write-Host ""

if (-not $DoNotOpenBrowser) {
    Start-Process $checkoutUrl
}

Read-Host "Complete the Stripe payment, then press Enter here"

$nextPath = "/api/_diag/opsess"
$exchangeUrl = "$apiBaseClean/owner/stripe-exchange?sid=$([uri]::EscapeDataString($checkoutSessionId))&next=$([uri]::EscapeDataString($nextPath))"

$exchangeResult = Invoke-JsonGet `
    -Uri $exchangeUrl `
    -WebSession $session `
    -Label "owner stripe exchange"

$exchangeUlid = [string](Get-OptionalPropertyValue -Source $exchangeResult.Json -PropertyPath @("ulid"))
$kvHit = [bool](Get-OptionalPropertyValue -Source $exchangeResult.Json -PropertyPath @("kvHit"))

if ($exchangeUlid -ne $draftULID -or -not $kvHit) {
    throw ("Owner exchange did not establish expected owner session. Expected ulid {0}, got {1}, kvHit {2}." -f $draftULID, $exchangeUlid, $kvHit)
}

Write-Host "PASS paid owner session established"
Write-Host ("  owner ulid: {0}" -f $exchangeUlid)

$hydrateResult = Invoke-JsonPost `
    -Uri "$apiBaseClean/api/location/hydrate" `
    -WebSession $session `
    -Label "location hydrate" `
    -Body @{
        draftULID = $draftULID
        draftSessionId = $draftSessionId
    }

$ok = [bool](Get-OptionalPropertyValue -Source $hydrateResult.Json -PropertyPath @("ok"))
$hydrated = [bool](Get-OptionalPropertyValue -Source $hydrateResult.Json -PropertyPath @("hydrated"))

if (-not $ok -or -not $hydrated) {
    $errorCode = [string](Get-OptionalPropertyValue -Source $hydrateResult.Json -PropertyPath @("error", "code"))
    throw ("Hydration did not complete. ok={0}; hydrated={1}; error={2}; raw={3}" -f $ok, $hydrated, $errorCode, $hydrateResult.Raw)
}

$draft = Get-OptionalPropertyValue -Source $hydrateResult.Json -PropertyPath @("draft")
$name = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("listedName"))
$address = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("contactInformation", "address"))
$phone = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("contactInformation", "phone"))
$website = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("links", "official"))
$mapsUrl = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("links", "googleMaps"))
$rating = [string](Get-OptionalPropertyValue -Source $draft -PropertyPath @("google", "rating"))

Write-Host "PASS paid Google hydration completed"
Write-Host ("  name: {0}" -f $name)
Write-Host ("  address present: {0}" -f (-not [string]::IsNullOrWhiteSpace($address)))
Write-Host ("  phone present: {0}" -f (-not [string]::IsNullOrWhiteSpace($phone)))
Write-Host ("  website present: {0}" -f (-not [string]::IsNullOrWhiteSpace($website)))
Write-Host ("  googleMaps present: {0}" -f (-not [string]::IsNullOrWhiteSpace($mapsUrl)))
Write-Host ("  rating present: {0}" -f (-not [string]::IsNullOrWhiteSpace($rating)))

$outFile = Join-Path (Get-Location) "paid-create-location-flow-result.json"
$hydrateResult.Raw | Set-Content -Path $outFile -Encoding UTF8

Write-Host ""
Write-Host "PASS paid create-location flow test completed."
Write-Host ("Saved hydration response: {0}" -f $outFile)
exit 0