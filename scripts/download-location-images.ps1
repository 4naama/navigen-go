# download-location-images.ps1
# Scrape up to 7 images from each venue's site and save into its folder
# under frontend/public/assets/location-profile-images

# Resolve base image directory inside the repo
$basePath = (Resolve-Path ".\frontend\public\assets\location-profile-images").Path

# Map each folder to its official website URL
$locations = @(
    @{ Name = "costes-restaurant-2236";       Url = "https://www.costesrestaurant.hu/" },
    @{ Name = "costes-downtown-8498";        Url = "https://costesdowntown.hu/" },
    @{ Name = "rumour-by-racz-jeno-0603";    Url = "https://rumour.restaurant/" },
    @{ Name = "mak-restaurant-8055";         Url = "https://mak.hu/" },
    @{ Name = "kismezo-budapest-9912";       Url = "https://kismezo.hu/" },
    @{ Name = "platan-gourmet-restaurant-8179"; Url = "https://platangourmet.com/" },
    @{ Name = "vibe-budapest-7954";          Url = "https://vibebudapest.com/" },
    @{ Name = "lupa-event-hall-1118";        Url = "https://costes.group/hu/lupa-event-hall/" },
    @{ Name = "costes-catering-0409";        Url = "https://costes.catering/en" }
)

# How many images you want per location (max)
$imagesPerLocation = 7

foreach ($loc in $locations) {
    $folderName = $loc.Name
    $url        = $loc.Url

    Write-Host "Processing $folderName from $url"

    $targetDir = Join-Path -Path $basePath -ChildPath $folderName
    if (-not (Test-Path -LiteralPath $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
    }

    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    }
    catch {
        Write-Warning "Failed to load $url : $_"
        continue
    }

    # Collect image sources: try response.Images, then regex on HTML, then filter out obvious junk
    $imageSrcs = @()

    if ($response.Images) {
        $imageSrcs = $response.Images |
            ForEach-Object { $_.src } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and $_ -match '\.(jpg|jpeg|png|webp)' }
    }

    if (-not $imageSrcs -or $imageSrcs.Count -eq 0) {
        # Fallback: regex over the raw HTML
        $pattern = "src=['""]([^'""]+\.(?:jpg|jpeg|png|webp))['""]"
        $matches = Select-String -InputObject $response.Content -Pattern $pattern -AllMatches

        if ($matches) {
            $imageSrcs = $matches.Matches |
                ForEach-Object { $_.Groups[1].Value }
        }
    }

    # Filter out obvious non-hero assets (logos, flags, payment banners, icons, etc.)
    if ($imageSrcs) {
        $imageSrcs = $imageSrcs |
            Where-Object {
                ($_ -match '\.(jpg|jpeg|png|webp)') -and
                ($_ -notmatch 'logo') -and
                ($_ -notmatch 'flag') -and
                ($_ -notmatch 'cib') -and
                ($_ -notmatch 'visa') -and
                ($_ -notmatch 'mastercard') -and
                ($_ -notmatch 'icon')
            }
    }

    if (-not $imageSrcs -or $imageSrcs.Count -eq 0) {
        Write-Warning "No images found on $url"
        continue
    }

    # Take first N image srcs (no extra normalization/deduping)
    $toDownload = $imageSrcs | Select-Object -First $imagesPerLocation

    $baseUri = [Uri]$url
    $index   = 1

    foreach ($src in $toDownload) {
        if ([string]::IsNullOrWhiteSpace($src)) {
            continue
        }

        # Build an absolute URL from src (minimal requirement so download works)
        $imgUrl = $null
        if ($src -like "http*") {
            $imgUrl = $src
        }
        elseif ($src.StartsWith("//")) {
            $imgUrl = "https:$src"
        }
        else {
            try {
                $imgUrl = (New-Object System.Uri($baseUri, $src)).AbsoluteUri
            }
            catch {
                continue
            }
        }

        if (-not $imgUrl) {
            continue
        }

        # Simple file naming – API just needs files present
        $ext = [System.IO.Path]::GetExtension(($imgUrl.Split("?")[0]))
        if (-not $ext) { $ext = ".jpg" }

        $fileName = "img-{0:00}{1}" -f $index, $ext
        $outPath  = Join-Path -Path $targetDir -ChildPath $fileName

        try {
            Write-Host "  -> Downloading $imgUrl to $fileName"
            Invoke-WebRequest -Uri $imgUrl -OutFile $outPath -UseBasicParsing
        }
        catch {
            Write-Warning "  !! Failed to download $imgUrl : $_"
        }

        $index++
    }
}
