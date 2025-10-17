# Claude Skills & Learning System

This directory contains the Self-Learning Skill System for the CA Delivery Vans Analytics project.

## Directory Structure

```
.claude/
├── README.md                    # This file
├── skills/                      # Auto-generated and manual skills
│   └── metrics-analysis/
│       └── SKILL.md            # Weekly metrics analysis workflow
└── learning/
    └── patterns.json           # Pattern tracking database
```

## What Are Skills?

Skills are reusable workflows that Claude can auto-invoke when it detects certain patterns in your requests. They capture your preferred methodology for recurring tasks.

### Current Skills

#### 1. `metrics-analysis` (v1.0.0)
**Purpose**: Complete workflow for analyzing CA delivery van weekly metrics

**Triggers**:
- "Analyze the metrics"
- "Check weekly performance"
- "Validate dashboard data"
- "Review this week's numbers"

**What It Does**:
1. Validates Nash data integrity
2. Calculates weekly CPD with anomaly exclusion (min_batch_size=10)
3. Analyzes carrier performance (FOX, NTG, FDC)
4. Identifies week-over-week trends
5. Validates dashboard alignment
6. Generates standard report

**Files Referenced**:
- `scripts/analysis/weekly_metrics.py`
- `scripts/analysis/cpd_analysis.py`
- `data/nash_data.csv`
- `public/dashboard.html`

## How the Learning System Works

### Pattern Detection
When you repeatedly explain the same workflow (2-3 times), the system:
1. **Tracks** the request type and your instructions
2. **Analyzes** common elements across examples
3. **Generates** a skill automatically at threshold
4. **Auto-invokes** the skill for future similar requests

### Pattern Tracking File
`.claude/learning/patterns.json` stores:
- **patterns**: Detected repetitive request types
- **skills_created**: Successfully generated skills
- **metadata**: System configuration (threshold=2)

### Example Flow

**Request 1:**
```
User: "Analyze this week's metrics. Load Nash data, calculate CPD excluding
       batches under 10 orders, check carrier performance, and validate
       against the dashboard."
Claude: [Follows instructions]
System: Records pattern (count: 1)
```

**Request 2:**
```
User: "Review weekly performance using the same methodology."
Claude: "🎓 I'm tracking this pattern. One more similar request and I'll
        create a reusable skill."
System: Records pattern (count: 2 - threshold reached!)
System: Auto-generates .claude/skills/metrics-analysis/SKILL.md
```

**Request 3+:**
```
User: "Analyze the metrics"
Claude: "✅ Using metrics-analysis skill..."
        [Executes full workflow automatically]
```

## Creating Skills Manually

You can also create skills manually by adding a new directory:

```bash
mkdir -p .claude/skills/my-custom-skill
nano .claude/skills/my-custom-skill/SKILL.md
```

### Skill File Format

```markdown
---
name: my-skill-name
description: Brief description of when to use this skill
version: 1.0.0
created: 2025-10-17
allowed-tools: [bash_tool, view, read, edit, web_search]
---

# Skill Name

## When to Use
- Trigger phrase 1
- Trigger phrase 2

## Methodology
1. Step 1
2. Step 2
3. Step 3

## Validation
- [ ] Check 1
- [ ] Check 2
```

## Using Skills

### Auto-Invocation
Just ask naturally:
- "Analyze the metrics" → Triggers `metrics-analysis`
- "Check API docs" → Would trigger `api-docs-lookup` (if created)

### Explicit Invocation
```
User: "Use the metrics-analysis skill for this week's data"
```

### Viewing Available Skills
```bash
# List all skills
ls -la .claude/skills/

# Read a skill
cat .claude/skills/metrics-analysis/SKILL.md

# Check pattern tracking
cat .claude/learning/patterns.json
```

## Skill Improvement

Skills improve with use. After each invocation:

1. **Note what worked**: Successful steps to keep
2. **Identify gaps**: Missing checks or validations
3. **Edit the skill**: Update `.claude/skills/[name]/SKILL.md` directly
4. **Changes persist**: Next time the skill is used, improvements apply

### Example Improvement

**Original Skill (v1.0.0)**:
```markdown
## Step 1: Load Data
python3 -c "import pandas as pd; df = pd.read_csv('data/nash_data.csv')"
```

**Improved Skill (v1.1.0)**:
```markdown
## Step 1: Load Data with Error Handling
python3 << 'EOF'
import pandas as pd
try:
    df = pd.read_csv('data/nash_data.csv')
    print(f"✅ Loaded {len(df)} rows")
except FileNotFoundError:
    print("❌ Nash data not found. Run upload first.")
    exit(1)
EOF
```

## Common Use Cases for Skills

### 1. Analysis Workflows
- Weekly metrics review
- Performance trend analysis
- Anomaly detection and reporting

### 2. Data Validation
- Nash CSV format verification
- Rate card consistency checks
- Store mapping validation

### 3. Deployment Tasks
- Pre-deployment checklist
- Test suite execution
- Build and validation gates

### 4. Documentation
- API documentation lookup (with auto-web-search)
- Technical reference generation
- Implementation guide updates

### 5. Reporting
- Weekly status reports
- Slack announcement formatting
- Executive summaries

## Advanced Features

### Web Search Integration
Skills can include web search for current information:

```markdown
---
name: api-docs-lookup
allowed-tools: [web_search, web_fetch, bash_tool, view]
---

## Instructions
1. ALWAYS web_search first: "[library] official documentation 2025"
2. Use web_fetch to read full docs
3. Prioritize official sources
```

### Skill Chaining
Skills can invoke other skills:

```markdown
## Step 1: Validate Data
Use the `data-validation` skill first.

## Step 2: Run Analysis
If validation passes, proceed with analysis.
```

### Conditional Logic
```markdown
## Decision Point
If CPD > $400:
  - Flag as critical issue
  - Use `alert-generation` skill
Else:
  - Continue with standard reporting
```

## Best Practices

### 1. Clear Triggers
Make skill descriptions and trigger phrases specific:
- ✅ "Analyze weekly CA delivery van metrics"
- ❌ "Do analysis"

### 2. Complete Workflows
Include all steps from start to finish:
- Data validation
- Core processing
- Output generation
- Validation gates

### 3. Error Handling
Anticipate common failures:
- Missing files
- Invalid data formats
- API unavailability

### 4. Documentation
Document why steps exist:
```markdown
## Step 3: Exclude Anomalies
# Why: Single-order batches skew CPD calculations
# How: Filter out batches < 10 orders
# Validation: Excluded count should be < 5% of total
```

### 5. Version Control
Update version numbers when improving:
```markdown
version: 1.1.0

## Changelog
- v1.1.0: Added error handling for missing Nash data
- v1.0.0: Initial creation
```

## Maintenance

### Reviewing Patterns
```bash
# Check what patterns are being tracked
cat .claude/learning/patterns.json | jq '.patterns'

# See which skills were auto-generated
cat .claude/learning/patterns.json | jq '.skills_created'
```

### Cleaning Up
```bash
# Remove obsolete patterns
nano .claude/learning/patterns.json

# Delete unused skills
rm -rf .claude/skills/old-skill-name/
```

### Exporting Skills
Skills are portable markdown files. Share them:
```bash
# Copy skill to another project
cp -r .claude/skills/metrics-analysis/ ../other-project/.claude/skills/

# Or commit to git for team sharing
git add .claude/skills/
git commit -m "Add metrics-analysis skill"
```

## Privacy & Security

- ✅ All skills stored **locally** in your repo
- ✅ No external data sharing
- ✅ Full transparency (readable markdown)
- ✅ Complete control (edit/delete anytime)
- ✅ Git-trackable (version history)

## Troubleshooting

### Skill Not Triggering
**Symptom**: Skill exists but Claude doesn't use it
**Fix**:
1. Check skill `description` includes clear trigger phrases
2. Verify skill file is named `SKILL.md` (case-sensitive)
3. Ensure frontmatter YAML is valid

### Pattern Not Learning
**Symptom**: Same request 3+ times but no skill generated
**Fix**:
1. Check `.claude/learning/patterns.json` exists
2. Verify threshold is set (default: 2)
3. Ensure requests are similar enough (intent detection)

### Skill Execution Errors
**Symptom**: Skill triggers but fails to execute
**Fix**:
1. Test skill steps manually first
2. Verify file paths are correct
3. Check required tools are listed in `allowed-tools`

## Future Enhancements

Potential additions to the system:
- [ ] Automated alerting (Slack integration)
- [ ] Skill performance analytics
- [ ] A/B testing different approaches
- [ ] Cross-project skill sharing
- [ ] Skill marketplace/templates

## Support

For questions or improvements:
1. Edit this README with your findings
2. Update skill files directly
3. Commit changes to preserve learnings

---

**Last Updated**: 2025-10-17
**System Version**: 1.0.0
**Skills Created**: 1
**Patterns Tracked**: 1
