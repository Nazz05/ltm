param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$ContainerName = "ltnwc_postgres",
  [string]$DbName = "shopdb",
  [string]$DbUser = "shopuser"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

Write-Host "Restoring backup from: $BackupFile"

Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

Write-Host "Restore completed."
