# 1. Detect IPv4 Address
$allIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notmatch "^127\." -and 
    $_.IPAddress -notmatch "^169\.254" 
}

$selectedIP = $null

# Priority: Wi-Fi, then Ethernet, then first available
$selectedIP = ($allIPs | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1).IPAddress
if (-not $selectedIP) {
    $selectedIP = ($allIPs | Where-Object { $_.InterfaceAlias -like "*Ethernet*" } | Select-Object -First 1).IPAddress
}
if (-not $selectedIP) {
    $selectedIP = ($allIPs | Select-Object -First 1).IPAddress
}

if (-not $selectedIP) {
    $selectedIP = "127.0.0.1"
    Write-Output "Warning: No network IP found, using 127.0.0.1"
} else {
    Write-Output "Detected Local IP: $selectedIP"
}

$backendUrl = "http://$($selectedIP):3000"
Write-Output "Target Backend URL: $backendUrl"

# 2. Update Mobile config
$mobileFile = "f:\NFC_Inventory\nfc-inventory-mobile\src\api.ts"
if (Test-Path $mobileFile) {
    $content = Get-Content $mobileFile -Raw
    $regex = 'const API_URL = "http://[^"]*";'
    $replace = 'const API_URL = "' + $backendUrl + '";'
    $newContent = $content -replace $regex, $replace
    Set-Content -Path $mobileFile -Value $newContent
    Write-Output "Updated Mobile: $mobileFile"
}

# 3. Update Web config
$webFile = "f:\NFC_Inventory\nfc-inventory-web\vite.config.ts"
if (Test-Path $webFile) {
    $content = Get-Content $webFile -Raw
    $regex = "target: 'http://[^']*'"
    $replace = "target: '$backendUrl'"
    $newContent = $content -replace $regex, $replace
    Set-Content -Path $webFile -Value $newContent
    Write-Output "Updated Web Proxy: $webFile"
}

Write-Output "Network configuration complete."
