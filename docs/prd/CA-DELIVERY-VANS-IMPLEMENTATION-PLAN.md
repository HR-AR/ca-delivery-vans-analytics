# CA Delivery Vans Analytics Tool - Implementation Plan

**Project Start Date**: 2025-10-13
**Status**: Planning Phase
**Deployment Target**: Render (Free/Starter Tier)

---

## 📋 Project Overview

### Goal
Create a web-based analytics dashboard for California 3P Delivery Vans (DFS) program, modeled after the existing Quick Analysis tool but focused on CA store performance metrics, CPD tracking, OTD rates, and vendor comparisons (FOX vs NTG).

### Source Inspiration
- **Base Project**: `/Users/h0r03cw/Desktop/Coding/Quick Analysis`
- **Tech Stack**: Node.js + TypeScript + Python (Pandas) + Express
- **Deployment**: Render with auto-deploy from Git

---

## 🎯 Business Requirements (From Screenshots)

### Key Metrics Dashboard Must Show:
1. **DFS Volume** - Total orders per day/week (e.g., "523 Orders", "911 Orders")
2. **Vans** - Average van cost (e.g., "$7.65 AVG", "$7.03 AVG")
3. **Total Orders** - Line chart by store (2082, 2242, 5930) over time
4. **CPD (Cost Per Delivery)** - Line chart showing:
   - Spark CPD (light blue)
   - Regular CPD (dark blue)
   - By store over dates
5. **OTD (On-Time Delivery)** - Line chart and % metric (e.g., "97.29% OTD", "97.89% OTD AVG")
6. **OTD by Carrier** - Bar chart comparing FOX vs NTG daily performance
7. **Key Highlights Section**:
   - Launches (e.g., "DFS Vans Launch: Operating in 3 CA Walmart stores with 3 vans")
   - Upcoming Launches (e.g., "CA/NWA Rollout: 10/8 - 18 CA Stores")

### Detailed Data Views:
From the spreadsheet images, the tool must support:
- **Store-level daily breakdowns**: Store ID, Date, Total Orders, Returns, Pending, Undelivered
- **Performance metrics**: OTD%, Van CPD, Target Batch Size, Target CPD, Spark YTD CPD, Delta vs Spark CPD
- **Vendor comparisons**: FOX vs NTG performance by store
- **Financial tracking**: Contract Price, Actual Van CPD, Orders Undelivered
- **Operational details**: BU, CBSA, Vans count, Vendor, First Van Launch date, Eligible Daily DFS Package

---

## 📊 Data Schema (CSV Format)

### Required Columns (From Image Analysis):
```
Store, Date, Wmt Wk, Total Orders, Returns, Pending, Undelivered, OTD,
Van CPD, Target Batch Size, Target CPD, Spark YTD CPD, Delta vs Spark CPD,
BU, CBSA, Vans, Vendor, First Van Launch, Eligible Daily DFS Package,
Contract Price ($), Actual Van CPD ($), Orders Undelivered
```

### Derived Metrics to Calculate:
- **DFS Volume**: Sum of Total Orders across all stores/dates in view
- **Average Van CPD**: Mean of Van CPD weighted by orders
- **OTD %**: (Total Orders - Undelivered) / Total Orders * 100
- **Carrier Comparison**: Group by Vendor (FOX/NTG), calculate avg OTD %
- **Spark Delta**: Target CPD - Spark YTD CPD

---

## 🏗️ Technical Architecture

### Tech Stack (Reuse from Quick Analysis):
- **Frontend**: HTML + Vanilla JavaScript (charts: Chart.js or similar)
- **Backend**: Node.js 20.x + TypeScript 5.x + Express.js
- **Analysis Engine**: Python 3.11 + Pandas + NumPy
- **Deployment**: Render (free tier initially)
- **File Upload**: Multer for CSV handling
- **Data Cleaning**: Reuse `data_cleaner.py` pattern

### File Structure:
```
CA Analysis/
├── src/
│   ├── ui-server.ts              # Express server (port 3000 local, 10000 Render)
│   ├── ca-dashboard-analysis.ts  # Main dashboard metrics
│   ├── ca-store-breakdown.ts     # Store-level details
│   ├── ca-vendor-comparison.ts   # FOX vs NTG analysis
│   ├── ca-cpd-tracking.ts        # CPD trends and targets
│   └── python-helper.ts          # Python script executor
├── scripts/analysis/
│   ├── ca_dashboard_metrics.py   # Calculate DFS volume, avg CPD, OTD
│   ├── ca_store_analysis.py      # Per-store daily breakdowns
│   ├── ca_vendor_analysis.py     # FOX vs NTG comparison
│   └── ca_cpd_analysis.py        # CPD trends, Spark delta
├── public/
│   ├── index.html                # Upload page
│   ├── dashboard.html            # Main dashboard view
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── charts.js             # Chart.js configurations
│       └── dashboard.js          # Frontend logic
├── uploads/                      # Temporary CSV storage
├── data_cleaner.py               # Reuse from Quick Analysis
├── requirements.txt              # Python deps
├── package.json                  # Node deps
├── tsconfig.json
├── render.yaml                   # Render deployment config
└── README.md
```

---

## 🎨 UI/UX Design (Walmart Branding)

### Color Scheme:
- **Primary Blue**: `#0071ce` (Walmart blue)
- **Navy Background**: `#041e42`
- **Charts**: Blue tones (`#0071ce`, `#00a0df`, `#ffc220` for highlights)
- **Success Green**: `#76c043`
- **Warning Red**: `#e02020`

### Layout (dashboard.html):
```
┌─────────────────────────────────────────────────────────────┐
│  🌟 3P CA Delivery Vans: Performance                         │
├─────────────────────────────────────────────────────────────┤
│  [DFS Volume]           [Vans]                              │
│  523 Orders             $7.65 AVG                           │
├─────────────────────────────────────────────────────────────┤
│  Total Orders Chart        │  CPD Chart                     │
│  (Line - by store)         │  (Spark vs Regular)            │
├─────────────────────────────────────────────────────────────┤
│  Unscheduled              │  Key Highlights                │
│  97.29% OTD               │  • Launches                    │
│                           │  • Upcoming Launches           │
│  OTD Chart                │                                │
├─────────────────────────────────────────────────────────────┤
│  OTD by Carrier (FOX vs NTG)                               │
│  Bar Chart - Daily Comparison                              │
├─────────────────────────────────────────────────────────────┤
│  [Download Reports] [View Details] [Filter: WK36 ▼]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Implementation Phases

### ✅ PHASE 1: Foundation (Week 1)
**Goal**: Get basic infrastructure running locally and on Render

- [ ] **P1.1**: Set up project structure in `CA Analysis/`
  - [ ] Initialize npm project (`package.json`)
  - [ ] Create folder structure (src/, scripts/analysis/, public/)
  - [ ] Copy base files from Quick Analysis (data_cleaner.py, python-helper.ts)
  - [ ] Set up TypeScript config

- [ ] **P1.2**: Create basic Express server (`ui-server.ts`)
  - [ ] Port 3000 locally, 10000 for Render
  - [ ] File upload endpoint (`POST /upload`)
  - [ ] Health check endpoint (`GET /health`)
  - [ ] Static file serving (public/)

- [ ] **P1.3**: Build upload interface (`public/index.html`)
  - [ ] CSV file upload form
  - [ ] Walmart branding/styling
  - [ ] Loading indicators

- [ ] **P1.4**: Set up Python environment
  - [ ] Create `requirements.txt` (pandas, numpy)
  - [ ] Test Python script execution from TypeScript

- [ ] **P1.5**: Deploy to Render
  - [ ] Create `render.yaml` config
  - [ ] Push to GitHub
  - [ ] Test deployment
  - [ ] Verify health check

**Success Criteria**: Can upload CSV, server runs on Render, Python executes

---

### ✅ PHASE 2: Core Analytics Engine (Week 2)
**Goal**: Implement Python analysis scripts for all key metrics

- [ ] **P2.1**: CA Dashboard Metrics (`ca_dashboard_metrics.py`)
  - [ ] Calculate DFS Volume (sum Total Orders)
  - [ ] Calculate Average Van CPD (weighted mean)
  - [ ] Calculate OTD % overall
  - [ ] Calculate Unscheduled % OTD
  - [ ] Output JSON summary

- [ ] **P2.2**: Store Analysis (`ca_store_analysis.py`)
  - [ ] Daily breakdown by store
  - [ ] Total Orders, Returns, Pending, Undelivered per store/day
  - [ ] OTD % per store/day
  - [ ] Output JSON time series data

- [ ] **P2.3**: Vendor Comparison (`ca_vendor_analysis.py`)
  - [ ] Group by Vendor (FOX vs NTG)
  - [ ] Calculate daily OTD % per vendor
  - [ ] Compare performance side-by-side
  - [ ] Output JSON for bar chart

- [ ] **P2.4**: CPD Tracking (`ca_cpd_analysis.py`)
  - [ ] Track Van CPD vs Target CPD vs Spark CPD
  - [ ] Calculate Delta vs Spark CPD
  - [ ] Time series by store
  - [ ] Output JSON for line charts

- [ ] **P2.5**: TypeScript wrappers for Python scripts
  - [ ] `ca-dashboard-analysis.ts` → calls ca_dashboard_metrics.py
  - [ ] `ca-store-breakdown.ts` → calls ca_store_analysis.py
  - [ ] `ca-vendor-comparison.ts` → calls ca_vendor_analysis.py
  - [ ] `ca-cpd-tracking.ts` → calls ca_cpd_analysis.py

- [ ] **P2.6**: Create API endpoints
  - [ ] `POST /api/dashboard` → dashboard metrics
  - [ ] `POST /api/stores` → store breakdown
  - [ ] `POST /api/vendors` → vendor comparison
  - [ ] `POST /api/cpd` → CPD tracking

**Success Criteria**: All analysis scripts return correct JSON, API endpoints functional

---

### ✅ PHASE 3: Dashboard UI (Week 3)
**Goal**: Build interactive dashboard with charts

- [ ] **P3.1**: Set up Chart.js
  - [ ] Install Chart.js via CDN or npm
  - [ ] Create chart configurations (`public/js/charts.js`)
  - [ ] Test sample charts

- [ ] **P3.2**: Build dashboard.html layout
  - [ ] Walmart branded header
  - [ ] 6 chart containers (Total Orders, CPD, OTD, Vendor Comparison, etc.)
  - [ ] Key metrics cards (DFS Volume, Avg Van CPD)
  - [ ] Key Highlights section

- [ ] **P3.3**: Implement Total Orders Chart
  - [ ] Fetch data from `/api/stores`
  - [ ] Line chart with 3 series (Store 2082, 2242, 5930)
  - [ ] X-axis: Date, Y-axis: Orders

- [ ] **P3.4**: Implement CPD Chart
  - [ ] Fetch data from `/api/cpd`
  - [ ] Dual line chart (Spark CPD vs Regular CPD)
  - [ ] Color-coded by store

- [ ] **P3.5**: Implement OTD Chart
  - [ ] Fetch data from `/api/stores`
  - [ ] Line chart showing OTD % over time per store
  - [ ] Yellow line

- [ ] **P3.6**: Implement Vendor Comparison Chart
  - [ ] Fetch data from `/api/vendors`
  - [ ] Grouped bar chart (FOX vs NTG per day)
  - [ ] Color: Dark blue (FOX), Light blue (NTG)

- [ ] **P3.7**: Implement Key Metrics Cards
  - [ ] DFS Volume card (sum from `/api/dashboard`)
  - [ ] Avg Van CPD card (from `/api/dashboard`)
  - [ ] Unscheduled OTD % card

- [ ] **P3.8**: Add interactivity
  - [ ] Week filter dropdown (WK 36, WK 35, etc.)
  - [ ] Date range picker (optional)
  - [ ] Download buttons (CSV, JSON, PDF)
  - [ ] Loading spinners during analysis

- [ ] **P3.9**: Responsive design
  - [ ] Mobile-friendly layout (stack charts vertically)
  - [ ] Test on tablet/phone browsers

**Success Criteria**: Dashboard displays all charts with real data, filters work

---

### ✅ PHASE 4: Advanced Features (Week 4)
**Goal**: Add detailed views and export functionality

- [ ] **P4.1**: Store Detail View
  - [ ] New page: `store-details.html?store=2082`
  - [ ] Day-by-day breakdown table
  - [ ] Individual store performance charts
  - [ ] Link from dashboard (click store in chart)

- [ ] **P4.2**: Export Functionality
  - [ ] Export dashboard summary as CSV
  - [ ] Export charts as PNG (Chart.js built-in)
  - [ ] Export raw analysis JSON
  - [ ] "Download All" button

- [ ] **P4.3**: Key Highlights Editor (Optional)
  - [ ] Admin page to edit highlights
  - [ ] Store in JSON file or environment variables
  - [ ] Display on dashboard

- [ ] **P4.4**: Data Validation & Error Handling
  - [ ] Check required columns on upload
  - [ ] Handle missing data gracefully (show warnings)
  - [ ] Display data quality report
  - [ ] Show column mapping tool if headers mismatch

- [ ] **P4.5**: Performance Optimization
  - [ ] Cache analysis results (1 hour TTL)
  - [ ] Lazy load charts (IntersectionObserver)
  - [ ] Compress CSV uploads (gzip)
  - [ ] Add CDN for Chart.js

**Success Criteria**: Full feature set working, handles edge cases, exports work

---

### ✅ PHASE 5: Testing & Polish (Week 5)
**Goal**: Production-ready with documentation

- [ ] **P5.1**: Automated Testing
  - [ ] Jest tests for TypeScript functions
  - [ ] Python unit tests (pytest) for analysis scripts
  - [ ] Integration tests for API endpoints
  - [ ] E2E tests (Playwright) for critical flows

- [ ] **P5.2**: Data Testing
  - [ ] Test with sample CSV from screenshots
  - [ ] Test with empty CSV (edge case)
  - [ ] Test with malformed data
  - [ ] Test with very large CSV (10k+ rows)

- [ ] **P5.3**: UI/UX Polish
  - [ ] Fix any visual bugs
  - [ ] Add tooltips to charts
  - [ ] Improve error messages
  - [ ] Add onboarding hints (first-time users)

- [ ] **P5.4**: Documentation
  - [ ] README.md with setup instructions
  - [ ] CSV format documentation
  - [ ] API documentation (endpoints)
  - [ ] User guide with screenshots
  - [ ] Deployment guide (Render)

- [ ] **P5.5**: Security Hardening
  - [ ] File size limits on uploads (10MB max)
  - [ ] File type validation (CSV only)
  - [ ] Rate limiting on API endpoints
  - [ ] HTTPS enforcement on Render

- [ ] **P5.6**: Performance Testing
  - [ ] Load test with 100 concurrent users (Artillery)
  - [ ] Check response times (< 2s for analysis)
  - [ ] Optimize slow queries
  - [ ] Monitor memory usage

**Success Criteria**: All tests pass, documentation complete, ready for users

---

## 🚀 Deployment Checklist

### Render Configuration (`render.yaml`):
```yaml
services:
  - type: web
    name: ca-delivery-vans-dashboard
    runtime: node
    region: oregon
    plan: free  # Upgrade to starter if needed
    branch: main
    buildCommand: |
      npm install
      npm run build
      pip install -r requirements.txt
    startCommand: node dist/ui-server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: PYTHON_VERSION
        value: 3.11.9
    healthCheckPath: /health
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 1
    autoDeploy: true
```

### Pre-Deployment Checklist:
- [ ] GitHub repo created and code pushed
- [ ] Environment variables set in Render dashboard (if any)
- [ ] Health check endpoint returns 200 OK
- [ ] Build command succeeds locally
- [ ] Python scripts executable and dependencies installed
- [ ] Uploaded files cleaned up after analysis (prevent disk fill)

---

## 📦 Dependencies

### Node.js (package.json):
```json
{
  "name": "ca-delivery-vans-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/ui-server.ts",
    "build": "tsc",
    "start": "node dist/ui-server.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

### Python (requirements.txt):
```
pandas>=2.0.0
numpy>=1.24.0
openpyxl>=3.1.0  # If Excel support needed
```

---

## 📈 Success Metrics

### Technical KPIs:
- [ ] **Uptime**: > 99% (Render free tier allows some downtime)
- [ ] **Response Time**: < 3s for dashboard load, < 5s for analysis
- [ ] **Data Accuracy**: 100% match with manual Excel calculations (spot check)
- [ ] **Error Rate**: < 1% of uploads fail (with clear error messages)

### Business KPIs:
- [ ] Replaces manual Excel tracking (saves 2+ hours/week per analyst)
- [ ] All 3 CA stores (2082, 2242, 5930) tracked daily
- [ ] CPD trends visible at-a-glance (no manual calculations)
- [ ] FOX vs NTG comparison automated (weekly review enabled)

---

## 🛠️ Maintenance & Future Enhancements

### Post-Launch (Phase 6+):
- [ ] Add alerting (email/Slack) when OTD < 95%
- [ ] Implement user authentication (if multi-team access needed)
- [ ] Add historical data comparison (WoW, MoM trends)
- [ ] Integrate with Walmart APIs (if available) for auto-data fetch
- [ ] Build mobile app (React Native) for on-the-go access
- [ ] Add predictive analytics (forecast OTD, CPD trends)

---

## 🔗 Resources

### Reference Projects:
- **Quick Analysis**: `/Users/h0r03cw/Desktop/Coding/Quick Analysis/`
- **Screenshots**: `/Users/h0r03cw/Desktop/Coding/CA Analysis/Requirements/`

### Documentation:
- [Render Deployment Docs](https://render.com/docs)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [Pandas Docs](https://pandas.pydata.org/docs/)
- [Express.js Docs](https://expressjs.com/)

---

## 📝 Notes & Assumptions

1. **Data Source**: Assumes CSV export from existing Walmart system (see screenshot format)
2. **Stores**: Initially 3 CA stores (2082, 2242, 5930), expandable to 18 stores post-rollout
3. **Vendors**: FOX and NTG only (may expand to others)
4. **Update Frequency**: Manual CSV upload initially; can automate later
5. **Access**: Internal tool (no public access), hosted on private Render instance
6. **Cost**: Render free tier sufficient for MVP; upgrade to $7/mo Starter if traffic increases

---

## ✅ Next Steps (After Plan Approval)

1. **User Reviews This Plan** - Add comments, request changes
2. **Generate PRP** - Run `npm run prp "ca-delivery-vans-dashboard"`
3. **Kick Off Phase 1** - Set up project structure and deploy skeleton to Render
4. **Weekly Check-ins** - Review progress, adjust timeline as needed

---

**Last Updated**: 2025-10-13
**Plan Status**: 🟡 Awaiting User Approval
