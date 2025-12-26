#!/bin/bash

# Database Verification Script
# Runs all verification checks from VERIFICATION.md

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Verification Checklist${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

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

# Function to run query and check result
check_query() {
    local description=$1
    local query=$2
    local expected_count=$3
    
    echo -e "${BLUE}Checking: ${description}${NC}"
    result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
    
    if [ $? -eq 0 ]; then
        count=$(echo "$result" | wc -l | tr -d ' ')
        if [ -n "$expected_count" ]; then
            if [ "$count" -ge "$expected_count" ]; then
                echo -e "${GREEN}✓ Passed${NC} (Found: $count)"
            else
                echo -e "${RED}✗ Failed${NC} (Expected at least $expected_count, found: $count)"
            fi
        else
            echo -e "${GREEN}✓ Passed${NC}"
            echo "$result" | head -5
        fi
    else
        echo -e "${RED}✗ Failed${NC} - Error: $result"
    fi
    echo ""
}

# Track overall status
PASSED=0
FAILED=0

echo -e "${YELLOW}=== 1. Checking All Tables Exist ===${NC}"
query="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
if [ $? -eq 0 ]; then
    count=$(echo "$result" | tr -d ' ')
    if [ "$count" -eq 11 ]; then
        echo -e "${GREEN}✓ All 11 tables exist${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Expected 11 tables, found: $count${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Error checking tables: $result${NC}"
    ((FAILED++))
fi

# List tables
echo "Tables found:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>/dev/null | sed 's/^/  - /'
echo ""

echo -e "${YELLOW}=== 2. Checking Key Indexes ===${NC}"
indexes=("idx_users_email" "idx_clients_user_id" "idx_quotations_number_user" "idx_invoices_number_user" "idx_share_links_token")
for idx in "${indexes[@]}"; do
    query="SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname = '$idx';"
    result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
    if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
        echo -e "${GREEN}✓ $idx exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $idx missing${NC}"
        ((FAILED++))
    fi
done
echo ""

echo -e "${YELLOW}=== 3. Checking Foreign Keys ===${NC}"
query="SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';"
result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
if [ $? -eq 0 ]; then
    count=$(echo "$result" | tr -d ' ')
    if [ "$count" -ge 13 ]; then
        echo -e "${GREEN}✓ Found $count foreign keys (expected at least 13)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Expected at least 13 foreign keys, found: $count${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Error checking foreign keys${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}=== 4. Checking Triggers ===${NC}"
expected_triggers=("trigger_users_updated_at" "trigger_clients_updated_at" "trigger_categories_updated_at" "trigger_items_updated_at" "trigger_quotations_updated_at" "trigger_invoices_updated_at" "trigger_company_settings_updated_at" "trigger_update_invoice_totals" "trigger_update_quotation_totals" "trigger_update_invoice_payment_status" "trigger_update_category_item_count")
for trigger in "${expected_triggers[@]}"; do
    query="SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = '$trigger';"
    result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
    if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
        echo -e "${GREEN}✓ $trigger exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $trigger missing${NC}"
        ((FAILED++))
    fi
done
echo ""

echo -e "${YELLOW}=== 5. Checking Functions ===${NC}"
expected_functions=("update_updated_at_column" "update_invoice_totals" "update_quotation_totals" "update_invoice_payment_status" "update_category_item_count")
for func in "${expected_functions[@]}"; do
    query="SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' AND routine_name = '$func';"
    result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
    if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
        echo -e "${GREEN}✓ $func() exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $func() missing${NC}"
        ((FAILED++))
    fi
done
echo ""

echo -e "${YELLOW}=== 6. Checking Views ===${NC}"
query="SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'client_summary';"
result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
    echo -e "${GREEN}✓ client_summary view exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ client_summary view missing${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}=== 7. Checking Constraints ===${NC}"
query="SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type IN ('CHECK', 'UNIQUE');"
result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
if [ $? -eq 0 ]; then
    count=$(echo "$result" | tr -d ' ')
    echo -e "${GREEN}✓ Found $count constraints${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Error checking constraints${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}=== 8. Checking UUID Extension ===${NC}"
query="SELECT COUNT(*) FROM pg_extension WHERE extname = 'uuid-ossp';"
result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
    echo -e "${GREEN}✓ uuid-ossp extension installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ uuid-ossp extension missing${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}=== 9. Testing Trigger Functions ===${NC}"
echo "Testing updated_at trigger..."
# Create test user
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO users (email, password_hash, name) VALUES ('verify_test@example.com', 'test_hash', 'Test User') ON CONFLICT DO NOTHING;" > /dev/null 2>&1

# Get initial updated_at
initial=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT updated_at FROM users WHERE email = 'verify_test@example.com';" 2>/dev/null | tr -d ' ')

# Wait a moment
sleep 1

# Update the user
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "UPDATE users SET name = 'Updated Name' WHERE email = 'verify_test@example.com';" > /dev/null 2>&1

# Get updated updated_at
updated=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT updated_at FROM users WHERE email = 'verify_test@example.com';" 2>/dev/null | tr -d ' ')

# Cleanup
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM users WHERE email = 'verify_test@example.com';" > /dev/null 2>&1

if [ "$initial" != "$updated" ]; then
    echo -e "${GREEN}✓ updated_at trigger is working${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ updated_at trigger may not be working${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}=== 10. Checking Table Structures ===${NC}"
# Check users table has required columns
required_columns=("id" "email" "password_hash" "name" "role" "created_at" "updated_at")
missing_columns=0
for col in "${required_columns[@]}"; do
    query="SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = '$col';"
    result=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "$query" 2>&1)
    if [ $? -eq 0 ] && [ "$(echo "$result" | tr -d ' ')" -eq 1 ]; then
        echo -e "${GREEN}✓ users.$col exists${NC}"
    else
        echo -e "${RED}✗ users.$col missing${NC}"
        ((missing_columns++))
    fi
done

if [ $missing_columns -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ Database verification PASSED! ✓✓✓${NC}"
    echo -e "${GREEN}Database is ready for backend implementation.${NC}"
    exit 0
else
    echo -e "${RED}✗✗✗ Database verification FAILED! ✗✗✗${NC}"
    echo -e "${YELLOW}Please review the errors above and fix them before proceeding.${NC}"
    exit 1
fi

# Unset password
unset PGPASSWORD



