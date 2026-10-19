#!/usr/bin/env bash
# ============================================================
# LootForward — Automated Vercel Production Deployment Pipeline
# Automates pre-flight checks, Git tagging, pushing, & Vercel deployment
# ============================================================

set -euo pipefail

# Visual terminal formatters
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}=====================================================${NC}"
echo -e "${CYAN}${BOLD}    LootForward Automated Production Deployment      ${NC}"
echo -e "${CYAN}${BOLD}    Target: https://lootforward.vercel.app           ${NC}"
echo -e "${CYAN}${BOLD}=====================================================${NC}"

# ── 1. Pre-Flight Validation ─────────────────────────────────
echo -e "\n${YELLOW}▶ Step 1: Running Pre-Flight Syntax & Integrity Checks...${NC}"

# Check for required tools
for tool in git node vercel curl; do
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${RED}Error: Required tool '${tool}' is not installed or not in PATH.${NC}"
        exit 1
    fi
done

# Syntax validate JavaScript files
echo "  Checking app.js syntax..."
node -c app.js
echo -e "  ${GREEN}✓ app.js passed syntax check.${NC}"

if [ -f "functions/index.js" ]; then
    echo "  Checking functions/index.js syntax..."
    node -c functions/index.js
    echo -e "  ${GREEN}✓ functions/index.js passed syntax check.${NC}"
fi

# Validate vercel.json structure
echo "  Validating vercel.json format..."
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))"
echo -e "  ${GREEN}✓ vercel.json is valid JSON.${NC}"

# ── 2. Git Status & Version Tagging ──────────────────────────
echo -e "\n${YELLOW}▶ Step 2: Preparing Git Release Tag...${NC}"

PKG_VERSION=$(node -p "require('./package.json').version || '1.0.0'")
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
TAG_NAME="v${PKG_VERSION}-${TIMESTAMP}"

echo "  Target Release Tag: ${TAG_NAME}"

# Stage all files
git add -A

# Commit if there are staged changes
if ! git diff --cached --quiet; then
    echo "  Committing uncommitted changes..."
    git commit -m "chore(release): prepare production build ${TAG_NAME}"
    echo -e "  ${GREEN}✓ Changes committed.${NC}"
else
    echo "  Working tree clean, no new changes to commit."
fi

# Create annotated tag
git tag -a "${TAG_NAME}" -m "LootForward Release ${TAG_NAME}"
echo -e "  ${GREEN}✓ Created git tag: ${TAG_NAME}${NC}"

# Push commits and tags to remote (if remote exists)
if git remote get-url origin &> /dev/null; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "  Pushing branch '${CURRENT_BRANCH}' and tags to origin..."
    git push origin "${CURRENT_BRANCH}" --tags
    echo -e "  ${GREEN}✓ Pushed to remote repository.${NC}"
else
    echo -e "  ${YELLOW}Notice: No remote 'origin' configured. Skipping git push.${NC}"
fi

# ── 3. Vercel Production Build Trigger ───────────────────────
echo -e "\n${YELLOW}▶ Step 3: Triggering Vercel Production Deployment...${NC}"

# Run Vercel deployment and capture URL
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract production URL from output
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -n 1 || true)

if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL="https://lootforward.vercel.app"
fi

echo -e "  ${GREEN}✓ Deployment initiated to: ${DEPLOY_URL}${NC}"

# ── 4. Automated Post-Deployment Verification ─────────────────
echo -e "\n${YELLOW}▶ Step 4: Running Post-Deployment Health Check...${NC}"

# Wait 3 seconds for edge cache distribution
sleep 3

# Check root page status
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "${DEPLOY_URL}" || echo "000")
echo "  GET ${DEPLOY_URL} -> HTTP ${HTTP_STATUS}"

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    echo -e "  ${GREEN}✓ Root endpoint is healthy (HTTP ${HTTP_STATUS})!${NC}"
else
    echo -e "  ${RED}Warning: Root endpoint returned status ${HTTP_STATUS}.${NC}"
fi

# Check security headers on production response
echo "  Verifying Content-Security-Policy & Security Headers..."
HEADERS=$(curl -s -I -L "${DEPLOY_URL}")

if echo "$HEADERS" | grep -qi "content-security-policy"; then
    echo -e "  ${GREEN}✓ Content-Security-Policy header present.${NC}"
else
    echo -e "  ${YELLOW}Notice: CSP header not detected on raw response.${NC}"
fi

if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "  ${GREEN}✓ X-Frame-Options header present.${NC}"
fi

echo -e "\n${GREEN}${BOLD}=====================================================${NC}"
echo -e "${GREEN}${BOLD}✓ LootForward Production Deployment Complete!        ${NC}"
echo -e "${GREEN}${BOLD}  Live URL: ${DEPLOY_URL}                              ${NC}"
echo -e "${GREEN}${BOLD}  Release:  ${TAG_NAME}                              ${NC}"
echo -e "${GREEN}${BOLD}=====================================================${NC}"
