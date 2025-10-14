# Phase 2: Store Registry + Rate Cards - Implementation Plan

**Duration**: 2 Days (Days 3-4 of 10)
**Status**: Ready to Start (After Render Deployment Verified)
**Lead Agents**: Backend (lead), Frontend (support)

---

## 📋 Overview

Phase 2 implements persistent data storage for CA stores and vendor rate cards. This enables:
1. Spark CPD data to persist across Nash uploads
2. User-editable rate cards for cost calculations
3. Admin UI for bulk uploads and configuration

---

## 🎯 Deliverables

### 1. CA Store Registry (Persistent)
**File**: `data/ca_store_registry.json`

**Features**:
- Store Spark CPD data permanently
- Track last seen date for each store
- Handle missing stores in Nash uploads (show "No trips" but keep CPD)
- Bulk upload interface

**Schema**:
```json
{
  "stores": {
    "2082": {
      "spark_ytd_cpd": 5.60,
      "target_batch_size": 92,
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "metadata": {
        "city": "Palmdale",
        "state": "CA",
        "store_name": "Walmart 2082"
      }
    },
    "2242": {
      "spark_ytd_cpd": 6.20,
      "target_batch_size": 87,
      "last_seen_in_upload": "2025-10-13",
      "status": "active"
    },
    "5930": {
      "spark_ytd_cpd": 5.80,
      "target_batch_size": 95,
      "last_seen_in_upload": "2025-09-15",
      "status": "inactive",
      "note": "No trips in current period"
    }
  },
  "last_updated": "2025-10-13T12:00:00Z",
  "version": "1.0"
}
```

---

### 2. Vendor Rate Cards (Editable)
**File**: `data/ca_rate_cards.json`

**Features**:
- Manage FOX, NTG, FDC rate cards
- Base rates for 80 and 100 order batches
- Contractual adjustment multiplier
- Admin UI for editing

**Schema**:
```json
{
  "vendors": {
    "FOX": {
      "base_rate_80": 380.00,
      "base_rate_100": 390.00,
      "contractual_adjustment": 1.00,
      "notes": "Default rates until Finance provides actual",
      "last_updated": "2025-10-13"
    },
    "NTG": {
      "base_rate_80": 390.00,
      "base_rate_100": 400.00,
      "contractual_adjustment": 1.00,
      "last_updated": "2025-10-13"
    },
    "FDC": {
      "base_rate_80": 385.00,
      "base_rate_100": 395.00,
      "contractual_adjustment": 1.00,
      "last_updated": "2025-10-13"
    }
  },
  "version": "1.0",
  "currency": "USD"
}
```

---

## 🔧 Technical Implementation

### Backend Tasks

#### 1. Data Persistence Module
**File**: `src/utils/data-store.ts`

```typescript
// Functions to implement:
- loadStoreRegistry(): Promise<StoreRegistry>
- saveStoreRegistry(registry: StoreRegistry): Promise<void>
- loadRateCards(): Promise<RateCards>
- saveRateCards(cards: RateCards): Promise<void>
- mergeStoreData(existing: StoreRegistry, newUpload: NashData): StoreRegistry
```

**Features**:
- JSON file I/O with error handling
- Atomic writes (write to temp file, then rename)
- Backup creation before updates
- Data validation on load

---

#### 2. API Endpoints

**Store Registry APIs**:
```typescript
GET  /api/stores/registry          // Get all CA stores with Spark CPD
POST /api/stores/registry/bulk     // Bulk upload Spark CPD data
GET  /api/stores/:storeId          // Get single store details
PUT  /api/stores/:storeId          // Update single store
```

**Rate Card APIs**:
```typescript
GET  /api/rate-cards               // Get all rate cards
GET  /api/rate-cards/:vendor       // Get single vendor rate card
PUT  /api/rate-cards/:vendor       // Update vendor rate card
POST /api/rate-cards/calculate     // Calculate CPD for given data
```

**Request/Response Examples**:

```javascript
// POST /api/stores/registry/bulk
// Request Body:
{
  "stores": [
    {"storeId": "2082", "sparkCpd": 5.60, "targetBatchSize": 92},
    {"storeId": "2242", "sparkCpd": 6.20, "targetBatchSize": 87},
    {"storeId": "5930", "sparkCpd": 5.80, "targetBatchSize": 95}
  ]
}

// Response:
{
  "success": true,
  "updated": 3,
  "errors": [],
  "registry": { /* full registry */ }
}

// PUT /api/rate-cards/FOX
// Request Body:
{
  "base_rate_80": 380.00,
  "base_rate_100": 390.00,
  "contractual_adjustment": 1.05,
  "notes": "Updated with actual contractual rates"
}

// Response:
{
  "success": true,
  "vendor": "FOX",
  "rateCard": { /* updated rate card */ }
}
```

---

#### 3. Upload Flow Enhancement
**File**: `src/ui-server.ts` (modify existing upload endpoint)

**Current Flow**:
```
Nash Upload → Validate → Filter CA Stores → Return Report
```

**New Flow**:
```
Nash Upload → Validate → Filter CA Stores → Merge with Registry → Update Last Seen → Return Report
```

**Changes**:
- After validation, merge Nash data with store registry
- Update `last_seen_in_upload` for stores in upload
- Mark stores NOT in upload as "No trips this period"
- Include Spark CPD data in response

---

### Frontend Tasks

#### 1. Admin Page Enhancement
**File**: `public/admin.html` (currently placeholder)

**Sections to Implement**:

**A. Spark CPD Bulk Upload**:
```html
<div class="admin-section">
  <h2>Spark CPD Bulk Upload</h2>
  <p>Upload CSV with columns: Store ID, Spark YTD CPD, Target Batch Size</p>

  <input type="file" accept=".csv" id="sparkCpdFile">
  <button id="uploadSparkCpd">Upload Spark CPD Data</button>

  <div id="sparkCpdResult">
    <!-- Success/error message -->
  </div>

  <h3>CSV Format Example:</h3>
  <table>
    <tr><th>Store ID</th><th>Spark YTD CPD</th><th>Target Batch Size</th></tr>
    <tr><td>2082</td><td>5.60</td><td>92</td></tr>
    <tr><td>2242</td><td>6.20</td><td>87</td></tr>
  </table>
</div>
```

**B. Rate Card Editor**:
```html
<div class="admin-section">
  <h2>Vendor Rate Cards</h2>

  <div class="rate-card" data-vendor="FOX">
    <h3>FOX Transportation</h3>
    <label>Base Rate (80 orders): $<input type="number" value="380.00" step="0.01"></label>
    <label>Base Rate (100 orders): $<input type="number" value="390.00" step="0.01"></label>
    <label>Contractual Adjustment: <input type="number" value="1.00" step="0.01"></label>
    <label>Notes: <textarea></textarea></label>
    <button class="save-rate-card">Save Changes</button>
  </div>

  <!-- Repeat for NTG and FDC -->
</div>
```

**C. Store Registry Viewer**:
```html
<div class="admin-section">
  <h2>CA Store Registry (273 Stores)</h2>

  <input type="text" placeholder="Search by Store ID..." id="storeSearch">

  <table id="storeRegistryTable">
    <thead>
      <tr>
        <th>Store ID</th>
        <th>Spark CPD</th>
        <th>Target Batch</th>
        <th>Last Seen</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Populated via JS -->
    </tbody>
  </table>

  <div class="pagination">
    <!-- Page controls -->
  </div>
</div>
```

---

#### 2. Admin JavaScript
**File**: `public/js/admin.js` (currently placeholder)

**Functions to Implement**:
```javascript
// Spark CPD Upload
async function uploadSparkCpd(file) {
  // Parse CSV
  // Validate format
  // POST to /api/stores/registry/bulk
  // Display results
}

// Rate Card Management
async function loadRateCards() {
  // GET /api/rate-cards
  // Populate forms
}

async function saveRateCard(vendor, data) {
  // PUT /api/rate-cards/:vendor
  // Show success/error
}

// Store Registry
async function loadStoreRegistry() {
  // GET /api/stores/registry
  // Populate table
  // Handle pagination
}

async function searchStores(query) {
  // Filter stores by ID or city
}
```

---

### Testing Tasks

#### 1. Unit Tests
**File**: `tests/unit/data-store.test.ts` (new)

```typescript
describe('Store Registry', () => {
  test('Load registry from JSON file', async () => { /* ... */ });
  test('Save registry to JSON file', async () => { /* ... */ });
  test('Merge new upload with existing registry', async () => { /* ... */ });
  test('Update last_seen_in_upload', async () => { /* ... */ });
  test('Handle missing stores (mark as no trips)', async () => { /* ... */ });
});

describe('Rate Cards', () => {
  test('Load rate cards from JSON', async () => { /* ... */ });
  test('Update single vendor rate card', async () => { /* ... */ });
  test('Calculate CPD with contractual adjustment', async () => { /* ... */ });
  test('Validate rate card data', async () => { /* ... */ });
});
```

**File**: `tests/unit/api.test.ts` (new)

```typescript
describe('Store Registry API', () => {
  test('GET /api/stores/registry returns all stores', async () => { /* ... */ });
  test('POST /api/stores/registry/bulk accepts CSV data', async () => { /* ... */ });
  test('PUT /api/stores/:storeId updates single store', async () => { /* ... */ });
});

describe('Rate Cards API', () => {
  test('GET /api/rate-cards returns all vendors', async () => { /* ... */ });
  test('PUT /api/rate-cards/:vendor updates rates', async () => { /* ... */ });
  test('POST /api/rate-cards/calculate computes CPD', async () => { /* ... */ });
});
```

---

#### 2. Integration Tests
**File**: `tests/integration/phase-2-flow.test.ts` (new)

```typescript
describe('Phase 2 Integration', () => {
  test('Upload Nash CSV, merge with registry, verify persistence', async () => {
    // 1. Upload Spark CPD bulk data
    // 2. Upload Nash CSV
    // 3. Verify stores have Spark CPD data
    // 4. Upload new Nash CSV without Store 5930
    // 5. Verify Store 5930 marked as "No trips" but CPD persisted
  });

  test('Update rate card, calculate CPD with new rates', async () => {
    // 1. Get current FOX rates
    // 2. Update FOX contractual adjustment to 1.05
    // 3. Calculate CPD for sample data
    // 4. Verify CPD increased by 5%
  });
});
```

---

## 📂 File Structure Changes

**New Files**:
```
data/                                [New directory]
├── ca_store_registry.json          [Store + Spark CPD data]
└── ca_rate_cards.json              [Vendor rate cards]

src/utils/
├── data-store.ts                   [JSON file I/O utilities]
└── rate-calculator.ts              [CPD calculation logic]

tests/unit/
├── data-store.test.ts              [Data persistence tests]
└── api.test.ts                     [API endpoint tests]

tests/integration/
└── phase-2-flow.test.ts            [End-to-end Phase 2 tests]
```

**Modified Files**:
```
src/ui-server.ts                    [Add new API endpoints]
public/admin.html                   [Implement admin UI]
public/js/admin.js                  [Implement admin logic]
public/styles.css                   [Admin page styles]
```

---

## 🧪 Testing Checklist

### Spark CPD Bulk Upload
- [ ] Upload valid CSV with 3 stores (2082, 2242, 5930)
- [ ] Reject CSV with invalid Store IDs (non-CA stores)
- [ ] Handle duplicate Store IDs in CSV
- [ ] Verify CPD persists after upload
- [ ] Test with 273 stores (full CA registry)

### Store Registry Persistence
- [ ] Upload Nash CSV with Store 2082
- [ ] Verify Store 2082 has Spark CPD data
- [ ] Upload Nash CSV WITHOUT Store 2082
- [ ] Verify Store 2082 still has CPD but marked "No trips"
- [ ] Upload Nash CSV WITH Store 2082 again
- [ ] Verify Store 2082 status changes back to "active"

### Rate Card Management
- [ ] Load default rate cards (FOX/NTG/FDC)
- [ ] Update FOX rates via admin UI
- [ ] Verify rates saved to JSON
- [ ] Update contractual adjustment to 1.05
- [ ] Calculate CPD and verify 5% increase

### Admin UI
- [ ] Spark CPD upload form works
- [ ] Rate card editor loads current values
- [ ] Save button updates backend
- [ ] Store registry table displays all 273 stores
- [ ] Search functionality filters stores
- [ ] Pagination works (10 stores per page)

---

## 🎯 Success Criteria

### Technical
- [ ] JSON files created in `data/` directory
- [ ] All 6 new API endpoints operational
- [ ] Spark CPD persists across Nash uploads
- [ ] Rate cards editable via admin UI
- [ ] All unit tests pass (target: 15+ new tests)
- [ ] All integration tests pass
- [ ] Code coverage maintains >80%

### Business
- [ ] Can upload Spark CPD for 3 pilot stores (2082, 2242, 5930)
- [ ] Store 5930 shows "No trips" after missing from Nash upload
- [ ] Store 5930 Spark CPD still visible (persisted)
- [ ] Rate card changes reflected in CPD calculations
- [ ] Contractual adjustment default = 1.00x

### User Experience
- [ ] Admin UI clear and intuitive
- [ ] Bulk upload completes in < 5 seconds (273 stores)
- [ ] Save rate card provides immediate feedback
- [ ] Store registry searchable and filterable
- [ ] Error messages actionable

---

## 🚀 Implementation Steps (Day-by-Day)

### Day 3: Backend Development
**Morning** (4 hours):
1. Create `data/` directory structure
2. Implement `src/utils/data-store.ts` (load/save functions)
3. Create initial JSON files with default data
4. Write unit tests for data-store module

**Afternoon** (4 hours):
5. Add API endpoints to `src/ui-server.ts`
6. Implement store registry merge logic
7. Implement rate card CRUD
8. Write API endpoint tests

**EOD Checkpoint**:
- [ ] All 6 API endpoints functional
- [ ] Unit tests passing
- [ ] Postman/curl tests successful

---

### Day 4: Frontend + Integration
**Morning** (4 hours):
1. Implement admin.html Spark CPD upload section
2. Implement rate card editor UI
3. Implement store registry table
4. Add admin.js functionality

**Afternoon** (4 hours):
5. Write integration tests
6. Test full upload → merge → display flow
7. Test rate card updates → CPD calculation
8. Bug fixes and polish

**EOD Checkpoint**:
- [ ] Admin UI fully functional
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Ready for Phase 3

---

## 📚 Documentation Updates

### Files to Update After Phase 2:
1. **IMPLEMENTATION-READY.md**:
   - Mark Phase 2 tasks as complete
   - Update validation gates

2. **PHASE-2-COMPLETE.md** (create):
   - Summary of deliverables
   - Test results
   - Known issues (if any)

3. **API-DOCUMENTATION.md** (create):
   - All 6 new endpoints
   - Request/response examples
   - Error codes

4. **ADMIN-GUIDE.md** (create):
   - How to use admin UI
   - Spark CPD bulk upload format
   - Rate card management

---

## ⚠️ Risks & Mitigation

### Risk 1: JSON File Corruption
**Impact**: Data loss if file becomes unreadable
**Mitigation**:
- Create backup before every write
- Validate JSON structure on load
- Log all file operations

### Risk 2: Concurrent Writes
**Impact**: Lost updates if multiple users edit simultaneously
**Mitigation**:
- Use file locking or timestamps
- Detect conflicts on save
- Alert user if data changed

### Risk 3: Large Registry Performance
**Impact**: Slow load times with 273 stores
**Mitigation**:
- Implement pagination (10-20 stores per page)
- Add search/filter for quick lookup
- Consider database migration if >1000 stores

### Risk 4: Rate Card Miscalculation
**Impact**: Incorrect CPD values
**Mitigation**:
- Comprehensive unit tests for calculations
- Manual verification with known data
- Audit log for rate changes

---

## 🔄 Phase 3 Preparation

Once Phase 2 is complete, Phase 3 will:
- Use store registry data for analytics
- Apply rate cards to calculate Van CPD
- Generate dashboard metrics
- Compare Van vs Spark CPD

**Prerequisites from Phase 2**:
- Store registry with Spark CPD data
- Rate cards for FOX/NTG/FDC
- Merge logic working correctly

---

## 📞 Questions for User

Before starting Phase 2, confirm:
1. Are the rate card values correct? (FOX $380/$390, NTG $390/$400, FDC $385/$395)
2. Is contractual adjustment 1.00x for all vendors initially?
3. Do you have Spark CPD data for the 3 pilot stores (2082, 2242, 5930)?
4. Should rate card changes apply retroactively to historical data?

---

**Status**: Ready to begin Phase 2 once Render deployment is verified
**Next Action**: Wait for deployment URL, run test script, then start Day 3 development

---

**Last Updated**: 2025-10-13 (Phase 1 Complete, Phase 2 Planned)
