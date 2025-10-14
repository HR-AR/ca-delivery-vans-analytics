#!/bin/bash

# Analytics API Testing Script
# Tests all 7 analytics endpoints

BASE_URL="http://localhost:3000"

echo "========================================="
echo "CA Delivery Vans Analytics - API Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1. Testing Health Check..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
  echo "   Response: $body"
else
  echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 2: Dashboard Metrics
echo "2. Testing Dashboard Metrics..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/dashboard)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Dashboard endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Dashboard endpoint failed (HTTP $http_code)${NC}"
  echo "   Error: $body"
fi
echo ""

# Test 3: All Stores Analysis
echo "3. Testing All Stores Analysis..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/stores)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Stores endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.stores | length') stores analyzed"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Stores endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 4: Single Store Analysis
echo "4. Testing Single Store Analysis (Store 2082)..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/stores/2082)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Store detail endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Store detail endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 5: Vendor Comparison
echo "5. Testing Vendor Comparison..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/vendors)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Vendors endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c 'keys')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Vendors endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 6: CPD Comparison
echo "6. Testing CPD Comparison..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/cpd-comparison)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ CPD comparison endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.overall')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ CPD comparison endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 7: Batch Analysis
echo "7. Testing Batch Analysis..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/batch-analysis)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Batch analysis endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.overall')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Batch analysis endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 8: Performance Metrics
echo "8. Testing Performance Metrics..."
response=$(curl -s -w "\n%{http_code}" ${BASE_URL}/api/analytics/performance)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ Performance endpoint passed${NC}"
  echo "   Response: $(echo $body | jq -c '.')"
elif [ "$http_code" = "404" ]; then
  echo -e "${YELLOW}⚠ No Nash data uploaded yet${NC}"
else
  echo -e "${RED}✗ Performance endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

echo "========================================="
echo "API Testing Complete"
echo "========================================="
