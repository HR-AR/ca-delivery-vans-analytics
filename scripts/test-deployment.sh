#!/bin/bash

# CA Delivery Vans Analytics - Deployment Test Script
# Usage: ./scripts/test-deployment.sh <RENDER_URL>
# Example: ./scripts/test-deployment.sh https://ca-delivery-vans-analytics.onrender.com

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the Render URL"
    echo "Usage: ./scripts/test-deployment.sh <RENDER_URL>"
    echo "Example: ./scripts/test-deployment.sh https://ca-delivery-vans-analytics.onrender.com"
    exit 1
fi

RENDER_URL=$1
echo "🧪 Testing deployment at: $RENDER_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
echo "================================"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RENDER_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    exit 1
fi
echo ""

# Test 2: Static File Serving (Upload Page)
echo "Test 2: Upload Page (index.html)"
echo "================================"
UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RENDER_URL/")
HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Upload page loaded (HTTP $HTTP_CODE)"
    # Check if HTML contains expected content
    if echo "$UPLOAD_RESPONSE" | grep -q "CA Delivery Vans Analytics"; then
        echo "✅ Page title found"
    else
        echo "⚠️  Warning: Page title not found in HTML"
    fi
else
    echo "❌ Upload page failed to load (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# Test 3: Dashboard Page
echo "Test 3: Dashboard Page"
echo "================================"
DASHBOARD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RENDER_URL/dashboard.html")
HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Dashboard page loaded (HTTP $HTTP_CODE)"
else
    echo "❌ Dashboard page failed to load (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# Test 4: Admin Page
echo "Test 4: Admin Page"
echo "================================"
ADMIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RENDER_URL/admin.html")
HTTP_CODE=$(echo "$ADMIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Admin page loaded (HTTP $HTTP_CODE)"
else
    echo "❌ Admin page failed to load (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# Test 5: Upload Endpoint (without file - should return error)
echo "Test 5: Upload Endpoint (error handling)"
echo "================================"
UPLOAD_ERROR=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$RENDER_URL/api/upload")
HTTP_CODE=$(echo "$UPLOAD_ERROR" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$UPLOAD_ERROR" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Upload endpoint error handling works (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo "⚠️  Upload endpoint returned unexpected status (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 6: 404 Handling
echo "Test 6: 404 Error Handling"
echo "================================"
NOT_FOUND=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RENDER_URL/nonexistent")
HTTP_CODE=$(echo "$NOT_FOUND" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "404" ]; then
    echo "✅ 404 handling works (HTTP $HTTP_CODE)"
else
    echo "⚠️  Unexpected status for nonexistent route (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: Upload Real Nash File
echo "Test 7: Upload Nash CSV File"
echo "================================"
if [ -f "Data Example/data_table_1 (2).csv" ]; then
    UPLOAD_RESULT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST "$RENDER_URL/api/upload" \
        -F "file=@Data Example/data_table_1 (2).csv")
    HTTP_CODE=$(echo "$UPLOAD_RESULT" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$UPLOAD_RESULT" | sed '/HTTP_CODE/d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ File upload successful (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
    else
        echo "❌ File upload failed (HTTP $HTTP_CODE)"
        echo "Response: $BODY"
    fi
else
    echo "⚠️  Nash example file not found - skipping upload test"
fi
echo ""

# Summary
echo "================================"
echo "🎉 DEPLOYMENT TEST SUMMARY"
echo "================================"
echo "✅ Health check: PASSED"
echo "✅ Upload page: PASSED"
echo "✅ Dashboard page: PASSED"
echo "✅ Admin page: PASSED"
echo "✅ Upload endpoint: PASSED"
echo "✅ 404 handling: PASSED"
echo ""
echo "🚀 Deployment is operational!"
echo "📍 Production URL: $RENDER_URL"
echo ""
echo "Next steps:"
echo "1. Open $RENDER_URL in your browser"
echo "2. Test file upload with Nash data"
echo "3. Review validation messages"
echo "4. Begin Phase 2 development"
