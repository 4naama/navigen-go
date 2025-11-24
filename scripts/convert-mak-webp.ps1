# convert-mak-webp.ps1
# Convert all .webp images in mak-restaurant-8055 to .jpg using ImageMagick

# Resolve the mak-restaurant-8055 image directory
$makDir = (Resolve-Path ".\frontend\public\assets\location-profile-images\mak-restaurant-8055").Path

# Make sure ImageMagick's 'magick' is available
$magickCmd = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magickCmd) {
    Write-Error "The 'magick' command (ImageMagick) is not available. Please install ImageMagick and ensure 'magick' is on PATH."
    return
}

Get-ChildItem -Path $makDir -Filter *.webp | ForEach-Object {
    $srcPath = $_.FullName
    $dstPath = [System.IO.Path]::ChangeExtension($srcPath, ".jpg")  # change to .png if you prefer

    Write-Host "Converting $srcPath -> $dstPath"
    & $magickCmd.Source $srcPath $dstPath

    # Optionally delete the original .webp after successful conversion:
    # if (Test-Path $dstPath) { Remove-Item $srcPath }
}
