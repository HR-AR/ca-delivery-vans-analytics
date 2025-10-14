# FINAL Architecture - Ready to Build

**Date**: 2025-10-13
**Status**: 🟢 All requirements confirmed, ready to proceed

---

## ✅ CONFIRMED DATA SOURCES

### 1. Store State Mapping (YOU PROVIDED)
**Location**: `States/Book3.xlsx` (converted to CSV)
**Format**:
```csv
Store ID,Address,City,State
2082,12701 TOWNE CENTER DR,CERRITOS,CA
2242,440 N EUCLID ST,ANAHEIM,CA
5930,88 E ORANGETHORPE AVE,ANAHEIM,CA
```

**Stats**:
- **Total stores**: 4,550 Walmart stores (all US + PR)
- **CA stores**: 273 stores
- **Other states**: TX (494), FL (339), NC (192), GA (183), etc.

**Confirmed stores from screenshots**:
- ✅ Store 2082: CERRITOS, CA
- ✅ Store 2242: ANAHEIM, CA
- ✅ Store 5930: ANAHEIM, CA

---

### 2. Trip Data from Nash (YOUR DATA SOURCE)
**Location**: User uploads via UI
**Format**: `Data Example/data_table_1 (2).csv`
**Columns**:
```
Carrier, Date, Store Id, Walmart Trip Id, Courier Name,
Total Orders, Failed Pickups, Delivered Orders, Returned Orders, Pending Orders,
Driver Dwell Time, Driver Load Time, Trip Actual Time, Estimated Duration, etc.
```

**Key Points**:
- **Nash** = Your data source system (NOT Nashville, TN - clarified!)
- Contains trip data for ALL stores (CA + non-CA)
- System will filter to CA-only automatically

---

## 🏗️ FINAL ARCHITECTURE

### Data Processing Flow:
```
1. User uploads Nash CSV (trip data)
     ↓
2. System loads States/walmart_stores_all.csv
     ↓
3. Filter uploaded data:
     - Keep: Stores where State = "CA" (273 stores)
     - Exclude: All non-CA stores (4,277 stores)
     - Warning: "Excluded X non-CA stores from upload"
     ↓
4. Merge with CA Store Registry:
     - If store has Spark CPD saved → use it
     - If store missing from upload → show "No trips in this period"
     - If store in upload but no Spark CPD → show with blank Spark (warn admin)
     ↓
5. Calculate metrics:
     - Van CPD (from rate cards)
     - Batch density
     - Vendor performance
     - OTD %
     ↓
6. Display CA dashboard (CA stores only)
```

---

## 📋 USER DECISIONS (CONFIRMED)

### Q1: Store State Lookup
**Answer**: Use existing `States/Book3.xlsx` ✅
- No Google lookup needed
- 273 CA stores already mapped
- System loads CSV on startup

### Q2: Unknown Store Handling
**Answer**: Exclude until verified ✅
- If Nash upload contains Store not in States CSV → exclude
- Show warning: "Store XXXX excluded - not found in store mapping"
- Admin can manually add to States CSV if needed

### Q3: Module Selector
**Answer**: Skip for MVP, hardcode CA only ✅
- No module selector page
- Landing page → CA Dashboard directly
- Can add NWA module later if needed

### Q4: Spark CPD CSV Template
**Answer**: Minimum (Store ID + Spark CPD only) ✅
- CSV format: `Store ID,Spark YTD CPD`
- **Persistence**: Once uploaded, Spark CPD saved FOREVER (or until admin updates)
- Stores kept even if missing from future Nash uploads

---

## 🗂️ FILE STRUCTURE (FINAL)

```
CA Analysis/
├── States/
│   ├── Book3.xlsx                      [USER PROVIDED - Original Excel]
│   ├── walmart_stores_all.csv          [SYSTEM GENERATED - All 4,550 stores]
│   └── walmart_stores_ca_only.csv      [SYSTEM GENERATED - 273 CA stores]
│
├── Data Example/
│   └── data_table_1 (2).csv            [Nash trip data format example]
│
├── data/
│   ├── ca_store_registry.json          [SYSTEM - CA stores + Spark CPD persistence]
│   └── ca_rate_cards.json              [SYSTEM - Vendor rates (FOX/NTG/FDC)]
│
├── src/
│   ├── ui-server.ts                    [Express server]
│   ├── api/
│   │   ├── upload.ts                   [Nash CSV upload]
│   │   ├── dashboard.ts                [Dashboard data]
│   │   ├── admin/
│   │   │   ├── rate-cards.ts          [Vendor rate management]
│   │   │   └── spark-cpd.ts           [Spark CPD bulk upload]
│   └── utils/
│       ├── ca-filter.ts                [Filter to CA stores only]
│       └── store-registry.ts           [Persistent store management]
│
├── scripts/analysis/
│   ├── ca_dashboard_metrics.py         [Dashboard KPIs]
│   ├── ca_store_analysis.py            [Per-store breakdown]
│   ├── ca_vendor_analysis.py           [FOX vs NTG comparison]
│   ├── ca_cpd_analysis.py              [CPD trends]
│   ├── ca_batch_density.py             [Batch optimization]
│   └── ca_vendor_performance.py        [Time on-road, etc.]
│
├── public/
│   ├── index.html                      [Upload page]
│   ├── dashboard.html                  [CA Dashboard]
│   └── admin/
│       ├── rate-cards.html             [Vendor rate admin]
│       └── spark-cpd-bulk.html         [Spark CPD bulk upload]
│
├── templates/
│   └── spark_cpd_template.csv          [Template: Store ID, Spark YTD CPD]
│
└── uploads/                            [Temporary Nash CSV uploads]
```

---

## 📊 DATA SCHEMAS (FINAL)

### 1. CA Store Registry (`data/ca_store_registry.json`):
```json
{
  "stores": {
    "2082": {
      "store_id": "2082",
      "city": "CERRITOS",
      "state": "CA",
      "address": "12701 TOWNE CENTER DR",
      "spark_ytd_cpd": 5.60,
      "target_batch_size": 92,
      "added_date": "2025-10-02",
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "notes": "High-volume store, launched Week 1"
    },
    "2242": {
      "store_id": "2242",
      "city": "ANAHEIM",
      "state": "CA",
      "address": "440 N EUCLID ST",
      "spark_ytd_cpd": 5.84,
      "target_batch_size": 81,
      "added_date": "2025-10-02",
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "notes": "Medium-volume store, launched Week 1"
    },
    "5930": {
      "store_id": "5930",
      "city": "ANAHEIM",
      "state": "CA",
      "address": "88 E ORANGETHORPE AVE",
      "spark_ytd_cpd": 7.76,
      "target_batch_size": 137,
      "added_date": "2025-10-02",
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "notes": "Low-volume + IP store, has carryover issues"
    }
  }
}
```

**Key Behaviors**:
- Once a store added (via admin or bulk upload) → persists forever
- `spark_ytd_cpd` only changes when admin updates
- `last_seen_in_upload` updates when store appears in Nash CSV
- If store missing from Nash upload → shows "No trips in this period" but keeps Spark CPD

---

### 2. Vendor Rate Cards (`data/ca_rate_cards.json`):
```json
{
  "vendors": {
    "FOX": {
      "state": "CA",
      "base_rate_80": 380.00,
      "base_rate_100": 390.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed rates. Adjustment = 1.00 (no markup) until Finance provides actual value",
      "last_updated": "2025-10-13"
    },
    "NTG": {
      "state": "CA",
      "base_rate_80": 390.00,
      "base_rate_100": 400.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed rates. Adjustment = 1.00 (no markup) until Finance provides actual value",
      "last_updated": "2025-10-13"
    },
    "FDC": {
      "state": "CA",
      "base_rate_80": 385.00,
      "base_rate_100": 395.00,
      "contractual_adjustment": 1.00,
      "notes": "User-confirmed rates. Adjustment = 1.00 (no markup) until Finance provides actual value",
      "last_updated": "2025-10-13"
    }
  },
  "default_target_cpd": 5.00
}
```

---

## 🔄 USER WORKFLOWS

### Workflow 1: Initial Setup (One-Time)
```
1. Admin uploads Spark CPD for initial 3 stores via CSV:
   2082,5.60
   2242,5.84
   5930,7.76

2. System saves to ca_store_registry.json
   ✅ Store 2082 → Spark CPD $5.60 (persisted)
   ✅ Store 2242 → Spark CPD $5.84 (persisted)
   ✅ Store 5930 → Spark CPD $7.76 (persisted)

3. Admin reviews/updates vendor rates (optional):
   FOX: 1.00x → 1.05x (if Finance provides actual value)
```

---

### Workflow 2: Weekly Nash Upload
```
1. User downloads Nash export CSV (contains all stores)

2. User uploads CSV to CA Dashboard

3. System processing:
   - Loads States/walmart_stores_all.csv
   - Finds 273 CA stores
   - Filters Nash data to CA stores only
   - Excludes 4,277 non-CA stores
   - Shows warning: "Excluded 127 non-CA stores from upload"

4. System merges with ca_store_registry.json:
   - Store 2082: Has trips in upload + Spark CPD $5.60 → Display both
   - Store 2242: Has trips in upload + Spark CPD $5.84 → Display both
   - Store 5930: Has trips in upload + Spark CPD $7.76 → Display both
   - Store 2141: NOT in upload but has Spark CPD → Display "No trips" + Spark CPD

5. Dashboard displays:
   - All CA stores with Spark CPD (even if no trips)
   - Trip metrics for stores with data
   - "No trips in this period" for stores without data
```

---

### Workflow 3: Adding New Stores (Week 2 Launch)
```
1. Admin uploads Spark CPD CSV with 5 new stores:
   2141,6.50
   3284,7.20
   1234,6.80
   5678,5.90
   9012,7.10

2. System checks States/walmart_stores_all.csv:
   ✅ Store 2141: Found, State = CA → Add to registry
   ✅ Store 3284: Found, State = CA → Add to registry
   ✅ Store 1234: Found, State = CA → Add to registry
   ✅ Store 5678: Found, State = CA → Add to registry
   ⚠️  Store 9012: Found, State = TX → EXCLUDE, show warning

3. Result: 4 CA stores added, 1 TX store excluded

4. Next Nash upload: All 7 CA stores (3 original + 4 new) tracked
```

---

## 🚀 IMPLEMENTATION PHASES (FINALIZED)

### ✅ PHASE 1: Foundation + CA Filtering (2 Days)
**Agent 1 (Backend)**:
- [ ] Create Express server (port 3000 local, 10000 Render)
- [ ] File upload endpoint (Multer)
- [ ] Load States/walmart_stores_all.csv on startup
- [ ] CA filtering logic (273 stores only)
- [ ] Health check endpoint

**Agent 2 (Python)**:
- [ ] CA filter script (reads States CSV, filters to CA)
- [ ] Store registry manager (load/save JSON)
- [ ] Warning generator (excluded store count)

**Success Criteria**:
- ✅ Can upload Nash CSV
- ✅ System excludes non-CA stores automatically
- ✅ Shows warning: "Excluded X non-CA stores"

---

### ✅ PHASE 2: Store Registry + Rate Cards (2 Days)
**Agent 1 (Backend)**:
- [ ] Spark CPD bulk upload API
- [ ] Store registry persistence logic
- [ ] Rate card CRUD API
- [ ] Admin page routes

**Agent 3 (Frontend)**:
- [ ] Admin page: Spark CPD bulk upload
- [ ] CSV template download
- [ ] Admin page: Vendor rate cards (1.00x default)

**Success Criteria**:
- ✅ Can bulk upload Spark CPD via CSV
- ✅ Stores persist across Nash uploads
- ✅ Rate cards editable (1.00x → user updates later)

---

### ✅ PHASE 3: Analytics Engine (3 Days)
**Agent 2 (Python)**:
- [ ] ca_dashboard_metrics.py (DFS volume, avg CPD, OTD)
- [ ] ca_store_analysis.py (per-store daily breakdown)
- [ ] ca_vendor_analysis.py (FOX vs NTG vs FDC)
- [ ] ca_cpd_analysis.py (CPD trends, Spark delta)
- [ ] ca_batch_density.py (batch optimization)
- [ ] ca_vendor_performance.py (time on-road, etc.)

**Success Criteria**:
- ✅ All 6 Python scripts working
- ✅ Handles stores with no trips ("No trips" status)
- ✅ All Slack requirements covered

---

### ✅ PHASE 4: Dashboard UI (2 Days)
**Agent 3 (Frontend)**:
- [ ] Upload page (index.html)
- [ ] Dashboard page (5 charts)
- [ ] Multi-line charts (color-coded by store)
- [ ] "No trips in this period" indicators
- [ ] Key highlights section

**Success Criteria**:
- ✅ All 5 charts render correctly
- ✅ Shows CA stores even if missing from upload
- ✅ Carryover detection for Store 5930

---

### ✅ PHASE 5: Testing & Deploy (1 Day)
**Agent 4 (Testing)**:
- [ ] Integration tests (upload → filter → display)
- [ ] Test with real Nash data
- [ ] Test store persistence (missing stores)
- [ ] Deploy to Render
- [ ] Smoke test

**Success Criteria**:
- ✅ All tests pass
- ✅ Deployed and accessible on Render
- ✅ Ready for user demo

---

**TOTAL TIMELINE**: 10 Days (reduced from 12, no module selector)

---

## ✅ FINAL APPROVAL CHECKLIST

- [x] **Store mapping**: States/Book3.xlsx with 273 CA stores confirmed
- [x] **Nash data format**: Data Example CSV confirmed
- [x] **CA filtering**: Exclude non-CA stores automatically
- [x] **Store persistence**: Spark CPD saved forever
- [x] **Rate cards**: 1.00x default, editable by admin
- [x] **No module selector**: Hardcode to CA only
- [x] **Spark CPD bulk upload**: CSV template (Store ID, Spark CPD)

---

## 🚀 READY TO PROCEED?

All requirements confirmed. Reply with:

**"APPROVED - START BUILD"**

And I will immediately:
1. Launch all 4 agents in parallel
2. Start Phase 1 (Foundation + CA Filtering)
3. Deploy skeleton to Render by end of Day 1
4. Deliver full MVP in 10 days

---

**Status**: 🟢 Architecture finalized, all data sources confirmed, ready to build!
