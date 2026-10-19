#!/usr/bin/env bash
# ============================================================
# LootForward — Vercel Environment Variables Sync Script
# Automates setting public and secret variables via Vercel CLI
# ============================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}  LootForward — Vercel Environment Variables Sync   ${NC}"
echo -e "${CYAN}=====================================================${NC}"

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed.${NC}"
    echo "Install it globally with: npm install -g vercel"
    exit 1
fi

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: Neither .env.production nor .env found.${NC}"
    echo "Using default required variables for LootForward..."
fi

# Function to add/update a Vercel environment variable
sync_var() {
    local key="$1"
    local value="$2"
    local environments=("production" "preview" "development")

    echo -e "\n${YELLOW}Syncing [${key}]...${NC}"
    for env in "${environments[@]}"; do
        # Remove existing variable if present (ignore failure if not found)
        vercel env rm "$key" "$env" -y 2>/dev/null || true
        # Add variable
        echo -n "$value" | vercel env add "$key" "$env"
        echo -e "  ${GREEN}✓ Added to ${env}${NC}"
    done
}

# ── 1. Sync Public Variables ─────────────────────────────────
sync_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_live_51URA1l7Rn2TQL42SVqBqgnle1sltjYUSJwJ0EeESONdcRffzIpcHpx6fyZIHJ61DUzJr8tL50wtRQl16RZZ9H82V00jsPCS11DE"
sync_var "NEXT_PUBLIC_RAZORPAY_KEY_ID" "rzp_test_lootforward_2026"
sync_var "NEXT_PUBLIC_APP_URL" "https://lootforward.vercel.app"

# ── 2. Sync Backend Firebase Function Secrets (if provided) ──
if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
    sync_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
fi

if [ -n "${RAZORPAY_KEY_SECRET:-}" ]; then
    sync_var "RAZORPAY_KEY_SECRET" "$RAZORPAY_KEY_SECRET"
fi

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}✓ All environment variables synced successfully to Vercel!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo "Verify configuration with: vercel env ls"
