# FINAL Requirements Update - Critical Architecture Changes

**Date**: 2025-10-13
**Status**: 🔴 Major Architecture Updates Required

---

## 🚨 NEW CRITICAL REQUIREMENTS (User Feedback Round 2)

### 1. ✅ Contractual Adjustment Factor
**CONFIRMED**: Default to **1.00x** (already updated in plan)

---

### 2. 🆕 **Spark CPD Bulk Upload via CSV**
**Requirement**: "Make it so user could bulk upload spark cost via UI with CSV if needed"

**Why**: More stores launching next week, manual entry of Spark CPD per store is not scalable

**Solution**: Add CSV bulk upload feature to admin UI

#### CSV Format for Spark CPD Upload:
```csv
Store Id,Spark YTD CPD,Target Batch Size,Notes
2082,5.60,92,High-volume store
2242,5.84,81,Medium-volume store
5930,7.76,137,Low-volume + IP
2141,6.50,85,New store - Week 2 launch
3284,7.20,90,New store - Week 2 launch
```

#### Admin UI Update:
```
┌─────────────────────────────────────────────────────────┐
│  Spark CPD Manager                                      │
├─────────────────────────────────────────────────────────┤
│  Option 1: Manual Entry                                 │
│  Store: [2082▼]  Spark CPD: [$5.60]  Batch: [92]       │
│  [Add Store] [Update]                                   │
│                                                         │
│  Option 2: Bulk Upload CSV                              │
│  [Choose File] spark_cpd_upload.csv                     │
│  [Upload & Merge]                                       │
│                                                         │
│  📋 Template: [Download CSV Template]                   │
│                                                         │
│  Current Stores in CA Module:                           │
│  ┌───────────┬──────────┬────────────┬──────────────┐  │
│  │ Store ID  │ Spark CPD│ Batch Size │ State        │  │
│  ├───────────┼──────────┼────────────┼──────────────┤  │
│  │ 2082      │ $5.60    │ 92         │ CA           │  │
│  │ 2242      │ $5.84    │ 81         │ CA           │  │
│  │ 5930      │ $7.76    │ 137        │ CA           │  │
│  └───────────┴──────────┴────────────┴──────────────┘  │
│                                                         │
│  [Export Current Stores]                                │
└─────────────────────────────────────────────────────────┘
```

#### API Endpoints:
- `POST /api/admin/spark-cpd/bulk-upload` - Accept CSV, merge with existing stores
- `GET /api/admin/spark-cpd/template` - Download CSV template
- `GET /api/admin/spark-cpd/export` - Export current stores as CSV

---

### 3. 🆕 **CA Store Filtering (Critical)**
**Requirement**: "This will be strictly a CA module view though, exclude store even in nash data if not a CA store"

**Why**: Data may contain non-CA stores (NWA, Nashville, etc.), must filter out

**Solution**: Implement store state lookup + CA-only filtering

#### Store State Lookup System:
```json
// data/store_state_mapping.json
{
  "stores": {
    "2082": {"state": "CA", "city": "Los Angeles", "source": "Google", "verified": true, "added_date": "2025-10-13"},
    "2242": {"state": "CA", "city": "Long Beach", "source": "Google", "verified": true, "added_date": "2025-10-13"},
    "5930": {"state": "CA", "city": "Anaheim", "source": "Google", "verified": true, "added_date": "2025-10-13"},
    "1027": {"state": "NWA", "city": "Bentonville", "source": "Google", "verified": true, "added_date": "2025-10-13"},
    "973": {"state": "TX", "city": "Dallas", "source": "Google", "verified": true, "added_date": "2025-10-13"}
  },
  "ca_stores": ["2082", "2242", "5930"]  // Explicitly tracked CA stores
}
```

#### Data Processing Flow:
```
CSV Upload → Extract unique Store IDs → Lookup state → Filter CA only → Process
              ↓
         If store not in mapping:
              ↓
         1. Auto-lookup via Google (background job)
         2. Show "Unknown State" warning in UI
         3. Allow admin to manually assign state
```

#### Filtering Logic (Python):
```python
def filter_ca_stores(df, store_mapping):
    """
    Filter dataframe to only include CA stores.
    Stores in ca_stores list are ALWAYS included (even if not in current upload).
    """
    ca_store_ids = store_mapping['ca_stores']

    # Filter uploaded data to CA stores only
    df_filtered = df[df['Store Id'].isin(ca_store_ids)]

    # Warn about non-CA stores found in upload
    non_ca_stores = set(df['Store Id'].unique()) - set(ca_store_ids)
    if non_ca_stores:
        print(f"⚠️  Excluded {len(non_ca_stores)} non-CA stores: {non_ca_stores}")

    return df_filtered, non_ca_stores
```

---

### 4. 🆕 **Store State Lookup via Google**
**Requirement**: "Create a Map of Walmart Stores via a google search to understand which one are in which State. This can be accomplished by looking up exact store number and googling Walmart."

**Solution**: Automated store state lookup + admin UI for verification

#### Google Lookup Implementation:
```python
# scripts/analysis/store_state_lookup.py
import requests
from bs4 import BeautifulSoup

def lookup_store_state(store_id):
    """
    Lookup Walmart store state via Google search.
    Query: "Walmart store {store_id} state"
    Parse results for state abbreviation.
    """
    query = f"Walmart store {store_id} location state"
    url = f"https://www.google.com/search?q={query}"

    # Note: In production, use Walmart Store Locator API if available
    # For now, parse Google results

    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract state from results (heuristic)
        # Look for patterns like "CA", "California", "TX", "Texas"
        # ... (implementation details)

        return {"state": "CA", "city": "Los Angeles", "confidence": 0.85}
    except Exception as e:
        return {"state": "UNKNOWN", "error": str(e)}
```

#### Admin UI for Store State Management:
```
┌─────────────────────────────────────────────────────────┐
│  Store State Manager                                    │
├─────────────────────────────────────────────────────────┤
│  Detected Stores from Latest Upload:                   │
│  ┌───────────┬──────────┬────────────┬──────────────┐  │
│  │ Store ID  │ State    │ Confidence │ Action       │  │
│  ├───────────┼──────────┼────────────┼──────────────┤  │
│  │ 2082      │ CA ✓     │ 95%        │ Verified     │  │
│  │ 2242      │ CA ✓     │ 92%        │ Verified     │  │
│  │ 5930      │ CA ✓     │ 88%        │ Verified     │  │
│  │ 1027      │ NWA      │ 90%        │ [Exclude]    │  │
│  │ 3456      │ UNKNOWN  │ --         │ [Lookup] ✏️  │  │
│  └───────────┴──────────┴────────────┴──────────────┘  │
│                                                         │
│  🔍 [Auto-Lookup All Unknown Stores]                    │
│                                                         │
│  CA Module Stores (Always Included):                   │
│  2082, 2242, 5930, 2141, 3284 [Edit List]              │
└─────────────────────────────────────────────────────────┘
```

#### API Endpoints:
- `POST /api/admin/stores/lookup` - Trigger Google lookup for store
- `POST /api/admin/stores/verify` - Mark store state as verified
- `POST /api/admin/stores/add-to-ca` - Add store to CA module
- `DELETE /api/admin/stores/remove-from-ca` - Remove store from CA module

---

### 5. 🆕 **Store Persistence (Critical)**
**Requirement**: "If a store is added into the CA bucket on the UI we will keep that store even if it is not present in a future upload because we should retain spark cost for the store."

**Why**: Store may not have trips in a given upload, but should still appear in dashboard with historical Spark CPD

**Solution**: Persistent store registry + merge logic

#### Store Registry (`data/ca_store_registry.json`):
```json
{
  "stores": {
    "2082": {
      "store_id": "2082",
      "state": "CA",
      "city": "Los Angeles",
      "spark_ytd_cpd": 5.60,
      "target_batch_size": 92,
      "added_date": "2025-10-02",
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "notes": "High-volume store, launched Week 1"
    },
    "2242": {
      "store_id": "2242",
      "state": "CA",
      "city": "Long Beach",
      "spark_ytd_cpd": 5.84,
      "target_batch_size": 81,
      "added_date": "2025-10-02",
      "last_seen_in_upload": "2025-10-13",
      "status": "active",
      "notes": "Medium-volume store, launched Week 1"
    },
    "5930": {
      "store_id": "5930",
      "state": "CA",
      "city": "Anaheim",
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

#### Data Merge Logic:
```python
def merge_with_store_registry(uploaded_df, registry):
    """
    1. Filter uploaded data to CA stores only
    2. Merge with registry (keeps stores even if not in upload)
    3. Update last_seen_in_upload for stores present
    4. Show stores with no recent data as "No trips in this period"
    """
    ca_store_ids = list(registry['stores'].keys())

    # Filter upload to CA stores
    df_ca = uploaded_df[uploaded_df['Store Id'].isin(ca_store_ids)]

    # Create full store list (from registry)
    full_store_list = []
    for store_id, store_info in registry['stores'].items():
        store_data = {
            'store_id': store_id,
            'spark_cpd': store_info['spark_ytd_cpd'],
            'target_batch': store_info['target_batch_size'],
            'has_data': store_id in df_ca['Store Id'].values
        }

        if store_data['has_data']:
            # Merge trip data
            store_trips = df_ca[df_ca['Store Id'] == store_id]
            store_data['total_orders'] = store_trips['Total Orders'].sum()
            store_data['trips'] = len(store_trips)
        else:
            # No data in this upload, show placeholder
            store_data['total_orders'] = 0
            store_data['trips'] = 0
            store_data['status'] = 'No trips in this period'

        full_store_list.append(store_data)

    return full_store_list
```

#### Dashboard Display:
```
Total Orders Chart:
- Store 2082: [Line with data points]
- Store 2242: [Line with data points]
- Store 5930: [Line with data points, highlighted carryover days]
- Store 2141: [Dashed line - "No trips in this period" with last known Spark CPD shown]
```

---

### 6. 🆕 **Modular Architecture for Future States**
**Requirement**: "Wire so potentially other modules could be created as well"

**Why**: NWA, TX, or other state modules may be needed in future

**Solution**: Module-based architecture

#### Module Structure:
```
CA Analysis/
├── modules/
│   ├── ca/                          # California module
│   │   ├── data/
│   │   │   ├── ca_store_registry.json
│   │   │   ├── ca_rate_cards.json
│   │   │   └── ca_store_state_mapping.json
│   │   ├── config.json              # CA-specific config
│   │   ├── dashboard.html
│   │   └── scripts/
│   │       ├── ca_dashboard_metrics.py
│   │       └── ca_store_analysis.py
│   ├── nwa/                         # Future: Northwest Arkansas module
│   │   ├── data/
│   │   ├── config.json
│   │   └── ...
│   └── tx/                          # Future: Texas module
│       └── ...
├── src/
│   ├── ui-server.ts                 # Module-agnostic server
│   ├── module-manager.ts            # Load modules dynamically
│   └── api/
│       ├── modules.ts               # GET /api/modules (list available)
│       └── ...
└── public/
    ├── index.html                   # Module selector
    └── module-selector.html         # Choose CA, NWA, TX, etc.
```

#### Module Config (`modules/ca/config.json`):
```json
{
  "module_id": "ca",
  "module_name": "California DFS Vans",
  "state_filter": ["CA"],
  "enabled": true,
  "launch_date": "2025-10-02",
  "stores": ["2082", "2242", "5930"],
  "vendors": ["FOX", "NTG", "FDC"],
  "features": {
    "vendor_comparison": true,
    "batch_density": true,
    "carryover_detection": true
  },
  "data_paths": {
    "store_registry": "modules/ca/data/ca_store_registry.json",
    "rate_cards": "modules/ca/data/ca_rate_cards.json",
    "store_mapping": "modules/ca/data/ca_store_state_mapping.json"
  },
  "dashboard_url": "/modules/ca/dashboard"
}
```

#### Module Selector UI:
```
┌─────────────────────────────────────────────────────────┐
│  🏢 3P Delivery Vans Analytics - Select Module          │
├─────────────────────────────────────────────────────────┤
│  Available Modules:                                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🌴 California (CA)                                │ │
│  │ 3 stores • Launched 10/02/2025                    │ │
│  │ [View Dashboard →]                                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🌾 Northwest Arkansas (NWA)                       │ │
│  │ Coming soon - Pending Store Ops approval          │ │
│  │ [Not Available]                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🤠 Texas (TX)                                     │ │
│  │ Planned for Q2 2026                               │ │
│  │ [Not Available]                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🔧 [Admin: Create New Module]                          │
└─────────────────────────────────────────────────────────┘
```

#### Module Manager API:
- `GET /api/modules` - List all modules
- `GET /api/modules/:module_id/config` - Get module config
- `POST /api/modules/:module_id/upload` - Upload CSV for specific module
- `GET /api/modules/:module_id/dashboard` - Get module dashboard data

---

## 📋 UPDATED DATA SCHEMA

### Store Registry Schema (Persistent):
```typescript
interface CAStoreRegistry {
  stores: {
    [storeId: string]: {
      store_id: string;
      state: "CA";
      city: string;
      spark_ytd_cpd: number;
      target_batch_size: number;
      added_date: string; // ISO date
      last_seen_in_upload: string; // ISO date
      status: "active" | "paused" | "archived";
      notes: string;
    }
  }
}
```

### Store State Mapping Schema:
```typescript
interface StoreStateMapping {
  stores: {
    [storeId: string]: {
      state: string; // CA, NWA, TX, etc.
      city: string;
      source: "Google" | "Manual" | "API";
      verified: boolean;
      confidence?: number; // 0-1 (for Google lookups)
      added_date: string;
    }
  };
  ca_stores: string[]; // List of store IDs in CA module
}
```

---

## 🏗️ UPDATED ARCHITECTURE

### Data Processing Pipeline (With CA Filtering):
```
1. CSV Upload (contains all states)
     ↓
2. Extract unique Store IDs
     ↓
3. Lookup states (from cache or Google)
     ↓
4. Filter to CA stores ONLY
     ↓
5. Merge with CA Store Registry (keeps stores not in upload)
     ↓
6. Calculate metrics (CPD, batch density, vendor perf)
     ↓
7. Return dashboard data
```

### Admin Workflow:
```
1. Upload CSV → System auto-detects stores
2. Unknown stores → Google lookup (background)
3. Admin reviews state assignments
4. Admin adds CA stores to registry
5. Future uploads → CA stores persisted even if missing
```

---

## 📦 NEW FILE STRUCTURE

```
CA Analysis/
├── modules/
│   └── ca/
│       ├── data/
│       │   ├── ca_store_registry.json       [NEW - Persistent store list]
│       │   ├── ca_rate_cards.json           [Moved from /data/]
│       │   └── ca_store_state_mapping.json  [NEW - State lookup cache]
│       ├── config.json                      [NEW - Module config]
│       └── scripts/
│           └── ca_filter.py                 [NEW - CA filtering logic]
├── src/
│   ├── module-manager.ts                    [NEW - Load modules]
│   ├── api/
│   │   ├── modules.ts                       [NEW - Module API]
│   │   ├── admin/
│   │   │   ├── spark-cpd-bulk.ts           [NEW - CSV bulk upload]
│   │   │   └── store-state.ts              [NEW - State management]
│   └── utils/
│       └── store-state-lookup.ts            [NEW - Google lookup wrapper]
├── scripts/analysis/
│   ├── store_state_lookup.py                [NEW - Google lookup]
│   └── ca_data_filter.py                    [NEW - CA-only filter]
├── public/
│   ├── module-selector.html                 [NEW - Choose CA/NWA/TX]
│   ├── admin/
│   │   ├── spark-cpd-bulk.html             [NEW - Bulk upload UI]
│   │   └── store-state-manager.html        [NEW - State management UI]
├── templates/
│   └── spark_cpd_template.csv               [NEW - CSV template]
```

---

## 🚀 UPDATED IMPLEMENTATION PHASES

### ✅ PHASE 1: Foundation + Store Management (3 Days)
**NEW TASKS**:
- [ ] **P1.1**: Create modular architecture (modules/ca/)
- [ ] **P1.2**: Build store state lookup system (Google API wrapper)
- [ ] **P1.3**: Create CA store registry (persistent JSON)
- [ ] **P1.4**: Implement CA-only filtering logic
- [ ] **P1.5**: Build store state manager admin UI
- [ ] **P1.6**: Deploy skeleton to Render

**Success Criteria**:
- ✅ Can upload CSV, system auto-detects CA stores only
- ✅ Unknown stores trigger Google lookup
- ✅ Admin can verify/edit store states
- ✅ CA stores persisted across uploads

---

### ✅ PHASE 2: Rate Cards + Bulk Upload (2 Days)
**NEW TASKS**:
- [ ] **P2.1**: Build Spark CPD bulk upload (CSV)
- [ ] **P2.2**: Create CSV template download
- [ ] **P2.3**: Implement merge logic (uploaded + registry)
- [ ] **P2.4**: Add contractual adjustment UI (1.00x default)
- [ ] **P2.5**: Test with multiple stores (10+)

**Success Criteria**:
- ✅ Can bulk upload Spark CPD for 20+ stores via CSV
- ✅ Store registry merges correctly
- ✅ Rate cards editable via admin UI

---

### ✅ PHASE 3: Analytics Engine (3 Days)
(Unchanged from original plan)

---

### ✅ PHASE 4: Dashboard UI (3 Days)
**NEW TASKS**:
- [ ] **P4.1**: Add module selector (CA only for now, expandable)
- [ ] **P4.2**: Show "No trips in this period" for stores without data
- [ ] **P4.3**: Display CA stores even if missing from upload

(Rest unchanged)

---

### ✅ PHASE 5: Testing & Deploy (1 Day)
(Compressed from 2 days due to earlier validation)

---

**NEW TOTAL TIMELINE**: 12 days → **12 days** (same, but reallocated tasks)

---

## ✅ FINAL APPROVAL CHECKLIST

Before proceeding, confirm:

- [ ] **Contractual Adjustment**: 1.00x default, editable via admin UI ✅
- [ ] **Spark CPD Bulk Upload**: CSV upload with template download
- [ ] **CA Store Filtering**: Only CA stores in dashboard, non-CA excluded
- [ ] **Store State Lookup**: Auto-lookup via Google, admin verification
- [ ] **Store Persistence**: CA stores kept even if not in future uploads
- [ ] **Modular Architecture**: Built to support NWA/TX modules later

---

## 🎯 Questions for User (Final):

1. **Google Lookup**: Should we use:
   - Option A: Google Search scraping (free, may hit rate limits)
   - Option B: Manual CSV upload of store states initially (no auto-lookup)
   - Option C: Walmart Store Locator API (if you have access)

2. **Store State Verification**: Should unknown stores:
   - Option A: Be excluded from dashboard until admin verifies state
   - Option B: Be included with "Unknown State" label and warning

3. **Module Selector**: For MVP, should we:
   - Option A: Skip module selector, hardcode to CA only (simpler)
   - Option B: Build module selector now (expandable for NWA)

4. **Spark CPD CSV**: Should the template also include:
   - Target Batch Size (per store)
   - Store notes/comments

---

**NEXT STEP**: Reply with answers to the 4 questions above, and I'll finalize the architecture and launch agents!

---

**Status**: 🟡 Critical architecture updates documented, awaiting user confirmation on implementation details
