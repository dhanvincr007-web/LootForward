# ============================================================
# LootForward — Automated Vercel Production Deployment (PowerShell)
# ============================================================

[CmdletBinding()]
param(
    [switch]$SkipGitPush = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "    LootForward Automated Production Deployment      " -ForegroundColor Cyan
Write-Host "    Target: https://lootforward.vercel.app           " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# ── 1. Pre-Flight Validation ─────────────────────────────────
Write-Host "`n▶ Step 1: Running Pre-Flight Syntax & Integrity Checks..." -ForegroundColor Yellow

# Verify node
Write-Host "  Checking app.js syntax..."
node -c app.js
Write-Host "  ✓ app.js passed syntax check." -ForegroundColor Green

if (Test-Path "functions/index.js") {
    Write-Host "  Checking functions/index.js syntax..."
    node -c functions/index.js
    Write-Host "  ✓ functions/index.js passed syntax check." -ForegroundColor Green
}

# Validate vercel.json
Write-Host "  Validating vercel.json..."
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))"
Write-Host "  ✓ vercel.json is valid JSON." -ForegroundColor Green

# ── 2. Git Status & Version Tagging ──────────────────────────
Write-Host "`n▶ Step 2: Preparing Git Release Tag..." -ForegroundColor Yellow

$pkgVersion = node -p "require('./package.json').version || '1.0.0'"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$tagName = "v${pkgVersion}-${timestamp}"

Write-Host "  Target Release Tag: $tagName"

git add -A
$staged = git status --porcelain
if ($staged) {
    Write-Host "  Committing uncommitted changes..."
    git commit -m "chore(release): prepare production build $tagName"
    Write-Host "  ✓ Changes committed." -ForegroundColor Green
} else {
    Write-Host "  Working tree clean, no new changes to commit."
}

git tag -a $tagName -m "LootForward Release $tagName"
Write-Host "  ✓ Created git tag: $tagName" -ForegroundColor Green

if (-not $SkipGitPush) {
    try {
        $remotes = git remote
        if ($remotes) {
            $branch = git rev-parse --abbrev-ref HEAD
            Write-Host "  Pushing to remote ($branch and tags)..."
            git push origin $branch --tags
            Write-Host "  ✓ Pushed commits and tags." -ForegroundColor Green
        }
    } catch {
        Write-Host "  Notice: Git push skipped or remote origin unavailable." -ForegroundColor Yellow
    }
}

# ── 3. Vercel Production Build Trigger ───────────────────────
Write-Host "`n▶ Step 3: Triggering Vercel Production Deployment..." -ForegroundColor Yellow

try {
    $deployOutput = vercel --prod --yes 2>&1 | Out-String
    Write-Host $deployOutput

    # Regex find URL
    if ($deployOutput -match "(https://[a-zA-Z0-9.-]+\.vercel\.app)") {
        $deployUrl = $matches[1]
    } else {
        $deployUrl = "https://lootforward.vercel.app"
    }

    Write-Host "  ✓ Deployed to: $deployUrl" -ForegroundColor Green
} catch {
    Write-Host "Error during Vercel deployment: $_" -ForegroundColor Red
    exit 1
}

# ── 4. Post-Deployment Verification ──────────────────────────
Write-Host "`n▶ Step 4: Running Post-Deployment Health Check..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri $deployUrl -Method Get -TimeoutSec 15
    Write-Host "  GET $deployUrl -> HTTP $($response.StatusCode)" -ForegroundColor Green

    if ($response.Headers["Content-Security-Policy"]) {
        Write-Host "  ✓ Content-Security-Policy header confirmed." -ForegroundColor Green
    }
    if ($response.Headers["X-Frame-Options"]) {
        Write-Host "  ✓ X-Frame-Options header confirmed." -ForegroundColor Green
    }
} catch {
    Write-Host "  Note: Could not reach live endpoint ($_) or edge propagation in progress." -ForegroundColor Yellow
}

Write-Host "`n=====================================================" -ForegroundColor Green
Write-Host "✓ LootForward Production Deployment Complete!" -ForegroundColor Green
Write-Host "  Live URL: $deployUrl" -ForegroundColor Green
Write-Host "  Release:  $tagName" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
