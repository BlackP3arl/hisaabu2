#!/bin/bash

# Database Setup Script (Non-Interactive)
# Description: Creates database and runs migrations using environment variables
# Usage: 
#   export DB_NAME=hisaabu
#   export DB_USER=postgres
#   export DB_PASSWORD=your_password
#   export DB_HOST=localhost
#   export DB_PORT=5432
#   ./setup_database_noninteractive.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Hisaabu Database Setup (Non-Interactive)${NC}"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed or not in PATH${NC}"
    exit 1
fi

# Get values from environment variables or use defaults
DB_NAME=${DB_NAME:-hisaabu}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: DB_PASSWORD not set. Attempting without password...${NC}"
    echo -e "${YELLOW}If this fails, set DB_PASSWORD environment variable or use interactive script.${NC}"
    echo ""
fi

# Set PGPASSWORD if provided
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD=$DB_PASSWORD
fi

echo -e "${BLUE}Configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

echo -e "${BLUE}Creating database...${NC}"

# Create database (ignore error if it already exists)
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${YELLOW}Database '$DB_NAME' might already exist. Continuing...${NC}"
}

echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}Running migrations...${NC}"

# Change to script directory for relative paths
cd "$SCRIPT_DIR"

# Run setup script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f setup_database.sql

echo ""
echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Database connection string:${NC}"
if [ -n "$DB_PASSWORD" ]; then
    echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
else
    echo "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
fi

# Unset password
unset PGPASSWORD

echo ""
echo -e "${GREEN}You can now connect to the database and start building the backend!${NC}"


