---
name: metrics-analysis
description: Complete workflow for analyzing CA delivery van weekly metrics. Validates data, calculates CPD with anomaly exclusion, identifies trends, and flags issues. Auto-invoked when user asks to "analyze metrics", "check weekly performance", or "validate dashboard data".
version: 1.0.0
created: 2025-10-17
allowed-tools: [bash_tool, view, read, edit]
---

# CA Metrics Analysis Skill

**⚡ Complete workflow for weekly delivery van metrics analysis**

## When to Use

Auto-invoke this skill when user mentions:
- "Analyze the metrics"
- "Check weekly performance"
- "Validate dashboard data"
- "Review this week's numbers"
- "How are the vans performing?"
- "Check for anomalies"

## Context: Your Project

**Project**: CA Delivery Vans Analytics Dashboard
**Data Source**: Nash CSV exports (California stores only)
**Key Metrics**: CPD (Cost Per Delivery), OTD (On-Time Delivery), Batch Density
**Vendors**: FOX, NTG, FDC (3PL delivery vendors)
**Stores**: 273 California Walmart stores

## Analysis Methodology

### Step 1: Data Validation
```bash
# Check if latest Nash data is loaded
python3 -c "
from scripts.analysis.weekly_metrics import analyze_weekly_metrics
import pandas as pd
import json

# Load Nash data
nash_df = pd.read_csv('data/nash_data.csv')
print(f'✅ Loaded {len(nash_df)} trips')
print(f'📅 Date range: {nash_df[\"Date\"].min()} to {nash_df[\"Date\"].max()}')
print(f'🏪 Stores: {nash_df[\"Store Id\"].nunique()} unique')
print(f'🚚 Carriers: {nash_df[\"Carrier\"].unique()}')
"
```

**Validation Checklist**:
- [ ] Nash CSV loaded successfully
- [ ] Date range covers full weeks (Monday-Sunday)
- [ ] CA stores only (273 expected)
- [ ] All 3 carriers present (FOX, NTG, FDC)
- [ ] No missing critical columns

### Step 2: Calculate Weekly Metrics
```bash
# Run weekly analysis with anomaly exclusion
python3 << 'EOF'
from scripts.analysis.weekly_metrics import analyze_weekly_metrics
from scripts.analysis.cpd_analysis import load_rate_cards
import pandas as pd
import json

# Load data
nash_df = pd.read_csv('data/nash_data.csv')
rate_cards = load_rate_cards('data/rate_cards.json')

# Run analysis (min_batch_size=10 to exclude anomalies)
results = analyze_weekly_metrics(nash_df, rate_cards, min_batch_size=10)

print("\n📊 WEEKLY METRICS SUMMARY")
print("=" * 60)
print(f"Total Weeks Analyzed: {results['summary']['total_weeks']}")
print(f"Date Range: {results['summary']['date_range']['start']} to {results['summary']['date_range']['end']}")

# Latest week
if results['weeks']:
    latest = results['weeks'][-1]
    print(f"\n🔍 LATEST WEEK: {latest['week_start']} to {latest['week_end']}")
    print(f"   Total Trips: {latest['total_trips']}")
    print(f"   Total Orders: {latest['total_orders']}")
    print(f"   Average CPD: ${latest['weighted_avg_cpd']:.2f}")
    print(f"   Excluded (anomalies): {latest['excluded_count']} trips")

    # Carrier breakdown
    print(f"\n🚚 CARRIER PERFORMANCE:")
    for carrier, metrics in latest['carriers'].items():
        print(f"   {carrier}: {metrics['trips']} trips, ${metrics['avg_cpd']:.2f} CPD")
EOF
```

**Metrics Calculated**:
- Total orders/trips/batches per week
- Weighted average CPD (excluding batches < 10 orders)
- Carrier performance (FOX, NTG, FDC)
- Store performance (top/bottom performers)
- Anomaly exclusions (single-order trips skipped)

### Step 3: Trend Analysis
```python
# Week-over-week comparison
# This identifies:
# - CPD increases/decreases
# - Volume shifts between carriers
# - Store performance changes
# - Seasonal patterns

# Flag if:
# - CPD change > 5% week-over-week
# - Carrier volume shift > 20%
# - Single store > 30% of total volume
```

**Key Questions to Answer**:
1. **Is CPD trending up or down?**
   - Compare last 2 weeks
   - Check if within contractual rates ($380-$400)

2. **Are there carrier performance issues?**
   - FOX should be primary (highest volume)
   - NTG/FDC as backup carriers
   - Check if any carrier has unusual CPD spikes

3. **Are anomalies being excluded properly?**
   - Excluded count should be < 5% of total trips
   - All excluded trips should have < 10 orders

4. **Do stores show unusual patterns?**
   - Top 10 stores should be consistent week-over-week
   - No single store > 30% of total volume

### Step 4: Dashboard Validation
```bash
# Verify dashboard calculations match Python backend
# Check that weighted CPD aligns between:
# 1. weekly_metrics.py (source of truth)
# 2. dashboard.html (frontend display)
# 3. analytics.service.ts (API layer)

# Run integration test
npm run test:integration
```

**Dashboard Checks**:
- [ ] Weekly chart shows correct CPD trend
- [ ] Carrier comparison uses same exclusion logic
- [ ] OTD percentages match Nash data
- [ ] Batch density chart excludes anomalies
- [ ] CSV export includes all calculated fields

### Step 5: Report Findings

**Standard Report Format**:
```
📊 CA DELIVERY VANS - WEEKLY METRICS REPORT
Week: [Start Date] to [End Date]

📈 KEY METRICS:
- Total Orders: [X] (+/- Y% vs last week)
- Average CPD: $[X.XX] (+/- $Y.YY vs last week)
- Total Trips: [X]
- Anomalies Excluded: [X] trips (Z%)

🚚 CARRIER PERFORMANCE:
- FOX: [X] trips, $[X.XX] CPD (Primary)
- NTG: [X] trips, $[X.XX] CPD
- FDC: [X] trips, $[X.XX] CPD

⚠️ ISSUES FLAGGED:
- [List any concerns: CPD spikes, anomaly %, carrier imbalance]

✅ VALIDATION STATUS:
- Data quality: [Pass/Fail]
- Anomaly exclusion: [Pass/Fail]
- Dashboard alignment: [Pass/Fail]
```

## Validation Gates

Before marking analysis complete, ALL must pass:

```bash
# 1. Data integrity
python3 -m pytest tests/unit/analysis_test.py

# 2. Integration checks
npm run test:integration

# 3. Dashboard rendering
# Open dashboard.html and verify:
# - All charts render
# - Metrics match Python output
# - No console errors
```

## Common Issues & Fixes

### Issue 1: CPD Calculation Mismatch
**Symptom**: Dashboard CPD ≠ Python script CPD
**Root Cause**: Frontend not excluding anomalies (batches < 10 orders)
**Fix**: Verify `analytics.service.ts` uses same `min_batch_size=10` logic

### Issue 2: Missing Weeks in Chart
**Symptom**: Weekly chart has gaps
**Root Cause**: Nash data upload incomplete or missing week_start calculation
**Fix**: Check `get_week_start()` in `weekly_metrics.py` returns Monday correctly

### Issue 3: Anomaly Exclusion Too Aggressive
**Symptom**: Excluded count > 10% of trips
**Root Cause**: min_batch_size set too high
**Fix**: Verify threshold is 10 (not 15 or 20)

### Issue 4: Carrier Name Normalization
**Symptom**: Same carrier appears twice (e.g., "FOX" and "Fox")
**Root Cause**: Case-sensitive carrier names
**Fix**: Use `normalize_carrier_name()` function consistently

## Files to Check

When analyzing metrics, reference these files:

**Python Backend**:
- `scripts/analysis/weekly_metrics.py` - Core calculation logic
- `scripts/analysis/cpd_analysis.py` - CPD calculation with rate cards
- `scripts/analysis/dashboard.py` - Data aggregation for charts

**Frontend**:
- `public/weekly-metrics.html` - Weekly chart page
- `public/js/weekly-metrics.js` - Chart rendering logic
- `public/dashboard.html` - Main dashboard

**Data**:
- `data/nash_data.csv` - Trip data (source of truth)
- `data/rate_cards.json` - Carrier rate cards
- `States/walmart_stores_ca_only.csv` - CA store mapping

**Tests**:
- `tests/unit/analysis_test.py` - Python calculation tests
- `tests/integration/dashboard-flow.test.ts` - End-to-end tests

## Skill Improvement Log

### Version 1.0.0 (2025-10-17)
- Initial creation based on project context
- Captures standard weekly analysis workflow
- Includes validation gates and common issues

**Next Improvements**:
- Add automated alerting thresholds (when CPD > $X, send notification)
- Include seasonal adjustment factors (holiday weeks)
- Auto-generate Slack report format from metrics
- Add store-level deep-dive analysis

## Usage Example

**User**: "Analyze this week's metrics"

**Claude** (using this skill):
```
✅ Using metrics-analysis skill...

📊 VALIDATING DATA
✅ Loaded 1,247 trips from nash_data.csv
✅ Date range: 2025-10-07 to 2025-10-13
✅ 273 CA stores detected
✅ All 3 carriers present

📈 CALCULATING WEEKLY METRICS
✅ Week: Oct 7 - Oct 13, 2025
   - Total Orders: 12,458
   - Average CPD: $387.45
   - Excluded: 23 trips (1.8% - within normal range)

🚚 CARRIER PERFORMANCE
   - FOX: 856 trips, $385.20 CPD (Primary - Good)
   - NTG: 298 trips, $392.10 CPD (Within range)
   - FDC: 93 trips, $391.80 CPD (Backup carrier)

✅ VALIDATION PASSED
   - Data quality: Pass
   - Anomaly exclusion: Pass (1.8% excluded)
   - Dashboard alignment: Pass

📊 Full report available in dashboard
```

---

**Meta**: This skill was created as a practical example for the Self-Learning Skill System. It demonstrates how repetitive analysis workflows can be captured and automated.
