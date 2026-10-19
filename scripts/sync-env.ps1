# ============================================================
# LootForward — Vercel Environment Variables Sync (PowerShell)
# ============================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  LootForward — Vercel Environment Variables Sync   " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Check if Vercel CLI is available
$vercelCmd = Get-Command "vercel" -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Write-Host "Error: Vercel CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install globally using: npm install -g vercel"
    exit 1
}

function Sync-VercelVar {
    param(
        [Parameter(Mandatory = $true)] [string]$Key,
        [Parameter(Mandatory = $true)] [string]$Value
    )

    $environments = @("production", "preview", "development")
    Write-Host "`nSyncing [$Key]..." -ForegroundColor Yellow

    foreach ($env in $environments) {
        # Attempt to remove if exists
        try {
            vercel env rm $Key $env -y 2>$null | Out-Null
        } catch { }

        # Pipe value into vercel env add
        $Value | vercel env add $Key $env
        Write-Host "  ✓ Added to $env" -ForegroundColor Green
    }
}

# 1. Sync Public Variables
Sync-VercelVar -Key "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" -Value "pk_live_51URA1l7Rn2TQL42SVqBqgnle1sltjYUSJwJ0EeESONdcRffzIpcHpx6fyZIHJ61DUzJr8tL50wtRQl16RZZ9H82V00jsPCS11DE"
Sync-VercelVar -Key "NEXT_PUBLIC_RAZORPAY_KEY_ID" -Value "rzp_test_lootforward_2026"
Sync-VercelVar -Key "NEXT_PUBLIC_APP_URL" -Value "https://lootforward.vercel.app"

Write-Host "`n=====================================================" -ForegroundColor Green
Write-Host "✓ All environment variables synced successfully to Vercel!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Verify with: vercel env ls"
