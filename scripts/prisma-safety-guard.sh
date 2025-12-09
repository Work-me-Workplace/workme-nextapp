#!/bin/bash

# Prisma Safety Guard - Prevents accidental data loss
# This script wraps Prisma commands and prevents destructive operations

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛡️  Prisma Safety Guard Active${NC}"

# Check for destructive flags
DESTRUCTIVE_FLAGS=("--force-reset" "--skip-seed" "--accept-data-loss" "--reset")

for flag in "${DESTRUCTIVE_FLAGS[@]}"; do
    if [[ "$*" == *"$flag"* ]]; then
        echo -e "${RED}❌ BLOCKED: Destructive operation detected!${NC}"
        echo -e "${RED}   Flag detected: $flag${NC}"
        echo -e "${YELLOW}   This operation would cause DATA LOSS!${NC}"
        echo ""
        echo "If you REALLY need to do this, you must:"
        echo "  1. Explicitly set ALLOW_DESTRUCTIVE_PRISMA=1 in your environment"
        echo "  2. Or use prisma directly (bypassing this guard)"
        echo ""
        exit 1
    fi
done

# If we get here, the command is safe to run
echo -e "${GREEN}✅ Command is safe, proceeding...${NC}"
echo ""

# Run the actual prisma command
npx prisma "$@"

