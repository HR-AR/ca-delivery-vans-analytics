# Skill System - Example Usage

## Real-World Scenario: Weekly Metrics Review

### Before Skills (Old Way)

**You had to explain every step:**

```
You: "Hey Claude, I need to analyze this week's metrics. Can you:
     1. Load the Nash data from data/nash_data.csv
     2. Filter to CA stores only (273 stores)
     3. Calculate CPD for each carrier (FOX, NTG, FDC)
     4. Make sure to exclude batches with less than 10 orders because
        those are anomalies that skew the CPD calculations
     5. Calculate the weighted average CPD for the week
     6. Compare it to last week's numbers
     7. Check if any carrier has unusual performance
     8. Validate that the dashboard numbers match the Python calculations
     9. Generate a report with the key findings

     The rate cards are in data/rate_cards.json and should use the
     contractual adjustment factor (default 1.00x). Make sure the
     exclusion logic matches what's in the dashboard..."

Claude: [Follows all steps, takes 5+ messages to complete]
```

**Time**: 5-10 minutes of explanation + execution

---

### After Skills (New Way)

**Just trigger the skill:**

```
You: "Analyze this week's metrics"

Claude: "✅ Using metrics-analysis skill...

📊 VALIDATING DATA
✅ Loaded 1,247 trips from nash_data.csv
✅ Date range: 2025-10-07 to 2025-10-13
✅ 273 CA stores detected
✅ All 3 carriers present (FOX, NTG, FDC)

📈 CALCULATING WEEKLY METRICS
✅ Week: Oct 7 - Oct 13, 2025
   - Total Orders: 12,458
   - Average CPD: $387.45 (weighted, anomalies excluded)
   - Total Trips: 1,247
   - Excluded: 23 trips (1.8% - within normal range)

🚚 CARRIER PERFORMANCE
   - FOX: 856 trips, $385.20 CPD (Primary - 68.6% of volume)
   - NTG: 298 trips, $392.10 CPD (23.9% of volume)
   - FDC: 93 trips, $391.80 CPD (7.5% of volume, backup)

📊 WEEK-OVER-WEEK COMPARISON
   - CPD: $387.45 vs $389.20 last week (-$1.75, -0.4%) ✅
   - Orders: 12,458 vs 11,923 (+535, +4.5%)
   - FOX volume: Stable at ~69%

⚠️ ISSUES FLAGGED
   None - all metrics within expected ranges

✅ VALIDATION STATUS
   - Data quality: Pass
   - Anomaly exclusion: Pass (1.8% excluded, threshold < 5%)
   - Dashboard alignment: Pass (verified CPD matches frontend)

📊 Full charts available at: http://localhost:3000/weekly-metrics

Would you like me to:
- Deep-dive into any specific carrier?
- Generate a Slack announcement?
- Export the data to CSV?"
```

**Time**: 5 seconds

---

## Comparison

| Aspect | Before Skills | After Skills |
|--------|---------------|--------------|
| **Explanation Time** | 5-10 minutes | 5 seconds |
| **Consistency** | Varies each time | Identical process |
| **Error-Prone** | Easy to forget steps | Automated checklist |
| **Documentation** | In your head | Self-documenting |
| **Improvement** | Re-explain each time | Edit once, use forever |

---

## More Examples

### Example 2: Quick Status Check

```
You: "Check weekly performance"

Claude: ✅ Using metrics-analysis skill...
        [Complete analysis in one shot]
```

### Example 3: Dashboard Validation

```
You: "Validate dashboard data"

Claude: ✅ Using metrics-analysis skill...

        Focusing on validation gates:
        ✅ Nash data loaded correctly
        ✅ CPD calculation matches dashboard
        ✅ Anomaly exclusion logic consistent
        ✅ All charts rendering correctly

        No issues found.
```

### Example 4: Carrier Deep-Dive

```
You: "Analyze metrics and focus on FOX performance"

Claude: ✅ Using metrics-analysis skill...
        [Standard analysis]

        📊 FOX DEEP-DIVE (as requested):

        - Volume: 856 trips (68.6% of total)
        - CPD: $385.20 (below contractual max of $390)
        - OTD: 94.2%
        - Batch size avg: 14.6 orders/trip
        - Top stores: #2478 (89 trips), #3124 (76 trips)

        Trending: +3.2% volume vs last week
        Performance: Excellent - primary carrier performing as expected
```

---

## How the Skill Evolved

### Version 1.0.0 (Initial - Oct 17, 2025)
```markdown
## Step 1: Load Data
python3 -c "import pandas as pd; df = pd.read_csv('data/nash_data.csv')"
```

**Problem**: No error handling

---

### Version 1.1.0 (Improved - You edit it)
```markdown
## Step 1: Load Data with Validation
python3 << 'EOF'
import pandas as pd
try:
    df = pd.read_csv('data/nash_data.csv')
    if len(df) == 0:
        print("⚠️ Nash data is empty. Upload new data first.")
        exit(1)
    print(f"✅ Loaded {len(df)} trips")
except FileNotFoundError:
    print("❌ Nash data not found. Run upload first.")
    exit(1)
except pd.errors.ParserError:
    print("❌ Nash CSV format invalid. Check file integrity.")
    exit(1)
EOF
```

**Benefit**: Handles missing files, empty data, and corrupt CSVs

---

### Version 1.2.0 (Enhanced - You add more)
```markdown
## Step 1: Load Data with Full Diagnostics
python3 << 'EOF'
import pandas as pd
from datetime import datetime

try:
    df = pd.read_csv('data/nash_data.csv')

    # Validation checks
    assert len(df) > 0, "Empty dataset"
    assert 'Date' in df.columns, "Missing Date column"
    assert 'Carrier' in df.columns, "Missing Carrier column"

    # Diagnostics
    print(f"✅ Loaded {len(df)} trips")
    print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")

    # Freshness check
    latest = pd.to_datetime(df['Date'].max())
    days_old = (datetime.now() - latest).days
    if days_old > 7:
        print(f"⚠️ Data is {days_old} days old. Consider uploading newer data.")

except FileNotFoundError:
    print("❌ Nash data not found at data/nash_data.csv")
    print("   Run: Upload Nash CSV first")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
EOF
```

**Benefit**: Data freshness alerts, better error messages, validation checks

---

## Pattern Learning in Action

### Week 1: You Explain
```
You: "Analyze metrics. Load Nash, calculate CPD excluding small batches,
     check carrier performance, validate dashboard alignment."

Claude: [Follows instructions step by step]
System: 🧠 Recorded pattern: "analysis" (count: 1/2)
```

### Week 2: System Learns
```
You: "Do the same metrics analysis as last week"

Claude: "🎓 I notice you've explained this workflow before. One more
        similar request and I'll create a reusable skill so you won't
        need to explain the steps again."

        [Executes analysis]

System: 🧠 Pattern threshold reached!
        ✅ Created .claude/skills/metrics-analysis/SKILL.md
```

### Week 3: Auto-Pilot
```
You: "Analyze metrics"

Claude: "✅ Using metrics-analysis skill..."
        [Complete workflow executes automatically]

        This used your custom metrics-analysis skill. If you want to
        adjust the methodology, you can edit:
        .claude/skills/metrics-analysis/SKILL.md
```

---

## Creating Your Next Skill

### Scenario: You frequently generate Slack announcements

**First time:**
```
You: "Generate a Slack announcement for this week's metrics.
     Format it as:
     - Header: 📊 CA Delivery Vans - Weekly Update
     - Key metrics (orders, CPD, carriers)
     - Week-over-week comparison
     - Action items if any issues
     - Footer: Dashboard link"

Claude: [Generates announcement following your format]
```

**Second time:**
```
You: "Create a Slack announcement with the same format"

Claude: "🎓 I'm tracking this pattern. One more similar request and
        I'll create a 'slack-announcement' skill."
        [Generates announcement]
```

**Third time:**
```
You: "Generate Slack announcement"

Claude: "✅ Using slack-announcement skill..."

        📊 CA Delivery Vans - Weekly Update
        Week of Oct 7-13, 2025

        Key Metrics:
        • 12,458 orders delivered (+4.5% vs last week)
        • $387.45 avg CPD (-0.4% vs last week) ✅
        • FOX: 856 trips (68.6%), $385.20 CPD

        Status: All metrics within expected ranges

        📈 Dashboard: http://localhost:3000/weekly-metrics


        ✅ New skill created: slack-announcement
        This format will be used automatically for future announcements.
```

---

## Advanced Usage

### Combining Skills

```
You: "Analyze metrics, then generate Slack announcement if everything looks good"

Claude: "✅ Using metrics-analysis skill...
        [Runs analysis]

        ✅ All metrics pass validation

        ✅ Using slack-announcement skill...
        [Generates formatted announcement]

        Ready to post!"
```

### Conditional Execution

```
You: "Analyze metrics. If CPD is over $395, flag it as critical."

Claude: "✅ Using metrics-analysis skill...

        ⚠️ CRITICAL ALERT
        CPD is $397.20 (above $395 threshold)

        Detailed breakdown:
        - FOX: $385.20 (OK)
        - NTG: $412.80 (OVER - investigate!)
        - FDC: $391.50 (OK)

        Issue: NTG CPD spike of +$20.70 (+5.3%)

        Recommended actions:
        1. Review NTG trips for this week
        2. Check if route changes affected efficiency
        3. Contact NTG vendor for explanation"
```

### Custom Parameters

```
You: "Analyze metrics excluding only batches under 5 orders this time"

Claude: "✅ Using metrics-analysis skill with custom threshold...
        (Using min_batch_size=5 instead of default 10)

        📊 WEEKLY METRICS
        - Excluded: 8 trips (0.6% vs typical 1.8%)
        - Average CPD: $388.90 (slightly higher with more data included)

        Note: Lower threshold includes more edge cases. Default of 10
        is recommended for stable CPD calculations."
```

---

## Real Impact

### Time Saved (Per Week)
- **Metrics Analysis**: 10 min → 5 sec (99.2% reduction)
- **Slack Announcement**: 5 min → 5 sec (98.3% reduction)
- **Dashboard Validation**: 8 min → 5 sec (99.0% reduction)

**Total**: ~23 minutes saved per week
**Annual**: ~20 hours saved

### Consistency Gained
- ✅ Same validation steps every time
- ✅ No forgotten checks
- ✅ Standardized reporting format
- ✅ Reproducible analysis

### Knowledge Captured
- ✅ Methodology documented (not in your head)
- ✅ Portable (works in any environment)
- ✅ Shareable (team can use same skills)
- ✅ Improvable (edit once, benefits forever)

---

## Try It Yourself

1. **Right now**: Say "Analyze this week's metrics"
2. **This week**: When you need a report, say "Generate Slack announcement"
3. **Next week**: Notice patterns and let skills auto-generate

**The system learns from you. The more you use it, the smarter it gets.**

---

**Questions?**
- Read full docs: `.claude/README.md`
- Quick start: `.claude/QUICK-START.md`
- View skills: `ls .claude/skills/`
- Check learning: `cat .claude/learning/patterns.json`
