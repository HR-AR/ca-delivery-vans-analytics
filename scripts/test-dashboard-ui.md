# Dashboard UI Manual Test Script
**Phase 4: CA Delivery Vans Analytics Dashboard**

## Prerequisites
- Server running: `npm run dev` or `npm start`
- Browser: Chrome (primary), Firefox/Safari (optional)
- Test data: `Data Example/data_table_1 (2).csv`
- Chrome DevTools open (F12) for monitoring

---

## Test Session Information
- **Date:** _____________
- **Tester:** _____________
- **Browser:** Chrome Version: _____________
- **Server URL:** http://localhost:3000

---

## Section 1: Initial Setup

### Step 1.1: Start Server
```bash
cd /Users/h0r03cw/Desktop/Coding/CA\ Analysis
npm run dev
```

**Expected:** Server starts on port 3000 without errors

- [ ] Server starts successfully
- [ ] No error messages in terminal
- [ ] Health check accessible: http://localhost:3000/health

**Notes:** _______________________________________________

---

### Step 1.2: Open Dashboard
1. Navigate to: http://localhost:3000/dashboard.html
2. Open Chrome DevTools (F12)
3. Check Console tab for errors

**Expected:** Dashboard page loads with placeholder content

- [ ] Page loads without errors
- [ ] Navigation menu visible (Upload, Dashboard, Admin)
- [ ] No console errors or warnings
- [ ] Page title: "Dashboard - CA Delivery Vans Analytics"

**Screenshot Location:** `docs/screenshots/01-dashboard-initial.png`

**Notes:** _______________________________________________

---

## Section 2: Data Upload

### Step 2.1: Navigate to Upload Page
1. Click "Upload" in navigation menu
2. Verify upload form appears

**Expected:** Upload page displays with file input

- [ ] Upload page loads
- [ ] File input field visible
- [ ] "Choose File" button enabled
- [ ] Upload button visible

**Screenshot Location:** `docs/screenshots/02-upload-page.png`

**Notes:** _______________________________________________

---

### Step 2.2: Upload Test Data
1. Click "Choose File"
2. Select: `Data Example/data_table_1 (2).csv`
3. Click "Upload" button
4. Monitor network tab in DevTools

**Expected:** File uploads successfully with validation

- [ ] File selected (filename displayed)
- [ ] Upload completes within 5 seconds
- [ ] Success message appears
- [ ] Validation summary displayed
- [ ] No console errors

**Response Details:**
- Status Code: _______________
- Total Rows: _______________
- CA Stores: _______________
- Warnings: _______________

**Screenshot Location:** `docs/screenshots/03-upload-success.png`

**Notes:** _______________________________________________

---

## Section 3: Dashboard Chart Testing

### Step 3.1: Return to Dashboard
1. Click "Dashboard" in navigation menu
2. Wait for charts to load

**Expected:** Dashboard loads with data and charts

- [ ] Dashboard page loads
- [ ] Loading indicators appear briefly
- [ ] Charts begin rendering
- [ ] No "No data available" messages

**Screenshot Location:** `docs/screenshots/04-dashboard-loading.png`

**Notes:** _______________________________________________

---

### Step 3.2: Verify Chart 1 - Total Orders Over Time
**Chart Location:** Top left panel

**Expected:** Line chart showing orders over time

- [ ] Chart renders completely
- [ ] X-axis: Date labels visible and readable
- [ ] Y-axis: Order count labels visible
- [ ] Line(s) plotted with data points
- [ ] Legend visible (if multiple series)
- [ ] Hover tooltips work (show exact values)
- [ ] No "undefined" or "NaN" values
- [ ] Chart loads within 3 seconds

**Visual Inspection:**
- Data points: _______________
- Date range: _______________ to _______________
- Peak orders: _______________
- Chart colors: _______________

**Screenshot Location:** `docs/screenshots/05-chart-total-orders.png`

**Notes:** _______________________________________________

---

### Step 3.3: Verify Chart 2 - CPD Comparison
**Chart Location:** Top right panel

**Expected:** Bar chart comparing Van CPD vs Spark CPD

- [ ] Chart renders completely
- [ ] X-axis: Store IDs or categories visible
- [ ] Y-axis: Cost ($) labels visible and formatted
- [ ] Bars displayed for Van CPD and Spark CPD
- [ ] Legend distinguishes Van vs Spark
- [ ] Bars are different colors
- [ ] Hover tooltips work
- [ ] Dollar amounts formatted (e.g., $12.45)
- [ ] Chart loads within 3 seconds

**Visual Inspection:**
- Stores shown: _______________
- Van CPD average: _______________
- Spark CPD average: _______________
- Difference: _______________

**Screenshot Location:** `docs/screenshots/06-chart-cpd.png`

**Notes:** _______________________________________________

---

### Step 3.4: Verify Chart 3 - On-Time Delivery %
**Chart Location:** Middle left panel

**Expected:** Bar chart showing OTD% by carrier or store

- [ ] Chart renders completely
- [ ] X-axis: Carrier/Store labels visible
- [ ] Y-axis: Percentage (0-100%) scale
- [ ] Bars displayed with heights representing OTD%
- [ ] Y-axis max = 100%
- [ ] Hover tooltips work
- [ ] Percentage values formatted (e.g., 95.2%)
- [ ] Chart loads within 3 seconds

**Visual Inspection:**
- Carriers/Stores: _______________
- Highest OTD%: _______________
- Lowest OTD%: _______________
- Average OTD%: _______________

**Screenshot Location:** `docs/screenshots/07-chart-otd.png`

**Notes:** _______________________________________________

---

### Step 3.5: Verify Chart 4 - Vendor Performance
**Chart Location:** Middle right panel

**Expected:** Radar chart comparing FOX, NTG, FDC performance

- [ ] Chart renders completely
- [ ] Radar/Spider chart format
- [ ] All 3 vendors visible (FOX, NTG, FDC)
- [ ] Multiple metrics shown (e.g., CPD, OTD%, Orders)
- [ ] Legend identifies each vendor
- [ ] Vendor colors distinguishable
- [ ] Hover tooltips work
- [ ] Chart loads within 3 seconds

**Visual Inspection:**
- Vendors shown: _______________
- Metrics compared: _______________
- Best performing vendor: _______________
- Metric ranges: _______________

**Screenshot Location:** `docs/screenshots/08-chart-vendor.png`

**Notes:** _______________________________________________

---

### Step 3.6: Verify Chart 5 - Batch Density
**Chart Location:** Bottom panel

**Expected:** Line chart showing orders per batch over time

- [ ] Chart renders completely
- [ ] X-axis: Date or batch ID labels visible
- [ ] Y-axis: Orders per batch count
- [ ] Line plotted showing density trends
- [ ] Hover tooltips work
- [ ] Y-axis starts at 0
- [ ] Chart loads within 3 seconds

**Visual Inspection:**
- Batch count: _______________
- Avg orders per batch: _______________
- Min density: _______________
- Max density: _______________
- Trend: _______________

**Screenshot Location:** `docs/screenshots/09-chart-batch-density.png`

**Notes:** _______________________________________________

---

## Section 4: UI/UX Quality Checks

### Step 4.1: Check Key Highlights
**Location:** Top of dashboard (above charts)

**Expected:** Summary cards with key metrics

- [ ] Total Orders displayed
- [ ] Average CPD displayed
- [ ] Average OTD% displayed
- [ ] Total Stores displayed
- [ ] Values are numeric and formatted
- [ ] No "undefined" or "NaN" values
- [ ] Cards aligned properly

**Values:**
- Total Orders: _______________
- Avg CPD: _______________
- Avg OTD%: _______________
- Total Stores: _______________

**Screenshot Location:** `docs/screenshots/10-highlights.png`

**Notes:** _______________________________________________

---

### Step 4.2: Check "No Data" Indicators
1. Clear browser cache (Ctrl+Shift+Del)
2. Reload dashboard without uploading data

**Expected:** User-friendly "no data" messages

- [ ] Charts show placeholder or message
- [ ] Message: "No data available" or similar
- [ ] No broken chart images
- [ ] No JavaScript errors
- [ ] Helpful instruction to upload data

**Screenshot Location:** `docs/screenshots/11-no-data-state.png`

**Notes:** _______________________________________________

---

### Step 4.3: Test Refresh Button
1. Upload data (if needed)
2. Locate "Refresh" button on dashboard
3. Click refresh button

**Expected:** Dashboard data reloads

- [ ] Refresh button exists and is clickable
- [ ] Loading indicators appear
- [ ] Charts re-render
- [ ] Data updates (or stays same if unchanged)
- [ ] No errors during refresh

**Notes:** _______________________________________________

---

### Step 4.4: Check Color Scheme Consistency
**Expected:** Consistent colors across all charts

- [ ] Primary colors match across charts
- [ ] Chart colors match Phase 1-2 UI
- [ ] Vendor colors consistent (FOX, NTG, FDC)
- [ ] Background colors appropriate
- [ ] Text readable against backgrounds

**Color Palette:**
- Primary: _______________
- Secondary: _______________
- FOX: _______________
- NTG: _______________
- FDC: _______________

**Notes:** _______________________________________________

---

### Step 4.5: Check Labels and Legends
**Expected:** All charts have clear labels

- [ ] Chart titles present and descriptive
- [ ] X-axis labels readable
- [ ] Y-axis labels readable
- [ ] Legends present (where needed)
- [ ] Units specified (e.g., $, %, orders)
- [ ] No overlapping text

**Notes:** _______________________________________________

---

### Step 4.6: Check Tooltips
**Expected:** Interactive tooltips on hover

For each chart:
1. Hover over data points/bars
2. Verify tooltip appears

- [ ] Chart 1 tooltips work
- [ ] Chart 2 tooltips work
- [ ] Chart 3 tooltips work
- [ ] Chart 4 tooltips work
- [ ] Chart 5 tooltips work
- [ ] Tooltips show exact values
- [ ] Tooltips formatted properly
- [ ] Tooltips disappear on mouse out

**Notes:** _______________________________________________

---

## Section 5: Responsive Layout Testing

### Step 5.1: Test Desktop View (1920x1080)
1. Resize browser to 1920x1080
2. Check layout

**Expected:** All charts fit properly

- [ ] All 5 charts visible without scrolling
- [ ] No horizontal scrollbar
- [ ] Charts not overlapping
- [ ] Text readable
- [ ] Layout looks professional

**Screenshot Location:** `docs/screenshots/12-desktop-view.png`

**Notes:** _______________________________________________

---

### Step 5.2: Test Laptop View (1366x768)
1. Resize browser to 1366x768
2. Check layout

**Expected:** Charts adapt to smaller screen

- [ ] All charts visible (may require scrolling)
- [ ] Charts resize proportionally
- [ ] Text still readable
- [ ] No broken layout
- [ ] Horizontal scrolling minimal/none

**Screenshot Location:** `docs/screenshots/13-laptop-view.png`

**Notes:** _______________________________________________

---

### Step 5.3: Test Tablet View (768x1024)
1. Resize browser to 768x1024 (or use DevTools device emulation)
2. Check layout

**Expected:** Charts stack vertically

- [ ] Charts stack in single column
- [ ] Each chart maintains aspect ratio
- [ ] Text remains readable
- [ ] Navigation menu adapts
- [ ] Vertical scrolling enabled

**Screenshot Location:** `docs/screenshots/14-tablet-view.png`

**Notes:** _______________________________________________

---

### Step 5.4: Test Mobile View (320x568)
1. Resize browser to 320x568 (or use DevTools iPhone SE)
2. Check layout

**Expected:** Mobile-friendly layout

- [ ] Charts stack vertically
- [ ] Charts resize to fit screen width
- [ ] Text readable (may be smaller)
- [ ] Navigation menu collapses/hamburger
- [ ] No horizontal scrolling
- [ ] Touch-friendly button sizes

**Screenshot Location:** `docs/screenshots/15-mobile-view.png`

**Notes:** _______________________________________________

---

## Section 6: Error State Testing

### Step 6.1: Test Invalid Data Upload
1. Navigate to Upload page
2. Create a text file with invalid content
3. Try to upload

**Expected:** Graceful error handling

- [ ] Error message appears
- [ ] Message is user-friendly
- [ ] No stack trace visible to user
- [ ] Upload form remains functional
- [ ] Can try again

**Error Message:** _______________________________________________

**Screenshot Location:** `docs/screenshots/16-upload-error.png`

**Notes:** _______________________________________________

---

### Step 6.2: Test API Failure
1. Stop the backend server
2. Try to refresh dashboard

**Expected:** User-friendly error message

- [ ] Error message appears
- [ ] Message explains server unavailable
- [ ] No blank screen
- [ ] No JavaScript alert() popups
- [ ] Retry option available

**Screenshot Location:** `docs/screenshots/17-api-error.png`

**Notes:** _______________________________________________

---

### Step 6.3: Test Network Timeout
1. Use DevTools Network tab
2. Throttle connection to "Slow 3G"
3. Try to load dashboard

**Expected:** Loading indicators and eventual success/timeout

- [ ] Loading indicators appear
- [ ] User informed of loading
- [ ] Either succeeds eventually or shows timeout
- [ ] No infinite loading state
- [ ] Retry option available

**Notes:** _______________________________________________

---

## Section 7: Navigation and Integration

### Step 7.1: Test Navigation Between Pages
1. Start at Upload page
2. Navigate to Dashboard
3. Navigate to Admin
4. Navigate back to Upload

**Expected:** Seamless navigation

- [ ] All navigation links work
- [ ] Page transitions smooth
- [ ] Current page highlighted in menu
- [ ] No broken links
- [ ] Browser back button works

**Notes:** _______________________________________________

---

### Step 7.2: Test "Last Updated" Timestamp
**Location:** Dashboard page (usually top right)

**Expected:** Accurate timestamp

- [ ] "Last Updated" timestamp visible
- [ ] Timestamp format readable (e.g., "Oct 13, 2025 2:30 PM")
- [ ] Timestamp updates after new upload
- [ ] Timestamp reflects data file time

**Last Updated:** _______________________________________________

**Notes:** _______________________________________________

---

## Section 8: Performance Testing

### Step 8.1: Measure Initial Load Time
1. Clear browser cache
2. Open DevTools Network tab
3. Load dashboard page
4. Note load time

**Expected:** Dashboard loads within 5 seconds

- [ ] Total page load < 5 seconds
- [ ] Chart rendering < 2 seconds each
- [ ] No long-running scripts
- [ ] Smooth rendering (no jank)

**Timing:**
- Page load: _______________ ms
- Chart 1: _______________ ms
- Chart 2: _______________ ms
- Chart 3: _______________ ms
- Chart 4: _______________ ms
- Chart 5: _______________ ms
- Total: _______________ ms

**Notes:** _______________________________________________

---

### Step 8.2: Check Memory Usage
1. Open DevTools Memory tab
2. Take heap snapshot before loading dashboard
3. Load dashboard with all charts
4. Take heap snapshot after rendering

**Expected:** Reasonable memory usage

- [ ] Memory increase < 100 MB
- [ ] No memory leaks on page reload
- [ ] Charts don't duplicate in memory

**Memory:**
- Before: _______________ MB
- After: _______________ MB
- Increase: _______________ MB

**Notes:** _______________________________________________

---

### Step 8.3: Check Console for Errors
**Throughout all tests**

**Expected:** No console errors or warnings

- [ ] No red errors in console
- [ ] No yellow warnings (or only minor ones)
- [ ] No 404 errors for resources
- [ ] No CORS errors
- [ ] No Chart.js errors

**Console Errors (if any):** _______________________________________________

**Notes:** _______________________________________________

---

## Section 9: Browser Compatibility (Optional)

### Step 9.1: Test in Firefox
Repeat key tests in Firefox:

- [ ] Dashboard loads correctly
- [ ] All 5 charts render
- [ ] Navigation works
- [ ] Upload works
- [ ] No console errors

**Firefox Version:** _______________
**Issues Found:** _______________________________________________

---

### Step 9.2: Test in Safari
Repeat key tests in Safari:

- [ ] Dashboard loads correctly
- [ ] All 5 charts render
- [ ] Navigation works
- [ ] Upload works
- [ ] No console errors

**Safari Version:** _______________
**Issues Found:** _______________________________________________

---

## Test Summary

### Overall Results
- **Total Tests:** _____ passed / _____ total
- **Critical Issues:** _______________
- **Minor Issues:** _______________
- **Browser Compatibility:** _______________

### Pass/Fail by Section
- [ ] Section 1: Initial Setup
- [ ] Section 2: Data Upload
- [ ] Section 3: Dashboard Charts
- [ ] Section 4: UI/UX Quality
- [ ] Section 5: Responsive Layout
- [ ] Section 6: Error States
- [ ] Section 7: Navigation
- [ ] Section 8: Performance

### Bugs Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Sign-off
- **Tester:** _______________
- **Date:** _______________
- **Status:** PASS / FAIL / CONDITIONAL PASS
- **Notes:** _______________________________________________

---

## Appendix: Test Data Details

### Test File: data_table_1 (2).csv
- **Location:** `/Users/h0r03cw/Desktop/Coding/CA Analysis/Data Example/data_table_1 (2).csv`
- **Format:** Nash CSV
- **Stores:** 2082, 2242 (CA stores)
- **Carriers:** FOX, NTG, FDC
- **Rows:** Check after upload

### Screenshots Location
All screenshots should be saved to: `/Users/h0r03cw/Desktop/Coding/CA Analysis/docs/screenshots/`

### Naming Convention
- Format: `##-description.png`
- Example: `01-dashboard-initial.png`
- Use lowercase with hyphens

---

**End of Manual Test Script**
