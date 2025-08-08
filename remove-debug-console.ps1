# Script to remove debug console statements from TypeScript files
# This script will remove debug-style console statements but keep essential error logging

$srcPath = ".\src"
$tsFiles = Get-ChildItem -Path $srcPath -Recurse -Filter "*.ts"

foreach ($file in $tsFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content -Path $file.FullName
    $newContent = @()
    $linesRemoved = 0
    
    foreach ($line in $content) {
        # Remove debug console statements (those with emojis or debug symbols)
        if ($line -match '^\s*console\.(log|error|warn)\(.*[🔍🚨❌✅📊📋📄🔧📝]\s*.*\);\s*$') {
            Write-Host "  Removing debug line: $line"
            $linesRemoved++
        } 
        # Remove console statements that are clearly debug (multiple arguments, detailed error object inspection)
        elseif ($line -match '^\s*console\.error\(.*Error (type|constructor|object|string|message).*\);\s*$') {
            Write-Host "  Removing debug error line: $line"
            $linesRemoved++
        }
        # Remove multi-argument debug console statements
        elseif ($line -match '^\s*console\.(error|warn)\(.*,.*,.*\);\s*$') {
            Write-Host "  Removing multi-arg debug line: $line"
            $linesRemoved++
        }
        else {
            $newContent += $line
        }
    }
    
    # Write back to file only if there were changes
    if ($linesRemoved -gt 0) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "  Updated file with $linesRemoved lines removed"
    }
}

Write-Host "Debug console cleanup complete!"
