param(
  [Parameter(Mandatory = $true)]
  [string[]]$Paths
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Clean-Text {
  param([string]$Text)
  # Remove ASCII control chars except: tab(9), LF(10), CR(13)
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $Text.ToCharArray()) {
    $code = [int][char]$ch
    if ($code -lt 32) {
      if ($code -eq 9 -or $code -eq 10 -or $code -eq 13) {
        [void]$sb.Append($ch)
      }
      else {
        # drop
      }
    }
    else {
      [void]$sb.Append($ch)
    }
  }
  return $sb.ToString()
}

$changed = 0
foreach ($p in $Paths) {
  if (-not (Test-Path -LiteralPath $p)) {
    Write-Warning "Skip missing: $p"
    continue
  }
  $raw = Get-Content -LiteralPath $p -Raw -Encoding UTF8
  $clean = Clean-Text -Text $raw
  if ($clean -ne $raw) {
    Set-Content -LiteralPath $p -Value $clean -Encoding UTF8
    Write-Host "Cleaned: $p"
    $changed++
  }
}

Write-Host "Done. Files changed: $changed"

