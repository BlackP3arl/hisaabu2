#!/bin/bash

# Database Creation Script
# Description: Creates the database and runs all migrations
# Usage: ./create_database.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Hisaabu Database Setup${NC}"
echo "========================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed or not in PATH${NC}"
    exit 1
fi

# Get database connection details
read -p "Database name [hisaabu]: " DB_NAME
DB_NAME=${DB_NAME:-hisaabu}

read -p "Database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""

read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Set PGPASSWORD environment variable
export PGPASSWORD=$DB_PASSWORD

echo ""
echo -e "${BLUE}Creating database...${NC}"

# Create database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${RED}Database '$DB_NAME' might already exist. Continuing...${NC}"
}

echo -e "${GREEN}Database created successfully!${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}Running migrations...${NC}"

# Run setup script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/setup_database.sql"

echo ""
echo -e "${GREEN}Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Database connection string:${NC}"
echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Unset password
unset PGPASSWORD


