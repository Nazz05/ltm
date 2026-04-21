param(
  [string]$TaskName = "LTWNC-Postgres-Backup-Daily",
  [string]$Time = "01:00",
  [string]$ContainerName = "ltnwc_postgres",
  [string]$DbName = "shopdb",
  [string]$DbUser = "shopuser",
  [string]$OutputDir = "c:\\Users\\PC\\Documents\\GitHub\\LTWNC\\ltwnc-shop\\backend\\backups",
  [ValidateRange(3, 7)]
  [int]$RetentionCount = 7
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "db-backup.ps1"
if (!(Test-Path $scriptPath)) {
  throw "Cannot find backup script: $scriptPath"
}

$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"$scriptPath\" -ContainerName \"$ContainerName\" -DbName \"$DbName\" -DbUser \"$DbUser\" -OutputDir \"$OutputDir\" -RetentionCount $RetentionCount"

# Update existing task if present.
schtasks /Delete /TN $TaskName /F | Out-Null 2>$null

schtasks /Create /SC DAILY /TN $TaskName /TR $command /ST $Time /F | Out-Null

Write-Host "Scheduled task created/updated successfully."
Write-Host "Task name: $TaskName"
Write-Host "Run time: $Time daily"
Write-Host "Output folder: $OutputDir"
Write-Host "Retention count: $RetentionCount"
