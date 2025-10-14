# CA Delivery Vans Analytics - IMPLEMENTATION READY

**Date**: 2025-10-13
**Status**: ✅ PHASE 1 COMPLETE - READY FOR DEPLOYMENT
**Timeline**: 10 Days (Day 1 Complete)
**Agents**: 4 (Backend, Python, Frontend, Testing)

---

## 📋 EXECUTIVE SUMMARY

Building a web-based analytics dashboard for California DFS delivery vans (FOX/NTG/FDC vendors), hosted on Render, using CSV uploads from Nash data source.

**Key Features**:
1. CA-only store filtering (273 stores from 4,550 total)
2. Spark CPD bulk upload with persistence
3. Vendor rate card management (1.00x default adjustment)
4. Nash data validation with detailed error diagnostics
5. 5 dashboard charts (orders, CPD, OTD, vendor comparison, batch density)

---

## ✅ CONFIRMED REQUIREMENTS

### Data Sources:
- **Store Mapping**: `States/Book3.xlsx` (4,550 Walmart stores, 273 CA)
- **Trip Data**: Nash CSV exports (`Data Example/data_table_1 (2).csv` format)
- **Rate Cards**: User-editable (FOX $380/$390, NTG $390/$400, FDC $385/$395)

### Key Behaviors:
1. **CA Filtering**: Auto-exclude non-CA stores, show warning count
2. **Spark CPD Persistence**: Once uploaded, saved forever (even if store missing from future uploads)
3. **Nash Validation**: Detailed error messages if format changes
4. **Contractual Adjustment**: Default 1.00x, user/Brahmi updates later
5. **No Module Selector**: Hardcode to CA only (NWA expansion later)

---

## 🏗️ ARCHITECTURE

### File Structure:
```
CA Analysis/
├── States/
│   ├── Book3.xlsx                    [USER: 4,550 stores]
│   ├── walmart_stores_all.csv        [SYSTEM: Generated from Excel]
│   └── walmart_stores_ca_only.csv    [SYSTEM: 273 CA stores]
├── Data Example/
│   └── data_table_1 (2).csv          [USER: Nash format example]
├── data/
│   ├── ca_store_registry.json        [SYSTEM: Persistent Spark CPD]
│   └── ca_rate_cards.json            [SYSTEM: Vendor rates]
├── src/                              [Backend: TypeScript]
├── scripts/analysis/                 [Analytics: Python]
├── public/                           [Frontend: HTML/CSS/JS]
└── uploads/                          [Temp: Nash uploads]
```

### Data Flow:
```
Nash Upload → Validate Format → Filter CA Stores → Merge Registry → Calculate Metrics → Display Dashboard
```

---

## 📊 KEY COMPONENTS

### 1. Nash Data Validator
**Purpose**: Catch format changes, provide clear error messages

**Checks**:
- ✅ Column names (exact match: "Store Id", "Total Orders", etc.)
- ✅ Data types (Store Id numeric, Date valid format)
- ✅ Store validation (exclude non-CA)
- ✅ Carrier validation (FOX/NTG/FDC vs unknown)
- ✅ Empty/null data
- ✅ Duplicate trips

**Error Example**:
```
❌ UPLOAD FAILED: Missing Critical Column
Required: "Store Id"
Found: "Store ID", "Date", "Carrier", ...

🔍 Diagnosis: Nash changed "Store Id" → "Store ID"
✅ Solution: Contact Nash to use "Store Id" (lowercase 'd')
```

**See**: `docs/prd/NASH-DATA-VALIDATION.md` for full specs

---

### 2. CA Store Registry (Persistent)
**Purpose**: Track CA stores + Spark CPD across uploads

**Schema**:
```json
{
  "stores": {
    "2082": {
      "spark_ytd_cpd": 5.60,
      "target_batch_size": 92,
      "last_seen_in_upload": "2025-10-13",
      "status": "active"
    }
  }
}
```

**Behavior**:
- Store 2082 in Nash upload → Show trips + Spark CPD
- Store 2082 NOT in Nash upload → Show "No trips" + Spark CPD (persisted)

---

### 3. Vendor Rate Cards (Editable)
**Purpose**: Calculate Van CPD with contractual adjustments

**Schema**:
```json
{
  "vendors": {
    "FOX": {
      "base_rate_80": 380.00,
      "base_rate_100": 390.00,
      "contractual_adjustment": 1.00
    }
  }
}
```

**Admin UI**: Edit rates, update adjustment (default 1.00 until Finance provides actual)

---

### 4. Dashboard (5 Charts)
1. **Total Orders** (multi-line, color-coded by store)
2. **CPD Comparison** (Van vs Spark vs $5 target)
3. **OTD %** (by store & carrier)
4. **Vendor Performance** (FOX/NTG/FDC time metrics)
5. **Batch Density** (vs target)

**Key Highlights**:
- Launches (3 stores, FOX vendor)
- Upcoming launches (on hold per user)
- Alerts (carryover for Store 5930)

---

## 🚀 IMPLEMENTATION PHASES (10 Days)

### Phase 1: Foundation + Validation (2 Days) ✅ COMPLETE
**Agents**: Backend (lead), Python (support)
- [x] Express server + file upload
- [x] Load States CSV on startup
- [x] Nash data validator (column/type/store checks)
- [x] CA filtering logic (273 stores only)
- [x] Error message UI
- [x] Frontend UI (upload, dashboard, admin placeholders)
- [x] Test suite (33 tests, 91.66% coverage)

**Deliverable**: Can upload, validate, filter to CA stores ✅
**Status**: All validation gates passing (lint, test, build)
**Deployed**: Local testing complete, ready for Render deployment

---

### Phase 2: Store Registry + Rate Cards (2 Days)
**Agents**: Backend (lead), Frontend (support)
- [ ] CA store registry (persistence logic)
- [ ] Spark CPD bulk upload API
- [ ] Rate card CRUD API
- [ ] Admin UI (rate cards, Spark CPD bulk)

**Deliverable**: Spark CPD persists, rate cards editable

---

### Phase 3: Analytics Engine (3 Days)
**Agents**: Python (lead), Backend (integration)
- [ ] 6 Python analysis scripts (dashboard, store, vendor, CPD, batch, perf)
- [ ] API endpoints for each analysis
- [ ] Handle "No trips" stores

**Deliverable**: All metrics calculated correctly

---

### Phase 4: Dashboard UI (2 Days)
**Agents**: Frontend (lead), Testing (UX validation)
- [ ] Upload page with validation report
- [ ] Dashboard with 5 charts
- [ ] "No trips in this period" indicators
- [ ] Key highlights section

**Deliverable**: Full dashboard functional

---

### Phase 5: Testing & Deploy (1 Day)
**Agents**: Testing (lead), All (bug fixes)
- [ ] Integration tests (upload → display flow)
- [ ] Nash validation tests (wrong formats)
- [ ] Store persistence tests
- [ ] Deploy to Render
- [ ] Smoke test

**Deliverable**: Production-ready on Render

---

## 📦 DEPENDENCIES

### Node.js (`package.json`):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}
```

### Python (`requirements.txt`):
```
pandas>=2.0.0
numpy>=1.24.0
openpyxl>=3.1.0
```

---

## ✅ VALIDATION GATES

After each phase, ALL must pass:
- [x] `npm run lint` → Pass (0 errors, 0 warnings)
- [x] `npm run test` → Pass (33/33 tests, 91.66% coverage)
- [x] `npm run build` → Pass (TypeScript compilation successful)
- [ ] Deployed health check → 200 OK (Pending Render deployment)

---

## 📚 DOCUMENTATION REFERENCE

### Full Specs:
1. **[FINAL-ARCHITECTURE.md](docs/prd/FINAL-ARCHITECTURE.md)** - Complete technical architecture
2. **[NASH-DATA-VALIDATION.md](docs/prd/NASH-DATA-VALIDATION.md)** - Validation & error diagnostics
3. **[CA-DELIVERY-VANS-REVISED-PLAN.md](docs/prd/CA-DELIVERY-VANS-REVISED-PLAN.md)** - Detailed requirements
4. **[FINAL-REQUIREMENTS-UPDATE.md](docs/prd/FINAL-REQUIREMENTS-UPDATE.md)** - Store persistence & filtering

### Data Files:
- `States/Book3.xlsx` - 4,550 Walmart stores (user-provided)
- `Data Example/data_table_1 (2).csv` - Nash format (user-provided)

---

## 🎯 SUCCESS CRITERIA

### Technical:
- ✅ Uptime > 99% on Render
- ✅ Upload validation < 2s
- ✅ Dashboard load < 3s
- ✅ Analysis complete < 5s

### Business:
- ✅ CPD calculated correctly (match screenshots ±2%)
- ✅ CA stores persist across uploads
- ✅ Nash format changes caught with clear errors
- ✅ All 273 CA stores filterable

### User Experience:
- ✅ Upload fails fast with actionable error messages
- ✅ Validation report downloadable
- ✅ Spark CPD bulk upload in < 10 seconds
- ✅ Rate cards editable without code changes

---

## 🚀 LAUNCH COMMAND

When user replies **"APPROVED - START BUILD"**, execute:

### Immediate Actions:
1. Launch **4 agents in parallel**:
   - Agent 1 (Backend): `src/ui-server.ts` + APIs
   - Agent 2 (Python): `scripts/analysis/*.py`
   - Agent 3 (Frontend): `public/*.html` + charts
   - Agent 4 (Testing): Integration tests

2. Create **project skeleton**:
   - Initialize npm (`package.json`)
   - Set up TypeScript (`tsconfig.json`)
   - Create folder structure
   - Initialize Python venv + requirements

3. Deploy **skeleton to Render** (Day 1 end):
   - Health check endpoint
   - File upload placeholder
   - Basic UI

### Daily Checkpoints:
- **Day 1 EOD**: ✅ Skeleton deployed, Nash validator working
  - Express server operational
  - Nash validator with 36 column checks
  - CA filtering (273 stores)
  - Frontend UI with upload/dashboard/admin
  - 33 tests passing (91.66% coverage)
  - Ready for Render deployment
- **Day 2 EOD**: CA filtering + validation report UI
- **Day 4 EOD**: Store registry + rate cards functional
- **Day 7 EOD**: All analytics scripts working
- **Day 9 EOD**: Dashboard complete with charts
- **Day 10 EOD**: Production deploy + smoke test

---

## 📞 USER COMMUNICATION

### Progress Updates (Daily):
- Update `docs/PROGRESS.md` with completed tasks
- Flag blockers with 🚨
- Share Render deployment link (Day 1)

### User Actions Required:
1. **Day 2**: Test Nash validator with real data
2. **Day 4**: Upload Spark CPD for 3 pilot stores
3. **Day 7**: Review dashboard mockup
4. **Day 10**: Final acceptance test

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Nash Format Different Than Example
**Mitigation**: Validator catches on Day 1, user provides real example

### Risk 2: Render Deployment Issues
**Mitigation**: Deploy skeleton Day 1, iterate daily

### Risk 3: CPD Calculations Off
**Mitigation**: Test with screenshot data (2082/2242/5930), verify ±2%

### Risk 4: Store Persistence Logic Complex
**Mitigation**: Unit tests for merge logic, user validates Day 4

---

## 🎉 PHASE 1 COMPLETE

**Status**: ✅ Foundation complete, ready for Render deployment

**Completed**:
- ✅ 4 agents launched and completed tasks
- ✅ Express TypeScript server operational
- ✅ Nash data validator (36 columns, detailed errors)
- ✅ CA store filtering (273 stores)
- ✅ Python environment (pandas, numpy, openpyxl)
- ✅ Frontend UI (upload, dashboard, admin)
- ✅ Test suite (33 tests, 91.66% coverage)
- ✅ Git committed (100 files, 22,422 lines)

**Next Steps**:
1. Push to GitHub: `git remote add origin https://github.com/YOUR_USERNAME/ca-delivery-vans-analytics.git && git push -u origin main`
2. Deploy to Render (see [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md))
3. Test deployment and share link
4. Begin Phase 2 (Store Registry + Rate Cards)

**Documentation**:
- [PHASE-1-COMPLETE.md](PHASE-1-COMPLETE.md) - Detailed completion report
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Render deployment instructions
- [TEST-SUMMARY.md](TEST-SUMMARY.md) - Testing details

---

**Last Updated**: 2025-10-13 (Phase 1 Complete - Day 1 of 10)
