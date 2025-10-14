# CA Delivery Vans Analytics - Python Scripts

## Setup

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

2. Install requirements:
```bash
pip install -r requirements.txt
```

## Scripts

### convert_stores.py
Converts Walmart stores Excel file to CSV format and creates CA-only version.

**Usage:**
```bash
python scripts/convert_stores.py
```

**Output:**
- `States/walmart_stores_all.csv` - All 4,550 stores
- `States/walmart_stores_ca_only.csv` - 273 CA stores only

### validate_nash.py
Validates Nash CSV files for required columns, data types, and CA store compliance.

**Usage:**
```bash
python scripts/validate_nash.py <path_to_nash_csv>
```

**Example:**
```bash
python scripts/validate_nash.py "Data Example/data_table_1 (2).csv"
```

**Validation Checks:**
- Required column names (EXACT match, including "Store Id" with lowercase 'd')
- CA store validation against reference list
- Carrier validation (FOX, NTG, FDC expected)
- Data type validation
- Missing data detection

**Output:**
JSON report with:
- `valid`: boolean indicating if validation passed
- `errors`: list of validation errors
- `warnings`: list of warnings (e.g., non-CA stores found)
- `stats`: statistics about the data

## Analysis Modules (Phase 3)

Located in `scripts/analysis/`:
- `dashboard.py` - Dashboard analysis
- `store_analysis.py` - Store-level analysis
- `vendor_analysis.py` - Vendor performance analysis
- `cpd_analysis.py` - Cost Per Delivery analysis
- `batch_analysis.py` - Batch processing analysis
- `performance.py` - Performance metrics analysis

## Required Columns (Nash Format)

The validator checks for these EXACT column names:

**Critical Columns:**
- `Store Id` (lowercase 'd' - NOT "Store ID")
- `Date`
- `Carrier`
- `Total Orders`

**Full Column List:**
- Carrier
- Date
- Store Id
- Walmart Trip Id
- Courier Name
- Pickup Enroute
- Pickup Arrived
- Load Start Time
- Load End Time
- Pickup Complete
- Last Dropoff Complete
- Trip Planned Start
- Driver Dwell Time
- Driver Load Time
- Driver Sort Time
- Driver Store Time
- Trip Actual Time
- Driver Total Time
- Estimated Duration
- Headroom
- Total Orders
- Failed Pickups
- Driver Accepted Orders
- Delivered Orders
- Returned Orders
- Returned Attempted Orders
- Returned Not Attempted Orders
- Pending Orders
- Drops Per Hour Trip
- Drops Per Hour Total
- Adjusted Cddr
- Returned Orders Rate
- Failed Orders
- Failed Orders Rate
- Pending Orders Rate
- Is Pickup Arrived Ontime

## Error Types

**MISSING_COLUMNS:**
Required columns are missing from the CSV file.

**COLUMN_NAME_MISMATCH:**
Column names don't match exactly (e.g., "Store ID" vs "Store Id").

**NON_CA_STORES (Warning):**
Data contains stores that are not in California.

**UNKNOWN_CARRIERS (Warning):**
Data contains carrier names not in the expected list.

**NULL_VALUES (Warning):**
Critical columns contain null/missing values.

## Testing

Test the validator with the example file:
```bash
python scripts/validate_nash.py "Data Example/data_table_1 (2).csv"
```

Expected result: PASSED with warnings about non-CA stores
