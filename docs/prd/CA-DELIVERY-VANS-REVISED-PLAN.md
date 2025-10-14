# CA Delivery Vans Analytics Tool - REVISED IMPLEMENTATION PLAN

**Project Start Date**: 2025-10-13
**Status**: 🟡 Plan Revision - Awaiting Approval
**Deployment Target**: Render (Free/Starter Tier)
**Execution Strategy**: Parallel Agent Development + Continuous Integration

---

## 📊 REQUIREMENTS ANALYSIS (From Deep Slack Review)

### Key Stakeholders & Needs:
- **Arvind Prabu**: Executive oversight, wants $5 CPD target, automated dashboard
- **Mario Espino**: Operations, tracks volume triggers and vendor performance
- **Aishwarya (Ash) Abraham**: Analytics lead, needs daily automated data pulls
- **Ashwin Gowda**: Engineering lead, wants granular vendor metrics
- **Brahmani (Brahmi)**: Financial analytics, catches CPD contractual calculations

### Critical Requirements from Slack:

#### 1. **CPD Target & Threshold**
   - **Target**: < $5.00 CPD (long-term scaling goal per Arvind)
   - **Current Performance**: $5.59 - $8.22 range (varies by store)
   - **Comparison Baseline**: Spark CPD (includes Prop22 charges)
   - **Key Insight**: "Our goal should be to be lower than $5, for vans to scale long term"

#### 2. **Store-Specific Context**
   - **Store 2082**: High-volume DFS (~340 daily packages, ~170 eligible after 7AM trigger)
   - **Store 2242**: Medium-volume DFS (~243 daily, ~145 eligible)
   - **Store 5930**: Low-volume DFS + IP (~156 daily, ~94 eligible) - **HAS CARRYOVER ISSUES**
   - **All 3 stores**: InHome activated, 7AM trigger captures only ~60% of DFS demand
   - **New Trigger**: 4:30AM "Smart Trigger Orphan Hold" to capture 50% of demand before InHome 4:50AM

#### 3. **Vendor Performance Tracking (CRITICAL)**
   From Ashwin's request for FOX, FDC, NTG in CA:
   - **Time on-road** (dispatch to last package)
   - **Time between stops** (efficiency metric)
   - **Doorstep time** (delivery time at customer door)
   - **Time remaining after last package** (contracted time - actual time)
   - **Batch density optimization** (target: 100 packages/batch, current varies)
   - **Purpose**: (1) Benchmark best-in-class, (2) Determine true van potential, (3) Update financial models, (4) Compare "broker model" (FDC/FOX) vs "DSP" (NTG)

#### 4. **Contractual Calculation Accuracy**
   - Mario's update: "CPD was missing a contractual calculation" (caught by Brahmi)
   - **Implication**: Van CPD must include ALL contractual costs (not just base rate)
   - **Rate Card System**: Need vendor-specific rate adjustments with backend storage

#### 5. **Data Source**
   - **Implementation**: CSV upload only (no Project Central integration needed per user)

#### 6. **Visual Design Feedback**
   - Arvind's request: "Move the date to the first column, then store before plotting the chart"
   - Ashwin's feedback: "The line graph doesn't make sense when you overlay multiple store that way - instead have each line for a store with different colors"
   - **Implication**: Multi-line charts must be color-coded by store, not overlaid by store on same date

---

## 🎯 REVISED DATA SCHEMA

### CSV Columns (from `data_table_1 (2).csv`):

**Trip-Level Data**:
```
Carrier, Date, Store Id, Walmart Trip Id, Courier Name,
Pickup Enroute, Pickup Arrived, Load Start Time, Load End Time, Pickup Complete, Last Dropoff Complete,
Trip Planned Start, Driver Dwell Time, Driver Load Time, Driver Sort Time, Driver Store Time,
Trip Actual Time, Driver Total Time, Estimated Duration, Headroom,
Total Orders, Failed Pickups, Driver Accepted Orders, Delivered Orders, Returned Orders,
Returned Attempted Orders, Returned Not Attempted Orders, Pending Orders,
Drops Per Hour Trip, Drops Per Hour Total, Adjusted Cddr, Returned Orders Rate,
Failed Orders, Failed Orders Rate, Pending Orders Rate, Is Pickup Arrived Ontime
```

### Additional Metrics to CALCULATE (not in CSV):

From screenshot analysis + Slack requirements:
```
Van CPD = (Contract Price * adjustment_factor) / Delivered Orders
Spark YTD CPD = [from historical baseline or user input]
Delta vs Spark CPD = Van CPD - Spark CPD
Target CPD = $5.00 (or user-adjustable per vendor)
Target Batch Size = [user input per store, default 92-137 based on screenshots]
Actual Batch Size = Total Orders per trip
OTD % = (Total Orders - Undelivered) / Total Orders * 100
Undelivered = Failed Pickups + Pending Orders + Returns
Time on-road = Last Dropoff Complete - Pickup Complete
Time between stops = (Trip Actual Time - Doorstep Time) / (Delivered Orders - 1)
Doorstep time = [requires breakdown not in CSV - use avg heuristic]
Time remaining = Estimated Duration - Driver Total Time
DFS Volume = SUM(Total Orders) [per day/week]
Eligible Daily DFS Package = [from Slack: ~60% of Total Orders with 7AM trigger, ~50% with 4:30AM trigger]
```

---

## 🏗️ VENDOR RATE CARD SYSTEM

### Problem:
- Different vendors (FOX, NTG, FDC) have different contracted rates
- Rates vary by state (CA vs others) and package volume tiers (80 vs 100 packages)
- From screenshot: CA base rates $380-$390 for 80 packages, $390-$400 for 100 packages
- **Contractual adjustments** not reflected in base CSV data (per Brahmi's catch)
- **User confirmed**: Base rates are correct (FOX $380/390, NTG $390/400, FDC $385/395)
- **Contractual adjustment factor source**: Inferred from Slack (Brahmi caught missing costs), actual value unknown - defaulting to 1.00x until Finance team provides real values

### Solution: Backend Rate Card Manager

#### Database Schema (`rate_cards.json`):
```json
{
  "vendors": {
    "FOX": {
      "state": "CA",
      "base_rate_80": 380.00,
      "base_rate_100": 390.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed base rates. Adjustment factor: default 1.00 (no markup) - update with actual contractual costs from Finance team",
      "last_updated": "2025-10-13"
    },
    "NTG": {
      "state": "CA",
      "base_rate_80": 390.00,
      "base_rate_100": 400.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed base rates. Adjustment factor: default 1.00 (no markup) - update with actual contractual costs from Finance team",
      "last_updated": "2025-10-13"
    },
    "FDC": {
      "state": "CA",
      "base_rate_80": 385.00,
      "base_rate_100": 395.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed base rates. Adjustment factor: default 1.00 (no markup) - update with actual contractual costs from Finance team",
      "last_updated": "2025-10-13"
    }
  },
  "default_target_cpd": 5.00,
  "spark_ytd_cpd_baseline": {
    "2082": 5.60,
    "2242": 5.84,
    "5930": 7.76
  },
  "editable_fields": ["base_rate_80", "base_rate_100", "contractual_adjustment", "spark_ytd_cpd_baseline", "default_target_cpd"]
}
```

#### UI Components:
1. **Admin Page** (`/admin/rate-cards`):
   - Edit vendor base rates (80pkg, 100pkg)
   - Set contractual adjustment factors (default 1.00, editable)
     - Help text: "Contractual Adjustment Factor (e.g., 1.05 = 5% markup for fuel/insurance/admin fees). Contact Finance team (Brahmi) for actual values."
   - **Update Spark YTD CPD baselines per store** (user-requested: make editable)
   - Update default target CPD ($5.00, editable)
   - Set target batch sizes per store

2. **CPD Calculation Engine**:
   ```typescript
   function calculateVanCPD(
     orders: number,
     vendor: string,
     state: string,
     rateCard: RateCard
   ): number {
     const vendorRate = rateCard.vendors[vendor];
     const baseRate = orders >= 100 ? vendorRate.base_rate_100 : vendorRate.base_rate_80;
     const contractPrice = baseRate * vendorRate.contractual_adjustment;
     return contractPrice / orders;
   }
   ```

3. **Default Values** (User-Confirmed):
   - FOX CA: $380 (80pkg), $390 (100pkg), **1.00x adjustment** (no markup by default)
   - NTG CA: $390 (80pkg), $400 (100pkg), **1.00x adjustment** (no markup by default)
   - FDC CA: $385 (80pkg), $395 (100pkg), **1.00x adjustment** (no markup by default)
   - Target CPD: $5.00 **(editable)**
   - Spark CPD: Store 2082 = $5.60, Store 2242 = $5.84, Store 5930 = $7.76 **(user-confirmed, editable per store)**

   **Note**: User can hardwire actual contractual adjustment values later via admin UI

4. **Backend Storage**:
   - JSON file: `/data/rate_cards.json` (persisted on Render disk)
   - API endpoints:
     - `GET /api/rate-cards` - Retrieve current rates
     - `POST /api/rate-cards` - Update rates (admin only)
     - `GET /api/rate-cards/history` - Audit log

---

## 📈 DASHBO ARD REQUIREMENTS (Final)

### Main Dashboard (`/dashboard`):

#### Top Metrics Cards:
```
┌─────────────────────────────────────────────────────────────┐
│  [DFS Volume]           [Vans Count]        [Avg Van CPD]   │
│  911 Orders             3 Active             $7.03          │
│  ↑ 12% vs WK35         FOX:1, NTG:2          ↓ vs Spark    │
└─────────────────────────────────────────────────────────────┘
```

#### Chart 1: Total Orders by Store (Multi-Line, Color-Coded)
- **X-Axis**: Date
- **Y-Axis**: Total Orders
- **Lines**:
  - Store 2082 (Blue #0071ce)
  - Store 2242 (Light Blue #00a0df)
  - Store 5930 (Orange #ffc220) - **Highlight carryover days with marker**
- **Interaction**: Click line → drill into store detail view

#### Chart 2: CPD Comparison (Multi-Line)
- **X-Axis**: Date
- **Y-Axis**: CPD ($)
- **Lines**:
  - Van CPD (per store, color-coded)
  - Spark YTD CPD (per store, dashed line)
  - Target CPD ($5.00, red dashed line)
- **Annotations**: Show contractual adjustments in tooltip

#### Chart 3: OTD % by Store & Carrier (Combo Chart)
- **X-Axis**: Date
- **Y-Axis Left**: OTD %
- **Y-Axis Right**: Undelivered Count
- **Bars**: Undelivered orders (stacked: Failed Pickups, Pending, Returns)
- **Line**: OTD % trend
- **Filters**: By Carrier (FOX/NTG/FDC)

#### Chart 4: Vendor Performance Comparison (Multi-Metric)
Based on Ashwin's request:
```
┌──────────────────────────────────────────────────────────────┐
│ Vendor  │ Time On-Road │ Time Between Stops │ Doorstep Time │
│ FOX     │   4.2 hrs    │      3.5 min       │    1.2 min    │
│ NTG     │   3.8 hrs    │      3.1 min       │    1.0 min    │
│ FDC     │   4.5 hrs    │      4.0 min       │    1.5 min    │
│         │ Time Remaining│ Batch Density     │ CPD           │
│ FOX     │   0.5 hrs    │      82 orders     │  $6.85        │
│ NTG     │   1.2 hrs    │      95 orders     │  $6.20        │
│ FDC     │   0.3 hrs    │      75 orders     │  $7.10        │
└──────────────────────────────────────────────────────────────┘
```

#### Chart 5: Batch Density vs Target (Scatter)
- **X-Axis**: Date
- **Y-Axis**: Batch Size (orders)
- **Points**: Each trip (color by vendor)
- **Target Line**: Store-specific target (92/81/137 from screenshots)
- **Purpose**: Visualize optimization opportunities

#### Key Highlights Section:
```markdown
### Launches
- DFS Vans Launch: Operating in 3 CA Walmart stores (2082, 2242, 5930) with 3 vans
- New Vendor Onboarded: FOX
- Trigger Update: 4:30AM Smart Trigger Orphan Hold (expected +20% volume capture)

### Upcoming Launches
- **ON HOLD**: CA/NWA Rollout to 18 stores (pending Store Ops approval)
- **DELAYED**: NWA DFS launch (3 vans) - Store Ops doesn't want to disrupt current operations

### Alerts
- ⚠️ Store 5930: Carryover volume detected (IP store)
- ⚠️ Batch Density: Below target on 3 trips (10/7/2025)
- ✅ CPD Improvement: $7.65 → $7.03 AVG (WK35 to WK36)
```

---

## 🚀 PARALLEL AGENT EXECUTION STRATEGY

### Goal:
Utilize multiple agents working concurrently to accelerate development, with cross-agent validation.

### Agent Team Structure:

#### **Agent 1: Backend Infrastructure Lead**
**Responsibility**: Server, APIs, Data Processing
- [ ] Set up Express server (`ui-server.ts`)
- [ ] Create file upload endpoint with Multer
- [ ] Build rate card API (`/api/rate-cards`)
- [ ] Implement Python execution helper
- [ ] Set up Render deployment config
- [ ] Create health check endpoint

**Deliverables**:
- `src/ui-server.ts`
- `src/api/rate-cards.ts`
- `src/python-helper.ts`
- `render.yaml`
- `package.json`

**Validation Checklist**:
- [ ] Server starts on port 3000 locally
- [ ] File upload accepts CSV
- [ ] Rate card CRUD endpoints work
- [ ] Python scripts execute from Node
- [ ] Health check returns 200 OK

---

#### **Agent 2: Python Analytics Engine Lead**
**Responsibility**: Data analysis scripts
- [ ] Create `ca_dashboard_metrics.py` (DFS volume, avg CPD, OTD)
- [ ] Create `ca_store_analysis.py` (daily breakdowns by store)
- [ ] Create `ca_vendor_analysis.py` (FOX vs NTG vs FDC comparison)
- [ ] Create `ca_cpd_analysis.py` (CPD trends, Spark delta)
- [ ] Create `ca_batch_density.py` (batch optimization analysis)
- [ ] Create `ca_vendor_performance.py` (time on-road, time between stops, etc.)

**Deliverables**:
- `scripts/analysis/ca_dashboard_metrics.py`
- `scripts/analysis/ca_store_analysis.py`
- `scripts/analysis/ca_vendor_analysis.py`
- `scripts/analysis/ca_cpd_analysis.py`
- `scripts/analysis/ca_batch_density.py`
- `scripts/analysis/ca_vendor_performance.py`

**Validation Checklist**:
- [ ] Each script runs standalone with sample CSV
- [ ] Output JSON matches expected schema
- [ ] Handles edge cases (missing data, zero orders, etc.)
- [ ] Rate card integration works
- [ ] All metrics from Slack requirements calculated

---

#### **Agent 3: Frontend UI/UX Lead**
**Responsibility**: Dashboard, charts, user interface
- [ ] Create upload page (`public/index.html`)
- [ ] Create dashboard page (`public/dashboard.html`)
- [ ] Set up Chart.js multi-line charts
- [ ] Implement vendor performance table
- [ ] Create rate card admin page
- [ ] Add filters (date range, store, vendor)
- [ ] Implement Walmart branding

**Deliverables**:
- `public/index.html`
- `public/dashboard.html`
- `public/admin/rate-cards.html`
- `public/css/styles.css`
- `public/js/dashboard.js`
- `public/js/charts.js`
- `public/js/admin.js`

**Validation Checklist**:
- [ ] Upload page accepts CSV
- [ ] Dashboard displays all 5 charts
- [ ] Multi-line charts color-coded correctly
- [ ] Admin page saves rate cards
- [ ] Responsive on mobile/tablet
- [ ] Walmart colors applied

---

#### **Agent 4: Integration & Testing Lead**
**Responsibility**: End-to-end testing, deployment validation
- [ ] Write integration tests (Jest)
- [ ] Test full CSV upload → analysis → display flow
- [ ] Validate rate card calculations match Brahmi's requirements
- [ ] Test with real data from `data_table_1 (2).csv`
- [ ] Performance testing (100+ trips)
- [ ] Deploy to Render and smoke test

**Deliverables**:
- `tests/integration/upload-flow.test.ts`
- `tests/integration/rate-card.test.ts`
- `tests/integration/vendor-comparison.test.ts`
- `tests/unit/cpd-calculator.test.ts`
- `docs/TEST_RESULTS.md`

**Validation Checklist**:
- [ ] All integration tests pass
- [ ] CPD matches expected values from screenshots
- [ ] Vendor comparison metrics correct
- [ ] Deployed app accessible on Render
- [ ] No regressions from Quick Analysis base

---

### Agent Synchronization Points:

**Daily Standups (Async via Document Updates)**:
- Each agent updates their section in `PROGRESS.md`
- Blockers flagged with **🚨**
- Completed items checked off with **✅**
- Cross-agent dependencies noted

**Integration Checkpoints**:
1. **Checkpoint 1** (End of Day 1): Backend + Python integration test
   - Backend agent passes CSV to Python agent's script
   - Python returns JSON, Backend serves it via API

2. **Checkpoint 2** (End of Day 2): Frontend + Backend integration test
   - Frontend uploads CSV, calls Backend API
   - Dashboard renders charts from API response

3. **Checkpoint 3** (End of Day 3): Full system integration
   - Integration agent runs E2E test
   - All 4 agents review test results, fix bugs

4. **Checkpoint 4** (End of Day 4): Deploy and validate
   - Deploy to Render
   - All agents test deployed version
   - Fix deployment issues

---

## 📋 REVISED IMPLEMENTATION PHASES

### ✅ PHASE 1: Foundation & Rate Card System (2 Days)
**Agents**: Backend (Lead), Python (Support), Frontend (Prototype)

#### Day 1:
- [ ] **Backend**: Express server + file upload + rate card API
- [ ] **Python**: Rate card integration in CPD calculator
- [ ] **Frontend**: Basic upload page + admin page prototype
- [ ] **Integration**: Test rate card CRUD operations

#### Day 2:
- [ ] **Backend**: Deploy skeleton to Render
- [ ] **Python**: Test CPD calculations with rate cards
- [ ] **Frontend**: Style admin page with Walmart branding
- [ ] **Integration**: Verify rate card persistence on Render

**Success Criteria**:
- ✅ Server runs on Render
- ✅ Can upload CSV
- ✅ Rate cards saved and retrieved correctly
- ✅ CPD calculations match screenshots (within 5%)

---

### ✅ PHASE 2: Core Analytics (3 Days)
**Agents**: Python (Lead), Backend (Integration), Testing (Validation)

#### Day 3:
- [ ] **Python**: Dashboard metrics + Store analysis scripts
- [ ] **Backend**: API endpoints for dashboard + stores
- [ ] **Testing**: Unit tests for Python scripts

#### Day 4:
- [ ] **Python**: Vendor comparison + CPD analysis scripts
- [ ] **Backend**: API endpoints for vendors + CPD
- [ ] **Testing**: Integration tests for API responses

#### Day 5:
- [ ] **Python**: Batch density + Vendor performance scripts
- [ ] **Backend**: API endpoints for batch + vendor perf
- [ ] **Testing**: Validate all Slack requirements covered

**Success Criteria**:
- ✅ All 6 Python scripts working
- ✅ All API endpoints return correct JSON
- ✅ Vendor performance metrics (time on-road, etc.) calculated
- ✅ Integration tests pass

---

### ✅ PHASE 3: Dashboard UI (3 Days)
**Agents**: Frontend (Lead), Backend (Support), Testing (UX Validation)

#### Day 6:
- [ ] **Frontend**: Chart 1 (Total Orders) + Chart 2 (CPD Comparison)
- [ ] **Backend**: Optimize API response times
- [ ] **Testing**: Visual regression tests

#### Day 7:
- [ ] **Frontend**: Chart 3 (OTD %) + Chart 4 (Vendor Performance)
- [ ] **Backend**: Add caching layer (1 hour TTL)
- [ ] **Testing**: Cross-browser testing

#### Day 8:
- [ ] **Frontend**: Chart 5 (Batch Density) + Key Highlights section
- [ ] **Backend**: Finalize filters (date, store, vendor)
- [ ] **Testing**: Mobile responsiveness

**Success Criteria**:
- ✅ All 5 charts render correctly
- ✅ Multi-line charts color-coded by store (per Ashwin feedback)
- ✅ Date column first, then store (per Arvind feedback)
- ✅ Admin can edit rate cards and see updated CPD immediately
- ✅ Responsive on mobile

---

### ✅ PHASE 4: Advanced Features (2 Days)
**Agents**: All (Collaborative)

#### Day 9:
- [ ] **Frontend**: Store detail drill-down page
- [ ] **Python**: Export functionality (CSV, JSON, PDF)
- [ ] **Backend**: Download endpoints
- [ ] **Testing**: E2E test for drill-down

#### Day 10:
- [ ] **Frontend**: Carryover volume markers (Store 5930)
- [ ] **Python**: Trigger impact analysis (4:30AM vs 7AM)
- [ ] **Backend**: API for trigger comparisons
- [ ] **Testing**: Validate carryover detection

**Success Criteria**:
- ✅ Can click chart → drill into store details
- ✅ Download buttons work (CSV, JSON, PDF)
- ✅ Store 5930 carryover days highlighted
- ✅ Trigger analysis shows expected volume lift

---

### ✅ PHASE 5: Polish & Deploy (2 Days)
**Agents**: Testing (Lead), All (Bug Fixes)

#### Day 11:
- [ ] **Testing**: Load testing (1000+ trips)
- [ ] **Testing**: Security audit (file upload limits, rate limiting)
- [ ] **All Agents**: Fix critical bugs
- [ ] **Frontend**: Final UX polish

#### Day 12:
- [ ] **All Agents**: Documentation (README, user guide, API docs)
- [ ] **Testing**: Final smoke test on Render
- [ ] **Backend**: Set up monitoring (health checks)
- [ ] **All Agents**: Demo prep

**Success Criteria**:
- ✅ All tests pass (unit + integration + E2E)
- ✅ Documentation complete
- ✅ Deployed to Render and accessible
- ✅ Ready for user demo

---

## 🔐 VALIDATION GATES

After each phase, ALL agents must validate:

### Technical Validation:
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run build` succeeds
- [ ] Deployed app health check returns 200 OK

### Business Validation:
- [ ] CPD calculations match Brahmi's contractual requirements
- [ ] Vendor comparison shows all metrics Ashwin requested
- [ ] Charts follow Arvind/Ashwin visual feedback
- [ ] Rate cards adjustable by admin
- [ ] Target CPD ($5.00) visible on all charts

### User Acceptance:
- [ ] Upload CSV → See dashboard in < 5 seconds
- [ ] All 3 stores (2082, 2242, 5930) tracked correctly
- [ ] Store 5930 carryover volume flagged
- [ ] FOX vs NTG comparison clear

---

## 📁 FINAL FILE STRUCTURE

```
CA Analysis/
├── src/
│   ├── ui-server.ts              [Agent 1]
│   ├── api/
│   │   ├── dashboard.ts          [Agent 1]
│   │   ├── stores.ts             [Agent 1]
│   │   ├── vendors.ts            [Agent 1]
│   │   ├── cpd.ts                [Agent 1]
│   │   └── rate-cards.ts         [Agent 1]
│   ├── utils/
│   │   ├── python-helper.ts      [Agent 1]
│   │   └── cpd-calculator.ts     [Agent 1]
│   └── types/
│       ├── RateCard.ts           [Agent 1]
│       └── VendorMetrics.ts      [Agent 1]
├── scripts/analysis/
│   ├── ca_dashboard_metrics.py   [Agent 2]
│   ├── ca_store_analysis.py      [Agent 2]
│   ├── ca_vendor_analysis.py     [Agent 2]
│   ├── ca_cpd_analysis.py        [Agent 2]
│   ├── ca_batch_density.py       [Agent 2]
│   └── ca_vendor_performance.py  [Agent 2]
├── public/
│   ├── index.html                [Agent 3]
│   ├── dashboard.html            [Agent 3]
│   ├── admin/
│   │   └── rate-cards.html       [Agent 3]
│   ├── css/
│   │   └── styles.css            [Agent 3]
│   └── js/
│       ├── dashboard.js          [Agent 3]
│       ├── charts.js             [Agent 3]
│       └── admin.js              [Agent 3]
├── tests/
│   ├── unit/                     [Agent 4]
│   └── integration/              [Agent 4]
├── data/
│   └── rate_cards.json           [Backend persisted]
├── uploads/                      [Temporary]
├── docs/
│   ├── prd/
│   │   ├── PRD.md
│   │   ├── CA-DELIVERY-VANS-IMPLEMENTATION-PLAN.md
│   │   └── CA-DELIVERY-VANS-REVISED-PLAN.md (this file)
│   ├── PROGRESS.md               [All agents update daily]
│   ├── API.md                    [Agent 1]
│   ├── USER_GUIDE.md             [Agent 3]
│   └── TEST_RESULTS.md           [Agent 4]
├── data_cleaner.py               [Reuse from Quick Analysis]
├── requirements.txt              [Agent 2]
├── package.json                  [Agent 1]
├── tsconfig.json                 [Agent 1]
├── render.yaml                   [Agent 1]
├── .gitignore
└── README.md
```

---

## 🎯 SUCCESS METRICS

### Technical KPIs:
- [ ] **Uptime**: > 99% on Render
- [ ] **Response Time**: Dashboard load < 3s, Analysis < 5s
- [ ] **Data Accuracy**: CPD calculations match manual Excel within 2%
- [ ] **Test Coverage**: > 80% unit test coverage, 100% critical path E2E

### Business KPIs (From Slack Insights):
- [ ] **CPD Tracking**: Real-time Van CPD vs Spark CPD vs $5 Target
- [ ] **Vendor Comparison**: FOX vs NTG performance metrics visible
- [ ] **Volume Insights**: 4:30AM trigger impact quantified
- [ ] **Carryover Detection**: Store 5930 IP volume flagged automatically
- [ ] **Data Upload**: CSV-based manual upload (no automation needed per user)

### User Adoption:
- [ ] Replaces manual Excel tracking (saves 5+ hours/week per analyst)
- [ ] Used by Arvind, Mario, Ash, Ashwin, Brahmi teams
- [ ] Dashboard reviewed in weekly ops meetings
- [ ] Rate card admin accessed by finance team

---

## 🔮 FUTURE ENHANCEMENTS (Post-Launch)

### Phase 6: Alerting & Notifications
- [ ] Slack alerts when CPD > $5.00
- [ ] Email alerts for carryover volume detection
- [ ] SMS alerts for OTD < 95%

### Phase 7: Predictive Analytics
- [ ] Forecast CPD trends based on volume growth
- [ ] Recommend optimal trigger times per store
- [ ] Batch density optimization suggestions

### Phase 8: Expanded Scope
- [ ] Support NWA stores (18 stores post-launch)
- [ ] Add more vendors beyond FOX/NTG/FDC
- [ ] Multi-state comparison (CA vs NWA vs others)

---

## 🚨 RISK MITIGATION

### Risk 1: CPD Calculation Errors
**Mitigation**: Agent 4 validates all CPD calculations against screenshots + Brahmi's contractual requirements

### Risk 2: Agent Conflicts/Blockers
**Mitigation**: Daily async standups in `PROGRESS.md`, integration checkpoints every 2 days

### Risk 3: Render Deployment Issues
**Mitigation**: Agent 1 deploys skeleton on Day 2, continuous deployment thereafter

### Risk 4: Data Quality Issues
**Mitigation**: Reuse `data_cleaner.py` from Quick Analysis, validate with real data

### Risk 5: Scope Creep
**Mitigation**: Lock requirements from Slack analysis, CSV-only data source (no automation per user request)

---

## ✅ NEXT STEPS (For User Approval)

1. **Review this revised plan** - Confirm all Slack requirements captured
2. **Validate rate card assumptions** - Confirm vendor rates, contractual adjustments
3. **Approve parallel agent strategy** - Confirm 4-agent team structure
4. **Kick off Phase 1** - Once approved, all 4 agents start simultaneously

---

**User Feedback Incorporated** (2025-10-13):
1. ✅ Vendor rates confirmed: FOX $380/390, NTG $390/400, FDC $385/395
2. ✅ Contractual adjustment: Set to 1.00x default (no markup), editable via admin UI - user to hardwire actual values later
3. ✅ Spark CPD: Made editable per store via admin UI
4. ✅ No Project Central integration needed - removed from plan
5. ✅ No additional vendors needed in MVP
6. 🟡 **PENDING**: User approval to proceed with 12-day parallel agent execution plan

---

**Last Updated**: 2025-10-13 (Post User Feedback)
**Status**: 🟢 Ready for Final Approval - All User Requirements Incorporated
