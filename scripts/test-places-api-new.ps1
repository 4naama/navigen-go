[CmdletBinding()]
param(
    [string]$TextQuery = "Google Sydney",
    [string]$PlaceId = "",
    [switch]$SkipHydrationDetails,
    [string]$ApiKey = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-SecurePrompt {
    param(
        [Parameter(Mandatory = $true)]
        [securestring]$SecureValue
    )

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)

    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

function Get-PlacesApiKey {
    param(
        [string]$ProvidedApiKey = ""
    )

    $key = $ProvidedApiKey
    $sourceLabel = "command parameter"

    if ([string]::IsNullOrWhiteSpace($key)) {
        $key = Read-Host "Paste raw GOOGLE_PLACES_API_KEY value"
        $sourceLabel = "prompt"
    }

    if ($null -eq $key) {
        $key = ""
    }

    $rawLength = ([string]$key).Length
    $cleanKey = [string]$key
    $cleanKey = $cleanKey -replace '[\x00-\x1F\x7F\u200B-\u200F\uFEFF]', ''
    $cleanKey = $cleanKey.Trim()

    $quoteChars = [char[]]@([char]34, [char]39)
    $cleanKey = $cleanKey.Trim($quoteChars).Trim()

    if ([string]::IsNullOrWhiteSpace($cleanKey)) {
        throw ("GOOGLE_PLACES_API_KEY is empty after reading from {0}. Paste only the raw API key value from Google Cloud." -f $sourceLabel)
    }

    if ($cleanKey -notmatch '^[A-Za-z0-9_-]+$') {
        throw ("GOOGLE_PLACES_API_KEY read from {0} contains non-key characters. Paste only the raw API key value, not GOOGLE_PLACES_API_KEY=..., JSON, quotes, a label, or a URL." -f $sourceLabel)
    }

    Write-Host ("Loaded GOOGLE_PLACES_API_KEY from {0}; raw length: {1}; sanitized length: {2}." -f $sourceLabel, $rawLength, $cleanKey.Length)

    return $cleanKey
}

function ConvertTo-JsonText {
    param(
        [object]$Value
    )

    if ($null -eq $Value) {
        return $null
    }

    return $Value | ConvertTo-Json -Depth 30 -Compress
}

function ConvertFrom-JsonSafe {
    param(
        [string]$Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    try {
        return $Text | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return $null
    }
}

function Invoke-PlacesApiRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("GET", "POST")]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [Parameter(Mandatory = $true)]
        [string]$ApiKey,

        [Parameter(Mandatory = $true)]
        [string]$FieldMask,

        [object]$Body = $null
    )

    $headers = @{
        "X-Goog-Api-Key"   = $ApiKey
        "X-Goog-FieldMask" = $FieldMask
    }

    $bodyText = ConvertTo-JsonText -Value $Body

    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest `
                -Method Get `
                -Uri $Uri `
                -Headers $headers `
                -UseBasicParsing `
                -ErrorAction Stop
        }
        else {
            $response = Invoke-WebRequest `
                -Method Post `
                -Uri $Uri `
                -Headers $headers `
                -ContentType "application/json" `
                -Body $bodyText `
                -UseBasicParsing `
                -ErrorAction Stop
        }

        $responseText = [string]$response.Content

        return [pscustomobject]@{
            Ok         = $true
            StatusCode = [int]$response.StatusCode
            BodyText   = $responseText
            Json       = ConvertFrom-JsonSafe -Text $responseText
        }
    }
    catch {
        $statusCode = 0
        $responseText = ""
        $response = $null
        $currentException = $_.Exception

        while ($null -ne $currentException -and $null -eq $response) {
            $responseProperty = $currentException.PSObject.Properties["Response"]

            if ($null -ne $responseProperty -and $null -ne $responseProperty.Value) {
                $response = $responseProperty.Value
            }

            $currentException = $currentException.InnerException
        }

        if ($null -ne $response) {
            try {
                $statusCodeProperty = $response.PSObject.Properties["StatusCode"]

                if ($null -ne $statusCodeProperty -and $null -ne $statusCodeProperty.Value) {
                    $statusCode = [int]$statusCodeProperty.Value
                }
            }
            catch {
                $statusCode = 0
            }

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
        }

        if ([string]::IsNullOrWhiteSpace($responseText)) {
            $responseText = [string]$_.Exception.Message
        }

        return [pscustomobject]@{
            Ok         = $false
            StatusCode = $statusCode
            BodyText   = $responseText
            Json       = ConvertFrom-JsonSafe -Text $responseText
        }
    }
}

function Get-PlacesErrorSummary {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Result
    )

    $status = ""
    $message = ""

    if ($Result.Json -and $Result.Json.error) {
        $status = [string]$Result.Json.error.status
        $message = [string]$Result.Json.error.message
    }
    elseif ($Result.Json -and $Result.Json.status) {
        $status = [string]$Result.Json.status
        $message = [string]$Result.Json.error_message
    }
    else {
        $message = [string]$Result.BodyText
    }

    if ($message.Length -gt 900) {
        $message = $message.Substring(0, 900) + "..."
    }

    return ("HTTP {0} {1} {2}" -f $Result.StatusCode, $status, $message).Trim()
}

function Assert-PlacesApiResult {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Result,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if (-not $Result.Ok) {
        Write-Host ("FAIL {0}" -f $Label)
        Write-Host (Get-PlacesErrorSummary -Result $Result)
        exit 1
    }

    Write-Host ("PASS {0} HTTP {1}" -f $Label, $Result.StatusCode)
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

function Get-FirstReturnedPlaceId {
    param(
        [Parameter(Mandatory = $true)]
        [object]$SearchJson
    )

    $places = Get-OptionalPropertyValue -Source $SearchJson -PropertyPath @("places")

    if ($null -eq $places) {
        return ""
    }

    $placeList = @($places)

    if ($placeList.Count -lt 1) {
        return ""
    }

    $firstPlace = $placeList[0]

    return [string](Get-OptionalPropertyValue -Source $firstPlace -PropertyPath @("id"))
}

function Get-ValuePresenceText {
    param(
        [object]$Value
    )

    if ($null -eq $Value) {
        return "no"
    }

    if ($Value -is [string] -and [string]::IsNullOrWhiteSpace($Value)) {
        return "no"
    }

    return "yes"
}

$key = Get-PlacesApiKey -ProvidedApiKey $ApiKey

Write-Host "Testing Google Places API New. The API key value will not be printed."
Write-Host ("Lookup query: {0}" -f $TextQuery)

$searchFieldMask = "places.id"
$searchBody = @{
    textQuery      = $TextQuery
    maxResultCount = 1
}

$searchResult = Invoke-PlacesApiRequest `
    -Method "POST" `
    -Uri "https://places.googleapis.com/v1/places:searchText" `
    -ApiKey $key `
    -FieldMask $searchFieldMask `
    -Body $searchBody

Assert-PlacesApiResult -Result $searchResult -Label "Text Search New ID-only lookup"

$foundPlaceId = Get-FirstReturnedPlaceId -SearchJson $searchResult.Json

if ([string]::IsNullOrWhiteSpace($foundPlaceId)) {
    Write-Host "FAIL Text Search New returned no place id."
    exit 1
}

Write-Host ("PASS ID-only lookup returned place id: {0}" -f $foundPlaceId)

$effectivePlaceId = $PlaceId.Trim()

if ([string]::IsNullOrWhiteSpace($effectivePlaceId)) {
    $effectivePlaceId = $foundPlaceId
}

if ($SkipHydrationDetails) {
    Write-Host "PASS Places API New ID-only lookup is operational. Hydration field test was skipped."
    exit 0
}

$hydrationFieldMask = @(
    "id",
    "displayName",
    "formattedAddress",
    "addressComponents",
    "location",
    "websiteUri",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "rating",
    "userRatingCount",
    "businessStatus",
    "types",
    "googleMapsUri"
) -join ","

$detailsUri = "https://places.googleapis.com/v1/places/$effectivePlaceId"

$detailsResult = Invoke-PlacesApiRequest `
    -Method "GET" `
    -Uri $detailsUri `
    -ApiKey $key `
    -FieldMask $hydrationFieldMask

Assert-PlacesApiResult -Result $detailsResult -Label "Place Details New hydration field mask"

$place = $detailsResult.Json
$placeIdValue = [string](Get-OptionalPropertyValue -Source $place -PropertyPath @("id"))
$displayName = [string](Get-OptionalPropertyValue -Source $place -PropertyPath @("displayName", "text"))
$formattedAddress = [string](Get-OptionalPropertyValue -Source $place -PropertyPath @("formattedAddress"))
$locationValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("location")
$websiteUriValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("websiteUri")
$internationalPhoneNumberValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("internationalPhoneNumber")
$nationalPhoneNumberValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("nationalPhoneNumber")
$phoneValue = @($internationalPhoneNumberValue, $nationalPhoneNumberValue) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -First 1
$ratingValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("rating")
$googleMapsUriValue = Get-OptionalPropertyValue -Source $place -PropertyPath @("googleMapsUri")

if ([string]::IsNullOrWhiteSpace($placeIdValue)) {
    Write-Host "FAIL Place Details New did not return id."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($displayName)) {
    Write-Host "FAIL Place Details New did not return displayName.text."
    exit 1
}

Write-Host "Hydration sample:"
Write-Host ("  id: {0}" -f $placeIdValue)
Write-Host ("  displayName.text: {0}" -f $displayName)
Write-Host ("  formattedAddress present: {0}" -f (Get-ValuePresenceText -Value $formattedAddress))
Write-Host ("  location present: {0}" -f (Get-ValuePresenceText -Value $locationValue))
Write-Host ("  websiteUri present: {0}" -f (Get-ValuePresenceText -Value $websiteUriValue))
Write-Host ("  phone present: {0}" -f (Get-ValuePresenceText -Value $phoneValue))
Write-Host ("  rating present: {0}" -f (Get-ValuePresenceText -Value $ratingValue))
Write-Host ("  googleMapsUri present: {0}" -f (Get-ValuePresenceText -Value $googleMapsUriValue))

Write-Host "PASS Places API New is operational for ID-only lookup and paid hydration fields."
exit 0