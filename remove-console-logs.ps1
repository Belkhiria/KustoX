# Script to remove console.log statements from TypeScript files
# This script will remove lines that contain only console.log statements

$srcPath = ".\src"
$tsFiles = Get-ChildItem -Path $srcPath -Recurse -Filter "*.ts"

foreach ($file in $tsFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content -Path $file.FullName
    $newContent = @()
    
    foreach ($line in $content) {
        # Skip lines that are only console.log statements (with optional indentation)
        if ($line -notmatch '^\s*console\.log\(.*\);\s*$') {
            $newContent += $line
        } else {
            Write-Host "  Removing: $line"
        }
    }
    
    # Write back to file only if there were changes
    if ($newContent.Count -ne $content.Count) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "  Updated file with $($content.Count - $newContent.Count) lines removed"
    }
}

Write-Host "Console.log cleanup complete!"
