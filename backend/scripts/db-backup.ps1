param(
  [string]$ContainerName = "ltnwc_postgres",
  [string]$DbName = "shopdb",
  [string]$DbUser = "shopuser",
  [string]$OutputDir = "./backups",
  [ValidateRange(3, 7)]
  [int]$RetentionCount = 7
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$outputFile = Join-Path $OutputDir ("{0}_{1}.sql" -f $DbName, $timestamp)

Write-Host "Creating backup: $outputFile"

docker exec $ContainerName pg_dump -U $DbUser -d $DbName > $outputFile

if (!(Test-Path $outputFile)) {
  throw "Backup file was not created."
}

# Keep only newest N backups (RetentionCount: 3-7)
$pattern = "{0}_*.sql" -f $DbName
$existingBackups = Get-ChildItem -Path $OutputDir -Filter $pattern -File |
  Sort-Object LastWriteTime -Descending

if ($existingBackups.Count -gt $RetentionCount) {
  $toDelete = $existingBackups | Select-Object -Skip $RetentionCount
  foreach ($file in $toDelete) {
    Remove-Item -Path $file.FullName -Force
    Write-Host "Removed old backup: $($file.Name)"
  }
}

Write-Host "Backup completed: $outputFile"
Write-Host "Retention policy applied: keep latest $RetentionCount backups"
