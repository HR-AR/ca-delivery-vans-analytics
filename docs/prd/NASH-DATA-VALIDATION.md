# Nash Data Validation & Error Diagnostics

**Date**: 2025-10-13
**Purpose**: Catch Nash data format changes and provide clear error messages

---

## 🎯 REQUIREMENT

**User Request**: "If the Nash Data changes, please point to the error that is tripping up the upload. In case I need to check with Nash or make sure they are uploading the correct document."

**Why This Matters**:
- Nash may change CSV column names (e.g., "Store Id" → "Store ID")
- Nash may add/remove columns
- Nash may change date formats
- Nash may export corrupted data
- Need to catch these BEFORE attempting analysis

---

## ✅ EXPECTED NASH DATA FORMAT

### Required Columns (From `Data Example/data_table_1 (2).csv`):
```csv
Carrier,Date,Store Id,Walmart Trip Id,Courier Name,
Pickup Enroute,Pickup Arrived,Load Start Time,Load End Time,Pickup Complete,Last Dropoff Complete,
Trip Planned Start,Driver Dwell Time,Driver Load Time,Driver Sort Time,Driver Store Time,
Trip Actual Time,Driver Total Time,Estimated Duration,Headroom,
Total Orders,Failed Pickups,Driver Accepted Orders,Delivered Orders,Returned Orders,
Returned Attempted Orders,Returned Not Attempted Orders,Pending Orders,
Drops Per Hour Trip,Drops Per Hour Total,Adjusted Cddr,Returned Orders Rate,
Failed Orders,Failed Orders Rate,Pending Orders Rate,Is Pickup Arrived Ontime
```

### Critical Columns (Must Have):
```
1. Store Id         (for CA filtering)
2. Date             (for time series)
3. Carrier          (for vendor comparison: FOX/NTG/FDC)
4. Total Orders     (for volume metrics)
5. Delivered Orders (for CPD calculation)
6. Walmart Trip Id  (unique identifier)
```

### Optional Columns (Nice to Have, but analysis works without them):
```
- Driver Dwell Time, Driver Load Time (for time analysis)
- Failed Pickups, Returned Orders, Pending Orders (for failure analysis)
- Drops Per Hour Trip (for efficiency metrics)
```

---

## 🚨 VALIDATION CHECKS

### 1. Column Name Validation
**Check**: All critical columns present (exact spelling)

**Error Examples**:
```
❌ UPLOAD FAILED: Missing Critical Column

Required column: "Store Id"
Found columns: "Store ID", "Date", "Carrier", ...

🔍 Diagnosis:
Nash changed "Store Id" → "Store ID" (capital D)

✅ Solution:
Contact Nash team to use column name "Store Id" (lowercase "d")
OR: Ask admin to manually rename column in uploaded CSV

Affected Analysis: CA filtering will fail
```

```
❌ UPLOAD FAILED: Missing Critical Columns (3)

Missing:
  1. "Store Id"
  2. "Total Orders"
  3. "Delivered Orders"

Found columns: "Date", "Carrier", "Trip ID", "Orders Count", ...

🔍 Diagnosis:
Nash changed multiple column names or exported wrong report

✅ Solution:
1. Verify with Nash: Request "Trip Detail Export" format
2. Expected column names: [Download Expected Format CSV]
3. Contact: [Nash Support Email/Slack]

Affected Analysis: All analysis will fail
```

---

### 2. Data Type Validation
**Check**: Columns have correct data types

**Error Examples**:
```
❌ UPLOAD FAILED: Invalid Data Type

Column: "Store Id"
Expected: Numeric (e.g., 2082)
Found: Text (e.g., "Store-2082")

Row examples:
  Row 5: "Store-2082"
  Row 12: "Store-2242"
  Row 18: "Store-5930"

🔍 Diagnosis:
Nash added "Store-" prefix to Store Id

✅ Solution:
Contact Nash to export Store Id as numeric only (remove "Store-" prefix)

Affected Analysis: CA filtering (can't match with States/Book3.xlsx)
```

```
❌ UPLOAD FAILED: Invalid Date Format

Column: "Date"
Expected: MM/DD/YYYY or YYYY-MM-DD (e.g., 10/08/2025 or 2025-10-08)
Found: Text (e.g., "October 8, 2025")

Row examples:
  Row 2: "October 8, 2025"
  Row 5: "October 9, 2025"

🔍 Diagnosis:
Nash changed date format from numeric to text

✅ Solution:
Contact Nash to export dates in format: MM/DD/YYYY

Affected Analysis: Time series charts, daily breakdown
```

---

### 3. Store ID Validation
**Check**: All Store IDs are in States/Book3.xlsx

**Warning Examples** (Not failure, just warnings):
```
⚠️  UPLOAD WARNING: Unknown Stores Found

Upload contains 127 stores not in state mapping:
  - Store 1234 (found in 15 trips)
  - Store 5678 (found in 8 trips)
  - Store 9012 (found in 22 trips)
  ... 124 more

These stores EXCLUDED from analysis (CA stores only)

🔍 Possible Reasons:
1. Nash exported all stores (CA + non-CA) → Expected, will auto-filter
2. New CA stores launched but not in States/Book3.xlsx → Update States file
3. Store ID typo in Nash data (e.g., 20822 instead of 2082) → Contact Nash

✅ Action:
- If expected non-CA stores: Ignore warning, system filters automatically
- If new CA stores: Download [Store List CSV] and add to States/Book3.xlsx
- If typo: Contact Nash to fix Store IDs in export

Affected Analysis: Missing stores won't appear in dashboard
```

---

### 4. Carrier Name Validation
**Check**: Carrier names match expected vendors (FOX, NTG, FDC)

**Warning Example**:
```
⚠️  UPLOAD WARNING: Unexpected Carrier Names

Expected carriers: FOX, NTG, FDC
Found in upload: FOX, NTG, FDC, "Fox-Drop", "JW Logistics", "DeliverOL"

Unknown carriers (will be grouped as "Other"):
  - "Fox-Drop" (12 trips)
  - "JW Logistics" (8 trips)
  - "DeliverOL" (15 trips)

🔍 Diagnosis:
Nash includes additional carriers or uses different naming

✅ Action:
If these are legitimate CA carriers:
1. Add to rate cards via admin UI
2. Contact Finance (Brahmi) for contract rates

If typo (e.g., "Fox-Drop" should be "FOX"):
Contact Nash to standardize carrier names

Affected Analysis: Vendor comparison chart (unknown carriers grouped as "Other")
```

---

### 5. Empty/Null Data Validation
**Check**: Critical fields not empty

**Error Example**:
```
❌ UPLOAD FAILED: Empty Critical Data

Column: "Store Id"
Empty/Null values found in 45 rows

Row examples:
  Row 12: Store Id = NULL, Date = 10/08/2025, Carrier = FOX
  Row 28: Store Id = "", Date = 10/09/2025, Carrier = NTG
  Row 56: Store Id = NULL, Date = 10/10/2025, Carrier = FDC

🔍 Diagnosis:
Nash export has incomplete data (missing Store IDs)

✅ Solution:
1. Contact Nash: Request re-export with complete data
2. Verify Nash query filters correctly
3. Check if Nash database has data quality issues

Affected Analysis: Can't process trips without Store ID
```

---

### 6. Duplicate Trip Validation
**Check**: No duplicate Walmart Trip IDs

**Warning Example**:
```
⚠️  UPLOAD WARNING: Duplicate Trips Found

Duplicate Walmart Trip IDs detected:
  - Trip "abc123" appears 2 times (Rows 15, 87)
  - Trip "def456" appears 3 times (Rows 22, 45, 99)

Total duplicates: 5 trips

🔍 Diagnosis:
Nash export contains duplicate rows (possible data corruption)

✅ Action:
System will de-duplicate automatically (keep first occurrence)
Contact Nash if duplicates persist in future uploads

Affected Analysis: Metrics may be slightly inflated if not de-duplicated
```

---

## 📊 VALIDATION REPORT UI

### Upload Page (`index.html`) - Validation Step:
```
┌─────────────────────────────────────────────────────────┐
│  Upload Nash Trip Data                                  │
├─────────────────────────────────────────────────────────┤
│  [Choose File] data_table_1.csv                         │
│  [Upload & Validate]                                    │
│                                                         │
│  ⏳ Validating upload... (Step 1 of 3)                  │
│                                                         │
│  ✅ Step 1: Column validation         PASSED            │
│     All 36 required columns found                       │
│                                                         │
│  ✅ Step 2: Data type validation      PASSED            │
│     Store Id: Numeric ✓                                 │
│     Date: Valid format ✓                                │
│     Total Orders: Numeric ✓                             │
│                                                         │
│  ⚠️  Step 3: Store validation         WARNING           │
│     127 non-CA stores excluded                          │
│     [View Excluded Stores]                              │
│                                                         │
│  ✅ Ready to analyze                                    │
│     CA stores found: 8                                  │
│     Total trips: 145                                    │
│     Date range: 10/08/2025 - 10/13/2025                 │
│                                                         │
│  [Proceed to Dashboard] [Download Validation Report]    │
└─────────────────────────────────────────────────────────┘
```

### Error State:
```
┌─────────────────────────────────────────────────────────┐
│  Upload Nash Trip Data                                  │
├─────────────────────────────────────────────────────────┤
│  [Choose File] data_table_wrong_format.csv              │
│  [Upload & Validate]                                    │
│                                                         │
│  ❌ VALIDATION FAILED                                   │
│                                                         │
│  ❌ Step 1: Column validation         FAILED            │
│                                                         │
│  Missing Critical Columns (3):                          │
│  1. "Store Id"                                          │
│  2. "Total Orders"                                      │
│  3. "Delivered Orders"                                  │
│                                                         │
│  Found Columns (30):                                    │
│  Store ID, Date, Carrier, Trip ID, Orders Count, ...    │
│                                                         │
│  🔍 Diagnosis:                                          │
│  Nash changed column names or exported wrong report     │
│                                                         │
│  ✅ Solutions:                                          │
│  1. [Download Expected Format Template]                 │
│  2. Contact Nash: #nash-support Slack channel           │
│  3. Verify export type: "Trip Detail Export"            │
│                                                         │
│  [Download Full Validation Report] [Try Again]          │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 VALIDATION REPORT (Downloadable)

### Format: `validation_report_2025-10-13.txt`
```
============================================================
NASH DATA UPLOAD VALIDATION REPORT
============================================================
Upload Date: 2025-10-13 14:30:22 PST
File: data_table_1 (2).csv
File Size: 21,691 bytes
Total Rows: 51 (50 data rows + 1 header)

============================================================
VALIDATION RESULTS
============================================================

✅ PASSED: Column Validation
   All 36 required columns found
   Critical columns: ✓ Store Id, ✓ Date, ✓ Carrier,
                     ✓ Total Orders, ✓ Delivered Orders,
                     ✓ Walmart Trip Id

✅ PASSED: Data Type Validation
   Store Id: Numeric (100% valid)
   Date: Date format MM/DD/YYYY (100% valid)
   Total Orders: Numeric (100% valid)
   Delivered Orders: Numeric (100% valid)

⚠️  WARNING: Store Validation
   Total unique stores in upload: 135
   CA stores found: 8 (2082, 2242, 5930, 1027, 973, ...)
   Non-CA stores excluded: 127

   Excluded stores by state:
     TX: 45 stores
     AR: 32 stores
     FL: 28 stores
     NWA: 22 stores

✅ PASSED: Carrier Validation
   Expected carriers found: FOX (12 trips), NTG (28 trips), FDC (0 trips)
   Unknown carriers: JW Logistics (8 trips), DeliverOL (2 trips)
   → Will be grouped as "Other" in vendor comparison

✅ PASSED: Data Completeness
   No empty Store IDs
   No empty Dates
   No empty Total Orders

✅ PASSED: Duplicate Check
   No duplicate Walmart Trip IDs found

============================================================
SUMMARY
============================================================
Status: ✅ READY TO ANALYZE

CA Trips Ready: 145 trips
Store Count: 8 CA stores
Date Range: 10/08/2025 - 10/13/2025
Data Quality: Excellent

Actions Required: None
Warnings: 127 non-CA stores auto-excluded (expected behavior)

============================================================
```

---

## 🔧 IMPLEMENTATION

### Python Validation Script (`scripts/analysis/nash_data_validator.py`):
```python
import pandas as pd
import json
from datetime import datetime

class NashDataValidator:
    REQUIRED_COLUMNS = [
        'Store Id', 'Date', 'Carrier', 'Walmart Trip Id',
        'Total Orders', 'Delivered Orders'
    ]

    OPTIONAL_COLUMNS = [
        'Driver Dwell Time', 'Driver Load Time', 'Failed Pickups',
        'Returned Orders', 'Pending Orders'
    ]

    def validate_upload(self, csv_path, states_csv_path):
        """
        Validate Nash CSV upload.
        Returns: {
            'valid': bool,
            'errors': [],
            'warnings': [],
            'summary': {...}
        }
        """
        report = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'summary': {}
        }

        try:
            df = pd.read_csv(csv_path)

            # 1. Column validation
            missing_cols = []
            for col in self.REQUIRED_COLUMNS:
                if col not in df.columns:
                    missing_cols.append(col)

            if missing_cols:
                report['valid'] = False
                report['errors'].append({
                    'type': 'MISSING_COLUMNS',
                    'message': f'Missing {len(missing_cols)} critical columns',
                    'details': missing_cols,
                    'found_columns': list(df.columns),
                    'solution': 'Contact Nash to use correct export format'
                })
                return report

            # 2. Data type validation
            if not pd.api.types.is_numeric_dtype(df['Store Id']):
                report['valid'] = False
                report['errors'].append({
                    'type': 'INVALID_DATA_TYPE',
                    'column': 'Store Id',
                    'message': 'Store Id must be numeric',
                    'examples': df['Store Id'].head(5).tolist(),
                    'solution': 'Contact Nash to export Store Id as numbers'
                })

            # 3. Store validation
            states_df = pd.read_csv(states_csv_path)
            ca_stores = states_df[states_df['State'] == 'CA']['Store ID'].tolist()

            upload_stores = df['Store Id'].unique()
            ca_in_upload = [s for s in upload_stores if s in ca_stores]
            non_ca_in_upload = [s for s in upload_stores if s not in ca_stores]

            if non_ca_in_upload:
                report['warnings'].append({
                    'type': 'NON_CA_STORES',
                    'message': f'Excluded {len(non_ca_in_upload)} non-CA stores',
                    'count': len(non_ca_in_upload),
                    'action': 'Auto-filtered (expected behavior)'
                })

            # 4. Carrier validation
            expected_carriers = ['FOX', 'NTG', 'FDC']
            found_carriers = df['Carrier'].unique()
            unknown_carriers = [c for c in found_carriers if c not in expected_carriers]

            if unknown_carriers:
                report['warnings'].append({
                    'type': 'UNKNOWN_CARRIERS',
                    'message': f'Found {len(unknown_carriers)} unknown carriers',
                    'carriers': unknown_carriers,
                    'action': 'Will be grouped as "Other"'
                })

            # 5. Summary
            report['summary'] = {
                'total_rows': len(df),
                'ca_trips': len(df[df['Store Id'].isin(ca_stores)]),
                'ca_stores': len(ca_in_upload),
                'date_range': f"{df['Date'].min()} - {df['Date'].max()}",
                'status': 'READY' if report['valid'] else 'FAILED'
            }

        except Exception as e:
            report['valid'] = False
            report['errors'].append({
                'type': 'PARSE_ERROR',
                'message': str(e),
                'solution': 'Verify CSV is not corrupted'
            })

        return report
```

### API Endpoint (`src/api/validate.ts`):
```typescript
app.post('/api/validate-upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const statesPath = 'States/walmart_stores_all.csv';

  // Run Python validation
  const result = await runPythonScript(
    'scripts/analysis/nash_data_validator.py',
    [filePath, statesPath]
  );

  const report = JSON.parse(result);

  // Return validation report
  res.json({
    valid: report.valid,
    errors: report.errors,
    warnings: report.warnings,
    summary: report.summary
  });
});
```

---

## ✅ SUCCESS CRITERIA

### User Experience:
- ✅ Upload fails fast with clear error messages (< 2 seconds)
- ✅ Errors point to exact problem (column name, data type, etc.)
- ✅ Errors include suggested solutions
- ✅ Warnings don't block upload (e.g., non-CA stores)
- ✅ Downloadable validation report for Nash team

### Error Messages Must Include:
1. **What** went wrong (missing column, invalid data type)
2. **Where** in the data (row numbers, examples)
3. **Why** it matters (affected analysis)
4. **How** to fix (contact Nash, fix format)

---

**Status**: ✅ Nash data validation and error diagnostics fully designed!
