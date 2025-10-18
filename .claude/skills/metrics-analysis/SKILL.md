---
name: Analyzing CA Delivery Van Metrics
description: Complete weekly metrics analysis for California delivery vans including CPD calculation with anomaly exclusion, carrier performance tracking (FOX/NTG/FDC), week-over-week trends, and dashboard validation. Use when user mentions "analyze metrics", "check weekly performance", "validate dashboard", "review van performance", or "CPD analysis".
---

# CA Delivery Van Metrics Analysis

## When to Use

- "Analyze this week's metrics"
- "Check weekly performance"
- "Validate dashboard data"
- "Review van performance"
- "How are the carriers doing?"
- "Check CPD trends"
- User asks about FOX/NTG/FDC performance

## Quick Analysis

For immediate results:

```bash
# Load and analyze data
python3 << 'EOF'
from scripts.analysis.weekly_metrics import analyze_weekly_metrics
from scripts.analysis.cpd_analysis import load_rate_cards
import pandas as pd

nash_df = pd.read_csv('data/nash_data.csv')
rate_cards = load_rate_cards('data/rate_cards.json')

results = analyze_weekly_metrics(nash_df, rate_cards, min_batch_size=10)

print(f"📊 Latest Week: {results['weeks'][-1]['week_start']}")
print(f"   Orders: {results['weeks'][-1]['total_orders']}")
print(f"   CPD: ${results['weeks'][-1]['weighted_avg_cpd']:.2f}")
print(f"   Excluded: {results['weeks'][-1]['excluded_count']} trips")
EOF
```

## Complete Workflow

### Step 1: Data Validation

```bash
python3 -c "
import pandas as pd
df = pd.read_csv('data/nash_data.csv')
print(f'✅ Loaded {len(df)} trips')
print(f'📅 {df[\"Date\"].min()} to {df[\"Date\"].max()}')
print(f'🏪 {df[\"Store Id\"].nunique()} stores')
print(f'🚚 Carriers: {list(df[\"Carrier\"].unique())}')
"
```

**Validation Checklist:**
- [ ] Nash CSV loaded
- [ ] Full weeks (Monday-Sunday)
- [ ] 273 CA stores
- [ ] 3 carriers (FOX, NTG, FDC)

### Step 2: Calculate Metrics

Run weekly analysis with anomaly exclusion (batches < 10 orders):

```python
from scripts.analysis.weekly_metrics import analyze_weekly_metrics
from scripts.analysis.cpd_analysis import load_rate_cards
import pandas as pd

nash_df = pd.read_csv('data/nash_data.csv')
rate_cards = load_rate_cards('data/rate_cards.json')

# min_batch_size=10 excludes anomalies
results = analyze_weekly_metrics(nash_df, rate_cards, min_batch_size=10)
```

**Metrics Calculated:**
- Total orders/trips/batches per week
- Weighted average CPD (anomalies excluded)
- Carrier performance breakdown
- Store performance rankings
- Exclusion statistics

### Step 3: Analyze Trends

**Key Questions:**

1. **CPD Trending**
   - Compare last 2 weeks
   - Check if within $380-$400 range
   - Flag if change > 5%

2. **Carrier Performance**
   - FOX should be primary (highest volume)
   - Check for unusual CPD spikes
   - Validate carrier mix

3. **Anomaly Exclusions**
   - Should be < 5% of total trips
   - All excluded trips < 10 orders

4. **Store Patterns**
   - Top 10 stores consistent week-over-week
   - No single store > 30% volume

### Step 4: Dashboard Validation

Verify dashboard matches Python calculations:

```bash
npm run test:integration
```

**Checks:**
- [ ] Weekly chart CPD aligns
- [ ] Carrier comparison uses same exclusion logic
- [ ] OTD percentages match Nash data
- [ ] Batch density excludes anomalies
- [ ] CSV export has all fields

### Step 5: Generate Report

**Standard Format:**

```
📊 CA DELIVERY VANS - WEEKLY METRICS
Week: [Start] to [End]

📈 KEY METRICS:
- Orders: [X] (+/- Y% vs last week)
- CPD: $[X.XX] (+/- $Y.YY vs last week)
- Trips: [X]
- Excluded: [X] trips (Z%)

🚚 CARRIER PERFORMANCE:
- FOX: [X] trips, $[X.XX] CPD (Primary)
- NTG: [X] trips, $[X.XX] CPD
- FDC: [X] trips, $[X.XX] CPD

⚠️ ISSUES:
[List concerns or "None"]

✅ VALIDATION:
- Data quality: Pass/Fail
- Anomaly exclusion: Pass/Fail
- Dashboard alignment: Pass/Fail
```

## Validation Gates

All must pass:

```bash
# Data integrity
python3 -m pytest tests/unit/analysis_test.py

# Integration
npm run test:integration

# Dashboard rendering
# Open dashboard.html, verify charts render
```

## Common Issues

### CPD Mismatch
**Symptom:** Dashboard ≠ Python
**Fix:** Check `analytics.service.ts` uses `min_batch_size=10`

### Missing Weeks
**Symptom:** Chart gaps
**Fix:** Verify `get_week_start()` returns Monday

### High Exclusions
**Symptom:** > 10% excluded
**Fix:** Verify threshold is 10 (not higher)

### Carrier Names
**Symptom:** Duplicate carriers
**Fix:** Use `normalize_carrier_name()`

## Key Files

**Python:**
- `scripts/analysis/weekly_metrics.py` - Core logic
- `scripts/analysis/cpd_analysis.py` - CPD calculation
- `scripts/analysis/dashboard.py` - Chart data

**Frontend:**
- `public/weekly-metrics.html` - Weekly chart
- `public/js/weekly-metrics.js` - Rendering
- `public/dashboard.html` - Main dashboard

**Data:**
- `data/nash_data.csv` - Trip data
- `data/rate_cards.json` - Carrier rates
- `States/walmart_stores_ca_only.csv` - Store mapping

**Tests:**
- `tests/unit/analysis_test.py` - Python tests
- `tests/integration/dashboard-flow.test.ts` - E2E tests

## Output Example

```
✅ Analyzing CA Delivery Van Metrics

📊 DATA VALIDATION
✅ Loaded 1,247 trips from nash_data.csv
✅ Date range: 2025-10-07 to 2025-10-13
✅ 273 CA stores detected
✅ All 3 carriers present

📈 WEEKLY METRICS (Oct 7-13, 2025)
- Total Orders: 12,458
- Average CPD: $387.45
- Total Trips: 1,247
- Excluded: 23 trips (1.8%)

🚚 CARRIER PERFORMANCE
- FOX: 856 trips, $385.20 CPD (68.6%)
- NTG: 298 trips, $392.10 CPD (23.9%)
- FDC: 93 trips, $391.80 CPD (7.5%)

📊 WEEK-OVER-WEEK
- CPD: $387.45 vs $389.20 (-$1.75, -0.4%) ✅
- Orders: 12,458 vs 11,923 (+535, +4.5%)

⚠️ ISSUES: None

✅ VALIDATION: All checks passed

📊 Dashboard: http://localhost:3000/weekly-metrics
```

## Progressive Disclosure

For deep-dives, see:
- `reference/cpd-calculation.md` - CPD formula details
- `reference/anomaly-detection.md` - Exclusion logic
- `reference/carrier-analysis.md` - Vendor performance metrics

---

**Version:** 1.0.0
**Created:** 2025-10-17
**Type:** Official Agent Skill (Anthropic format)
