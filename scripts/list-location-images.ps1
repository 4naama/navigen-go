# base directory where your location folders live
$basePath = (Resolve-Path ".\frontend\public\assets\location-profile-images").Path

Get-ChildItem -Path $basePath -Directory |
    Sort-Object Name |
    ForEach-Object {
        $folder = $_
        $folderName = $folder.Name

        Get-ChildItem -Path $folder.FullName -File -Include *.jpg,*.jpeg,*.png,*.webp |
            Sort-Object Name |
            ForEach-Object {
                "/assets/location-profile-images/$folderName/$($_.Name)"
            }
    }
